/**
 * Standard Review Engine.
 *
 * Orchestrates the human-gate lifecycle: open a cycle when a campaign sits at a review gate,
 * collect anchored comments, record decisions through the approval chain, and — when the cycle
 * closes — produce the complete outcome: the workflow transition (validated by the deterministic
 * state machine), the contract events, the structured feedback for recompilation, and the
 * canonical Creative IR `Review` record.
 *
 * All operations return `Result` values (the repo-wide convention) and treat cycles as immutable
 * snapshots persisted through the registry. Time and ids are injected, so identical operation
 * sequences produce identical cycles and events.
 */

import { err, ok, type Result } from '@creative-factory/shared-kernel';
import type { CampaignLifecycleState, UserId } from '@creative-factory/domain';
import type { CreativeIR, Review, ReviewFeedback } from '@creative-factory/creative-ir';
import type { CreativeFactoryEventContract } from '@creative-factory/contracts';
import { evaluateTransition, type TransitionAccepted } from '@creative-factory/workflow-engine';
import { buildAnchorIndex, isAnchorValid } from './anchors.js';
import { buildLifecycleTransitionedEvent, buildReviewCompletedEvent } from './events.js';
import { compilerFeedback, structuredFeedback } from './feedback.js';
import { GATE_BINDINGS } from './gates.js';
import { toCreativeIRReview } from './ir-review.js';
import { DEFAULT_APPROVAL_POLICIES, evaluateChain, validatePolicy } from './policy.js';
import { InMemoryReviewRegistry, type ReviewRegistry } from './registry.js';
import { SequentialIdGenerator, SystemClock, type Clock, type IdGenerator } from './support.js';
import type {
  ApprovalPolicy,
  CommentAnchor,
  CommentSeverity,
  CommentThread,
  CommentThreadId,
  RecordedDecision,
  ReviewCycle,
  ReviewCycleId,
  ReviewError,
  ReviewTargetKind,
  ReviewVerdict,
  StructuredFeedbackItem,
} from './types.js';

export interface OpenCycleRequest {
  readonly campaignId: string;
  readonly creativeIR: CreativeIR;
  readonly targetKind: ReviewTargetKind;
  /** The campaign's current lifecycle state; must match the target kind's gate. */
  readonly lifecycleState: CampaignLifecycleState;
  readonly policy?: ApprovalPolicy;
  readonly deadline?: string;
}

export interface AddCommentRequest {
  readonly cycleId: ReviewCycleId;
  readonly author: UserId;
  readonly text: string;
  /** Anchor for a new thread; omit when replying via `threadId`. */
  readonly anchor?: CommentAnchor;
  /** Reply to an existing thread instead of opening a new one. */
  readonly threadId?: CommentThreadId;
  readonly severity?: CommentSeverity;
  readonly suggestedChange?: string;
}

export interface DecisionRequest {
  readonly cycleId: ReviewCycleId;
  readonly reviewer: UserId;
  readonly verdict: ReviewVerdict;
  readonly comment?: string;
}

/** Everything a closed cycle yields for the rest of the system. */
export interface ReviewOutcome {
  readonly cycle: ReviewCycle;
  /** The state-machine move this outcome drives, when one exists and validated. */
  readonly workflowTransition?: TransitionAccepted;
  /** Why no transition applies (e.g. changes requested at the final gate). */
  readonly transitionUnavailable?: string;
  readonly events: CreativeFactoryEventContract[];
  /** Compiler-facing feedback headers for `CompilerRequest.reviewFeedback`. */
  readonly feedback: ReviewFeedback[];
  /** Rich per-thread feedback for engines that act on content. */
  readonly structuredFeedback: StructuredFeedbackItem[];
  /** The canonical Review record to attach to the Creative IR. */
  readonly irReview: Review;
}

export interface DecisionResult {
  readonly cycle: ReviewCycle;
  /** Present when this decision closed the cycle. */
  readonly outcome?: ReviewOutcome;
}

export interface ReviewEngineDependencies {
  readonly registry?: ReviewRegistry;
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
}

export class StandardReviewEngine {
  private readonly registry: ReviewRegistry;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;

  constructor(deps: ReviewEngineDependencies = {}) {
    this.registry = deps.registry ?? new InMemoryReviewRegistry();
    this.clock = deps.clock ?? new SystemClock();
    this.ids = deps.ids ?? new SequentialIdGenerator();
  }

  openCycle(request: OpenCycleRequest): Result<ReviewCycle, ReviewError> {
    const binding = GATE_BINDINGS[request.targetKind];
    if (request.lifecycleState !== binding.gateState) {
      return err({
        code: 'WRONG_LIFECYCLE_STATE',
        message: `A ${request.targetKind} review requires lifecycle state ${binding.gateState}, campaign is in ${request.lifecycleState}`,
      });
    }

    const policy = request.policy ?? DEFAULT_APPROVAL_POLICIES[request.targetKind];
    const validated = validatePolicy(policy);
    if (!validated.ok) {
      return validated;
    }

    const cycle: ReviewCycle = {
      id: this.ids.generate('cycle') as ReviewCycleId,
      campaignId: request.campaignId,
      creativeIRId: String(request.creativeIR.id),
      targetKind: request.targetKind,
      state: 'open',
      openedAt: this.clock.now(),
      deadline: request.deadline,
      policy,
      currentLevel: 1,
      threads: [],
      decisions: [],
      anchorIndex: buildAnchorIndex(request.creativeIR),
    };

    this.registry.save(cycle);
    return ok(cycle);
  }

  addComment(
    request: AddCommentRequest,
  ): Result<{ cycle: ReviewCycle; thread: CommentThread }, ReviewError> {
    const open = this.requireOpenCycle(request.cycleId);
    if (!open.ok) {
      return open;
    }
    const cycle = open.value;

    const comment = {
      id: this.ids.generate('comment') as CommentThread['comments'][number]['id'],
      author: request.author,
      timestamp: this.clock.now(),
      text: request.text,
      suggestedChange: request.suggestedChange,
    };

    let thread: CommentThread;
    let threads: CommentThread[];

    if (request.threadId) {
      const existing = cycle.threads.find((candidate) => candidate.id === request.threadId);
      if (!existing) {
        return err({
          code: 'UNKNOWN_THREAD',
          message: `Thread "${request.threadId}" does not exist on cycle ${cycle.id}`,
        });
      }
      thread = { ...existing, comments: [...existing.comments, comment] };
      threads = cycle.threads.map((candidate) => (candidate.id === thread.id ? thread : candidate));
    } else {
      const anchor = request.anchor ?? { kind: 'document', targetId: cycle.creativeIRId };
      if (!isAnchorValid(anchor, cycle.anchorIndex)) {
        return err({
          code: 'UNKNOWN_ANCHOR',
          message: `Anchor "${anchor.targetId}" (${anchor.kind}) does not exist in the reviewed Creative IR`,
        });
      }
      thread = {
        id: this.ids.generate('thread') as CommentThreadId,
        anchor,
        severity: request.severity ?? 'major',
        comments: [comment],
        resolved: false,
      };
      threads = [...cycle.threads, thread];
    }

    const updated: ReviewCycle = { ...cycle, threads };
    this.registry.save(updated);
    return ok({ cycle: updated, thread });
  }

  resolveThread(
    cycleId: ReviewCycleId,
    threadId: CommentThreadId,
  ): Result<ReviewCycle, ReviewError> {
    const open = this.requireOpenCycle(cycleId);
    if (!open.ok) {
      return open;
    }
    const cycle = open.value;
    if (!cycle.threads.some((thread) => thread.id === threadId)) {
      return err({
        code: 'UNKNOWN_THREAD',
        message: `Thread "${threadId}" does not exist on cycle ${cycleId}`,
      });
    }
    const updated: ReviewCycle = {
      ...cycle,
      threads: cycle.threads.map((thread) =>
        thread.id === threadId ? { ...thread, resolved: true } : thread,
      ),
    };
    this.registry.save(updated);
    return ok(updated);
  }

  recordDecision(request: DecisionRequest): Result<DecisionResult, ReviewError> {
    const open = this.requireOpenCycle(request.cycleId);
    if (!open.ok) {
      return open;
    }
    const cycle = open.value;

    const alreadyDecidedAtLevel = cycle.decisions.some(
      (decision) => decision.reviewer === request.reviewer && decision.level === cycle.currentLevel,
    );
    if (alreadyDecidedAtLevel) {
      return err({
        code: 'DUPLICATE_REVIEWER',
        message: `Reviewer ${request.reviewer} already decided at level ${cycle.currentLevel} of cycle ${cycle.id}`,
      });
    }

    const decision: RecordedDecision = {
      id: this.ids.generate('decision') as RecordedDecision['id'],
      reviewer: request.reviewer,
      level: cycle.currentLevel,
      verdict: request.verdict,
      timestamp: this.clock.now(),
      comment: request.comment,
    };

    const decisions = [...cycle.decisions, decision];
    const evaluation = evaluateChain(cycle.policy, decisions);

    const closed = evaluation.state !== 'open';
    const updated: ReviewCycle = {
      ...cycle,
      decisions,
      state: evaluation.state,
      currentLevel: evaluation.currentLevel,
      closedAt: closed ? this.clock.now() : undefined,
    };
    this.registry.save(updated);

    if (!closed) {
      return ok({ cycle: updated });
    }
    return ok({ cycle: updated, outcome: this.buildOutcome(updated) });
  }

  cancelCycle(cycleId: ReviewCycleId): Result<ReviewCycle, ReviewError> {
    const open = this.requireOpenCycle(cycleId);
    if (!open.ok) {
      return open;
    }
    const updated: ReviewCycle = {
      ...open.value,
      state: 'cancelled',
      closedAt: this.clock.now(),
    };
    this.registry.save(updated);
    return ok(updated);
  }

  getCycle(cycleId: ReviewCycleId): ReviewCycle | undefined {
    return this.registry.getById(cycleId);
  }

  // ==========================================================================
  // Outcome assembly
  // ==========================================================================

  private buildOutcome(cycle: ReviewCycle): ReviewOutcome {
    const binding = GATE_BINDINGS[cycle.targetKind];
    const occurredAt = cycle.closedAt ?? this.clock.now();
    const events: CreativeFactoryEventContract[] = [];

    const reviewEvent = buildReviewCompletedEvent(cycle, this.ids.generate('evt'), occurredAt);
    if (reviewEvent) {
      events.push(reviewEvent);
    }

    let workflowTransition: TransitionAccepted | undefined;
    let transitionUnavailable: string | undefined;

    const transitionName =
      cycle.state === 'approved'
        ? binding.approveTransition
        : cycle.state === 'changes-requested'
          ? binding.changesTransition
          : cycle.state === 'rejected'
            ? binding.rejectTransition
            : undefined;

    if (!transitionName) {
      transitionUnavailable = `The state machine defines no transition for a ${cycle.state} outcome at the ${cycle.targetKind} gate; the campaign remains at ${binding.gateState}`;
    } else {
      const evaluated = evaluateTransition({ from: binding.gateState, transition: transitionName });
      if (evaluated.ok) {
        workflowTransition = evaluated.value;
        events.push(
          buildLifecycleTransitionedEvent(
            cycle,
            evaluated.value,
            this.ids.generate('evt'),
            occurredAt,
          ),
        );
      } else {
        transitionUnavailable = evaluated.error.message;
      }
    }

    return {
      cycle,
      workflowTransition,
      transitionUnavailable,
      events,
      feedback: compilerFeedback(cycle),
      structuredFeedback: structuredFeedback(cycle),
      irReview: toCreativeIRReview(cycle),
    };
  }

  private requireOpenCycle(cycleId: ReviewCycleId): Result<ReviewCycle, ReviewError> {
    const cycle = this.registry.getById(cycleId);
    if (!cycle) {
      return err({ code: 'CYCLE_NOT_OPEN', message: `Review cycle "${cycleId}" does not exist` });
    }
    if (cycle.state !== 'open') {
      return err({
        code: 'CYCLE_NOT_OPEN',
        message: `Review cycle "${cycleId}" is ${cycle.state}, not open`,
      });
    }
    return ok(cycle);
  }
}

/**
 * Review Engine model.
 *
 * A `ReviewCycle` is opened when a campaign reaches one of the four human gates
 * (strategy / storyboard / assets / final). Reviewers attach comments to specific Creative IR
 * nodes, record decisions, and the cycle advances through a configurable multi-level approval
 * chain until it closes — approved, changes-requested, or rejected. Closing a cycle yields the
 * workflow transition, contract events, and structured feedback for recompilation.
 *
 * Everything here is a plain, serializable value: cycles are immutable snapshots that engine
 * operations replace rather than mutate.
 */

import type { ISO8601Timestamp, UserId } from '@creative-factory/domain';

// ============================================================================
// Identifiers
// ============================================================================

export type ReviewCycleId = string & { readonly __brand: 'ReviewCycleId' };
export type CommentThreadId = string & { readonly __brand: 'CommentThreadId' };
export type ReviewCommentId = string & { readonly __brand: 'ReviewCommentId' };
export type DecisionId = string & { readonly __brand: 'DecisionId' };

// ============================================================================
// Targets & anchors
// ============================================================================

/** Which human gate this review cycle serves. */
export type ReviewTargetKind = 'strategy' | 'storyboard' | 'assets' | 'final';

/** The kind of Creative IR node a comment is anchored to. */
export type AnchorKind = 'document' | 'story' | 'storyboard' | 'scene' | 'shot' | 'asset-request';

/**
 * A structural reference into the Creative IR. Comments never float free: they point at the
 * document itself or at a specific story/storyboard/scene/shot/asset-request by id, validated
 * against the reviewed document when the comment is added.
 */
export interface CommentAnchor {
  readonly kind: AnchorKind;
  readonly targetId: string;
}

// ============================================================================
// Comments
// ============================================================================

export type CommentSeverity = 'blocking' | 'major' | 'minor';

export interface ReviewCycleComment {
  readonly id: ReviewCommentId;
  readonly author: UserId;
  readonly timestamp: ISO8601Timestamp;
  readonly text: string;
  /** Optional concrete change proposal, carried into structured feedback. */
  readonly suggestedChange?: string;
}

export interface CommentThread {
  readonly id: CommentThreadId;
  readonly anchor: CommentAnchor;
  readonly severity: CommentSeverity;
  readonly comments: readonly ReviewCycleComment[];
  readonly resolved: boolean;
}

// ============================================================================
// Approval policy
// ============================================================================

export type ApprovalType = 'creative' | 'brand' | 'legal' | 'final';

export interface ApprovalStep {
  /** 1-based position in the chain; the cycle advances level by level. */
  readonly level: number;
  readonly approvalType: ApprovalType;
  readonly description: string;
  /** How many distinct approvals complete this step (quorum). */
  readonly minApprovals: number;
}

export type EscalationBehavior = 'advance-to-next-level' | 'terminate';

export interface ApprovalPolicy {
  readonly targetKind: ReviewTargetKind;
  /** Ordered chain; must be non-empty with strictly increasing levels. */
  readonly steps: readonly ApprovalStep[];
  /** What an `escalate` verdict does: jump to the next level, or close the cycle as rejected. */
  readonly escalation: EscalationBehavior;
}

// ============================================================================
// Decisions
// ============================================================================

export type ReviewVerdict =
  | 'approve'
  | 'approve-with-changes'
  | 'request-changes'
  | 'reject'
  | 'escalate';

export interface RecordedDecision {
  readonly id: DecisionId;
  readonly reviewer: UserId;
  /** Chain level the decision was recorded at. */
  readonly level: number;
  readonly verdict: ReviewVerdict;
  readonly timestamp: ISO8601Timestamp;
  readonly comment?: string;
}

// ============================================================================
// Review cycle
// ============================================================================

export type ReviewCycleState = 'open' | 'approved' | 'changes-requested' | 'rejected' | 'cancelled';

export interface ReviewCycle {
  readonly id: ReviewCycleId;
  readonly campaignId: string;
  readonly creativeIRId: string;
  readonly targetKind: ReviewTargetKind;
  readonly state: ReviewCycleState;
  readonly openedAt: ISO8601Timestamp;
  readonly closedAt?: ISO8601Timestamp;
  readonly deadline?: ISO8601Timestamp;
  /** Snapshot of the policy this cycle runs under (policy changes never affect open cycles). */
  readonly policy: ApprovalPolicy;
  /** Current approval-chain level awaiting decisions (1-based). */
  readonly currentLevel: number;
  readonly threads: readonly CommentThread[];
  readonly decisions: readonly RecordedDecision[];
  /**
   * Ids of every anchorable node in the reviewed Creative IR, captured at open time so comment
   * anchors are validated against the exact document under review.
   */
  readonly anchorIndex: readonly string[];
}

// ============================================================================
// Structured feedback
// ============================================================================

/**
 * A single normalized feedback item derived from an unresolved thread of a changes-requested
 * cycle. Richer than the compiler's `ReviewFeedback` header; downstream engines that learn to
 * act on feedback consume these.
 */
export interface StructuredFeedbackItem {
  readonly cycleId: ReviewCycleId;
  readonly anchor: CommentAnchor;
  readonly severity: CommentSeverity;
  readonly text: string;
  readonly suggestedChange?: string;
}

// ============================================================================
// Errors
// ============================================================================

export type ReviewErrorCode =
  | 'WRONG_LIFECYCLE_STATE'
  | 'CYCLE_NOT_OPEN'
  | 'UNKNOWN_ANCHOR'
  | 'UNKNOWN_THREAD'
  | 'INVALID_POLICY'
  | 'DUPLICATE_REVIEWER'
  | 'NO_TRANSITION_FOR_VERDICT';

export interface ReviewError {
  readonly code: ReviewErrorCode;
  readonly message: string;
}

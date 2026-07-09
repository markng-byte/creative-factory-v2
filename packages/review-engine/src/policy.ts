/**
 * Approval policies.
 *
 * A policy is an ordered chain of approval steps (creative → brand → legal → final), each with
 * a quorum. `evaluateChain` is the pure decision-fold: given a cycle's policy and its recorded
 * decisions, it computes the cycle's resulting state and the level now awaiting review.
 *
 * Rules:
 * - `approve` / `approve-with-changes` count toward the current step's quorum.
 * - `request-changes` closes the cycle as changes-requested immediately (any level).
 * - `reject` closes the cycle as rejected immediately (any level).
 * - `escalate` either jumps the cycle to the next level (skipping remaining quorum) or, when
 *   the policy terminates on escalation or no higher level exists, closes it as rejected.
 * - When the last step's quorum is met, the cycle is approved.
 */

import { err, ok, type Result } from '@creative-factory/shared-kernel';
import type {
  ApprovalPolicy,
  RecordedDecision,
  ReviewCycleState,
  ReviewError,
  ReviewTargetKind,
} from './types.js';

/** Enterprise default chains per gate; override by passing a policy when opening a cycle. */
export const DEFAULT_APPROVAL_POLICIES: Readonly<Record<ReviewTargetKind, ApprovalPolicy>> = {
  strategy: {
    targetKind: 'strategy',
    escalation: 'advance-to-next-level',
    steps: [
      {
        level: 1,
        approvalType: 'creative',
        description: 'Creative direction sign-off',
        minApprovals: 1,
      },
      { level: 2, approvalType: 'brand', description: 'Brand alignment sign-off', minApprovals: 1 },
    ],
  },
  storyboard: {
    targetKind: 'storyboard',
    escalation: 'advance-to-next-level',
    steps: [
      {
        level: 1,
        approvalType: 'creative',
        description: 'Storyboard craft sign-off',
        minApprovals: 1,
      },
      {
        level: 2,
        approvalType: 'brand',
        description: 'Brand compliance sign-off',
        minApprovals: 1,
      },
    ],
  },
  assets: {
    targetKind: 'assets',
    escalation: 'advance-to-next-level',
    steps: [
      {
        level: 1,
        approvalType: 'creative',
        description: 'Asset quality sign-off',
        minApprovals: 1,
      },
      {
        level: 2,
        approvalType: 'brand',
        description: 'Brand compliance sign-off',
        minApprovals: 1,
      },
      {
        level: 3,
        approvalType: 'legal',
        description: 'Legal & compliance sign-off',
        minApprovals: 1,
      },
    ],
  },
  final: {
    targetKind: 'final',
    escalation: 'terminate',
    steps: [
      { level: 1, approvalType: 'final', description: 'Final release approval', minApprovals: 1 },
    ],
  },
};

export function validatePolicy(policy: ApprovalPolicy): Result<ApprovalPolicy, ReviewError> {
  if (policy.steps.length === 0) {
    return err({
      code: 'INVALID_POLICY',
      message: 'Approval policy must define at least one step',
    });
  }
  for (let i = 0; i < policy.steps.length; i += 1) {
    const step = policy.steps[i];
    if (!step || step.level !== i + 1) {
      return err({
        code: 'INVALID_POLICY',
        message: 'Approval steps must use contiguous 1-based levels in order',
      });
    }
    if (step.minApprovals < 1) {
      return err({
        code: 'INVALID_POLICY',
        message: `Step ${step.level} must require at least one approval`,
      });
    }
  }
  return ok(policy);
}

export interface ChainEvaluation {
  readonly state: ReviewCycleState;
  readonly currentLevel: number;
}

export function evaluateChain(
  policy: ApprovalPolicy,
  decisions: readonly RecordedDecision[],
): ChainEvaluation {
  const maxLevel = policy.steps.length;
  let level = 1;
  let approvals = 0;

  for (const decision of decisions) {
    switch (decision.verdict) {
      case 'request-changes':
        return { state: 'changes-requested', currentLevel: level };
      case 'reject':
        return { state: 'rejected', currentLevel: level };
      case 'escalate': {
        if (policy.escalation === 'terminate' || level >= maxLevel) {
          return { state: 'rejected', currentLevel: level };
        }
        level += 1;
        approvals = 0;
        break;
      }
      case 'approve':
      case 'approve-with-changes': {
        approvals += 1;
        const step = policy.steps[level - 1];
        if (step && approvals >= step.minApprovals) {
          if (level >= maxLevel) {
            return { state: 'approved', currentLevel: level };
          }
          level += 1;
          approvals = 0;
        }
        break;
      }
    }
  }

  return { state: 'open', currentLevel: level };
}

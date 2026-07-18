/**
 * Contract event builders.
 *
 * Emits the repository's existing versioned event contracts — `review.completed` and
 * `campaign.lifecycle.transitioned` — from a closed review cycle. Event ids and timestamps come
 * from the engine's injected id generator and clock, keeping event streams deterministic in
 * tests.
 */

import type { ReviewDecision } from '@creative-factory/domain';
import type {
  CampaignLifecycleTransitionedContract,
  ReviewCompletedContract,
} from '@creative-factory/contracts';
import type { TransitionAccepted } from '@creative-factory/workflow-engine';
import type { ReviewCycle, ReviewCycleState } from './types.js';

const DECISION_BY_STATE: Partial<Record<ReviewCycleState, ReviewDecision>> = {
  approved: 'APPROVE',
  'changes-requested': 'REQUEST_CHANGES',
  rejected: 'REJECT',
};

export function reviewDecisionForState(state: ReviewCycleState): ReviewDecision | undefined {
  return DECISION_BY_STATE[state];
}

export function buildReviewCompletedEvent(
  cycle: ReviewCycle,
  eventId: string,
  occurredAt: string,
): ReviewCompletedContract | undefined {
  const decision = reviewDecisionForState(cycle.state);
  if (!decision) {
    return undefined;
  }
  return {
    id: eventId,
    name: 'review.completed',
    version: 1,
    occurredAt,
    aggregateId: cycle.campaignId,
    correlationId: String(cycle.id),
    payload: {
      campaignId: cycle.campaignId,
      reviewCycleId: String(cycle.id),
      decision,
    },
  };
}

export function buildLifecycleTransitionedEvent(
  cycle: ReviewCycle,
  transition: TransitionAccepted,
  eventId: string,
  occurredAt: string,
): CampaignLifecycleTransitionedContract {
  return {
    id: eventId,
    name: 'campaign.lifecycle.transitioned',
    version: 1,
    occurredAt,
    aggregateId: cycle.campaignId,
    causationId: String(cycle.id),
    correlationId: String(cycle.id),
    payload: {
      campaignId: cycle.campaignId,
      from: transition.from,
      to: transition.to,
      reason: `Review cycle ${cycle.id} closed as ${cycle.state} (${cycle.targetKind} gate)`,
    },
  };
}

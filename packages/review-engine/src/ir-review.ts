/**
 * Creative IR review mapping.
 *
 * Projects a closed review cycle onto the canonical `Review` type already defined in
 * `@creative-factory/creative-ir`, so the review becomes part of the document's own record.
 *
 * Decision mapping (the IR enum has no changes-requested value):
 * - approved, no approve-with-changes verdicts → 'approved'
 * - approved with any approve-with-changes verdict → 'approved-with-changes'
 * - changes-requested or rejected → 'rejected'
 * - still open → 'pending'
 */

import { createReviewId, type Review, type ReviewComment } from '@creative-factory/creative-ir';
import { createUserId } from '@creative-factory/domain';
import type { ReviewCycle } from './types.js';

export function toCreativeIRReview(cycle: ReviewCycle): Review {
  const lastDecision = cycle.decisions[cycle.decisions.length - 1];

  const comments: ReviewComment[] = cycle.threads.flatMap((thread) =>
    thread.comments.map((comment) => ({
      id: String(comment.id),
      author: comment.author,
      timestamp: comment.timestamp,
      text: comment.text,
      resolved: thread.resolved,
    })),
  );

  return {
    id: createReviewId(String(cycle.id)),
    createdAt: cycle.openedAt,
    reviewedBy: lastDecision?.reviewer ?? createUserId('unassigned'),
    reviewType: cycle.targetKind,
    status: cycle.state === 'open' ? 'in-progress' : 'completed',
    targetId: cycle.creativeIRId,
    decision: mapDecision(cycle),
    comments,
    attachments: [],
    deadline: cycle.deadline,
  };
}

function mapDecision(cycle: ReviewCycle): Review['decision'] {
  switch (cycle.state) {
    case 'approved':
      return cycle.decisions.some((decision) => decision.verdict === 'approve-with-changes')
        ? 'approved-with-changes'
        : 'approved';
    case 'changes-requested':
    case 'rejected':
    case 'cancelled':
      return 'rejected';
    default:
      return 'pending';
  }
}

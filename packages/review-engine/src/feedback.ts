/**
 * Feedback normalization.
 *
 * Turns a closed changes-requested cycle into (a) the compiler-facing `ReviewFeedback` header
 * that `CompilerRequest.reviewFeedback` accepts — closing the review → recompile loop — and
 * (b) rich `StructuredFeedbackItem`s (anchor + severity + text + suggested change) for engines
 * that will learn to act on feedback content.
 */

import type { ReviewFeedback } from '@creative-factory/creative-ir';
import type { CommentSeverity, ReviewCycle, StructuredFeedbackItem } from './types.js';

const SEVERITY_PRIORITY: Record<CommentSeverity, number> = {
  blocking: 1,
  major: 2,
  minor: 3,
};

/** Rich feedback: one item per unresolved thread, most severe first (stable order). */
export function structuredFeedback(cycle: ReviewCycle): StructuredFeedbackItem[] {
  return cycle.threads
    .filter((thread) => !thread.resolved && thread.comments.length > 0)
    .map((thread) => {
      const lead = thread.comments[0];
      return {
        cycleId: cycle.id,
        anchor: thread.anchor,
        severity: thread.severity,
        text: lead?.text ?? '',
        suggestedChange: lead?.suggestedChange,
      };
    })
    .sort(
      (a, b) =>
        SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity] ||
        a.anchor.targetId.localeCompare(b.anchor.targetId),
    );
}

/** Compiler-facing header: one `ReviewFeedback` per cycle, priority = worst unresolved severity. */
export function compilerFeedback(cycle: ReviewCycle): ReviewFeedback[] {
  if (cycle.state !== 'changes-requested' || !cycle.closedAt) {
    return [];
  }
  const items = structuredFeedback(cycle);
  const priority =
    items.length > 0 ? SEVERITY_PRIORITY[items[0]?.severity ?? 'major'] : SEVERITY_PRIORITY.major;
  return [
    {
      reviewId: String(cycle.id),
      applicableSince: cycle.closedAt,
      priority,
    },
  ];
}

/**
 * Optimization recommendations.
 *
 * Deterministic, heuristic suggestions derived from an `AnalyticsReport`. Each rule is a pure
 * function of the metrics; thresholds are explicit. This is the "optimization" half of the sprint —
 * turning observation into concrete guidance for the next run.
 */

import { pct } from './support.js';
import type { AnalyticsReport, OptimizationRecommendation } from './types.js';

const QA_FAIL_WARN = 0.1;
const DEDUP_INFO = 0.3;

export function deriveRecommendations(report: AnalyticsReport): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = [];

  const failRate =
    report.quality.assessed > 0 ? report.quality.failed / report.quality.assessed : 0;
  if (failRate > QA_FAIL_WARN) {
    recommendations.push({
      id: 'qa-fail-rate',
      category: 'quality',
      severity: 'warning',
      message: `QA rejection rate is ${pct(failRate)} — tighten prompt brand controls or composition rules before regenerating.`,
      metric: `failed=${report.quality.failed}/${report.quality.assessed}`,
    });
  }

  if (report.assets.pending > 0) {
    recommendations.push({
      id: 'incomplete-generation',
      category: 'coverage',
      severity: 'info',
      message: `${report.assets.pending} asset request(s) have not been generated (e.g. audio) — complete generation for full campaign coverage.`,
      metric: `pending=${report.assets.pending}/${report.assets.total}`,
    });
  }

  if (report.reuse.dedupRate > DEDUP_INFO) {
    recommendations.push({
      id: 'high-dedup',
      category: 'efficiency',
      severity: 'info',
      message: `${pct(report.reuse.dedupRate)} of catalogued assets were duplicates — reuse existing library versions instead of regenerating to cut cost.`,
      metric: `deduped=${report.reuse.deduped}/${report.reuse.cataloged}`,
    });
  }

  if (report.activity.reviewsCompleted === 0) {
    recommendations.push({
      id: 'no-human-review',
      category: 'governance',
      severity: 'info',
      message:
        'No human review cycles were recorded — ensure the strategy/storyboard/asset gates ran before publishing.',
      metric: 'reviewsCompleted=0',
    });
  }

  if (report.lifecycle.completed) {
    recommendations.push({
      id: 'completed',
      category: 'lifecycle',
      severity: 'success',
      message:
        'Campaign reached COMPLETED — the full brief → published lifecycle executed end-to-end.',
    });
  } else {
    recommendations.push({
      id: 'not-completed',
      category: 'lifecycle',
      severity: 'warning',
      message: `Campaign has not reached COMPLETED (reached: ${report.lifecycle.reachedStates.join(' → ') || 'none'}).`,
    });
  }

  return recommendations;
}

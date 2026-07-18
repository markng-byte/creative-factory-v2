/**
 * Standard Analytics & Optimization Engine.
 *
 * Observes a campaign end-to-end — reading the Creative IR and the event stream emitted by the
 * pipeline engines — and produces an analytics report, deterministic optimization recommendations,
 * and a viewable dashboard. It is read-only: analytics never mutates the Creative IR.
 *
 * Deterministic: pure computation over the inputs with injected clock/id ports.
 */

import type { CreativeIR } from '@creative-factory/creative-ir';
import type { CreativeFactoryEventContract } from '@creative-factory/contracts';
import { assembleDashboard } from './dashboard.js';
import { computeReport } from './metrics.js';
import { deriveRecommendations } from './recommendations.js';
import { DeterministicIdGenerator, SystemClock, type Clock, type IdGenerator } from './support.js';
import type { AnalyticsReport, OptimizationRecommendation } from './types.js';

export const ANALYTICS_ENGINE_VERSION = '1.0.0' as const;

export interface AnalyticsEngineDependencies {
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
}

export interface AnalyticsOutcome {
  readonly report: AnalyticsReport;
  readonly recommendations: readonly OptimizationRecommendation[];
  /** Self-contained HTML dashboard summarizing the report and recommendations. */
  readonly dashboard: string;
}

export class StandardAnalyticsEngine {
  private readonly clock: Clock;
  private readonly ids: IdGenerator;

  constructor(deps: AnalyticsEngineDependencies = {}) {
    this.clock = deps.clock ?? new SystemClock();
    this.ids = deps.ids ?? new DeterministicIdGenerator();
  }

  analyze(
    creativeIR: CreativeIR,
    events: readonly CreativeFactoryEventContract[] = [],
  ): AnalyticsOutcome {
    const generatedAt = this.clock.now();
    const reportId = this.ids.generate('analytics', String(creativeIR.id));
    const report = computeReport(creativeIR, events, reportId, generatedAt);
    const recommendations = deriveRecommendations(report);
    const dashboard = assembleDashboard(report, recommendations);
    return { report, recommendations, dashboard };
  }
}

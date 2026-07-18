/**
 * @creative-factory/analytics-engine
 *
 * The Analytics & Optimization Engine (Sprint 13). Observes a campaign end-to-end by reading the
 * Creative IR and the pipeline's event stream, and produces an analytics report, deterministic
 * heuristic optimization recommendations, and a viewable HTML dashboard. Read-only and
 * deterministic; no AI provider.
 *
 * @packageDocumentation
 */

export const ANALYTICS_ENGINE_PACKAGE = '@creative-factory/analytics-engine' as const;

// Engine
export {
  StandardAnalyticsEngine,
  ANALYTICS_ENGINE_VERSION,
  type AnalyticsEngineDependencies,
  type AnalyticsOutcome,
} from './engine.js';

// Computation
export { computeReport } from './metrics.js';
export { deriveRecommendations } from './recommendations.js';
export { assembleDashboard } from './dashboard.js';

// Model
export type {
  ActivityMetrics,
  AnalyticsReport,
  AssetMetrics,
  LifecycleMetrics,
  OptimizationRecommendation,
  QualityMetrics,
  RecommendationSeverity,
  ReuseMetrics,
  StructureMetrics,
} from './types.js';

// Support
export {
  DeterministicIdGenerator,
  FixedClock,
  SystemClock,
  fnv1a,
  pct,
  ratio,
  type Clock,
  type IdGenerator,
} from './support.js';

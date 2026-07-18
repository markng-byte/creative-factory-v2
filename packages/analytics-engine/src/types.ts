/**
 * Analytics model.
 *
 * `AnalyticsReport` is the computed observation of a campaign's lifecycle, folded from the Creative
 * IR and the event stream. `OptimizationRecommendation`s are deterministic, heuristic suggestions
 * derived from the report. All plain, serializable data.
 */

export interface StructureMetrics {
  readonly stories: number;
  readonly storyboards: number;
  readonly scenes: number;
  readonly shots: number;
  readonly assetRequests: number;
}

export interface AssetMetrics {
  readonly total: number;
  readonly byType: Readonly<Record<string, number>>;
  readonly generated: number;
  readonly approved: number;
  readonly rejected: number;
  readonly pending: number;
  readonly generationRate: number;
}

export interface QualityMetrics {
  readonly assessed: number;
  readonly passed: number;
  readonly failed: number;
  readonly passRate: number;
}

export interface ReuseMetrics {
  readonly cataloged: number;
  readonly deduped: number;
  readonly dedupRate: number;
}

export interface ActivityMetrics {
  readonly promptsGenerated: number;
  readonly assetsGenerated: number;
  readonly assetsCataloged: number;
  readonly exportsPublished: number;
  readonly reviewsCompleted: number;
  readonly qaRuns: number;
}

export interface LifecycleMetrics {
  readonly transitions: ReadonlyArray<{ from: string; to: string; at: string }>;
  readonly reachedStates: readonly string[];
  readonly completed: boolean;
}

export interface AnalyticsReport {
  readonly reportId: string;
  readonly campaignId: string;
  readonly creativeIRId: string;
  readonly generatedAt: string;
  readonly structure: StructureMetrics;
  readonly assets: AssetMetrics;
  readonly quality: QualityMetrics;
  readonly reuse: ReuseMetrics;
  readonly activity: ActivityMetrics;
  readonly lifecycle: LifecycleMetrics;
  readonly eventCounts: Readonly<Record<string, number>>;
}

export type RecommendationSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface OptimizationRecommendation {
  readonly id: string;
  readonly category: string;
  readonly severity: RecommendationSeverity;
  readonly message: string;
  readonly metric?: string;
}

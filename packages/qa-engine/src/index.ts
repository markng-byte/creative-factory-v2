/**
 * @creative-factory/qa-engine
 *
 * The QA & Brand Compliance Engine (Sprint 10). Runs a pluggable rule set over every generated
 * asset in a Creative IR — inspecting the actual rendered content — and produces a QA report,
 * writes each asset's `qaStatus` back into the Creative IR, emits a `qa.completed` event, and
 * recommends the asset-review workflow transition when QA passes. Deterministic; no AI provider is
 * contacted.
 *
 * @packageDocumentation
 */

export const QA_ENGINE_PACKAGE = '@creative-factory/qa-engine' as const;

// Engine
export {
  StandardQaEngine,
  QA_ENGINE_VERSION,
  type QaEngineDependencies,
  type QaOutcome,
  type QaRunOptions,
} from './engine.js';

// Rules
export {
  DEFAULT_QA_RULES,
  brandPaletteRule,
  contentIntegrityRule,
  dimensionMatchRule,
  prohibitedAbsentRule,
} from './rules.js';

// Model
export type {
  AssetQaResult,
  AssetQaStatus,
  QaFinding,
  QaOverall,
  QaReport,
  QaRule,
  QaRuleContext,
  QaSeverity,
} from './types.js';

// Support
export {
  DeterministicIdGenerator,
  FixedClock,
  SystemClock,
  decodeContent,
  fnv1a,
  type Clock,
  type IdGenerator,
} from './support.js';

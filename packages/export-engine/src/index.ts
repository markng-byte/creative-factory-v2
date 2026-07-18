/**
 * @creative-factory/export-engine
 *
 * The Export & Publishing Engine (Sprint 12) — the final stage. It assembles a production
 * `ExportPackage` from a Creative IR's approved, catalogued assets (a manifest, per-aspect-ratio
 * channel bundles, and viewable deliverables including a finished campaign page), publishes each
 * bundle through a dispatch seam (default: an offline dry run), records `ExportMetadata` back into
 * the Creative IR, drives the export workflow transitions, and emits `export.published` and
 * lifecycle events. Deterministic; no external service is contacted.
 *
 * @packageDocumentation
 */

export const EXPORT_ENGINE_PACKAGE = '@creative-factory/export-engine' as const;

// Engine
export {
  StandardExportEngine,
  EXPORT_ENGINE_VERSION,
  type ExportEngineDependencies,
  type ExportEvent,
  type ExportOutcome,
  type ExportRunOptions,
} from './engine.js';

// Publish dispatch seam
export { DryRunPublishTarget, DRY_RUN_TARGET_NAME, type PublishTarget } from './publish.js';

// Manifest & deliverables
export { buildManifest, buildBundles } from './manifest.js';
export { assembleCampaignPage, buildManifestJson } from './deliverable.js';

// Model
export type {
  ChannelBundle,
  ExportDeliverable,
  ExportManifest,
  ExportPackage,
  ManifestEntry,
  PublishResult,
} from './types.js';

// Support
export {
  DeterministicIdGenerator,
  FixedClock,
  SystemClock,
  aspectRatioOf,
  contentHash,
  escapeHtml,
  fnv1a,
  type Clock,
  type IdGenerator,
} from './support.js';

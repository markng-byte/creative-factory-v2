/**
 * @creative-factory/creative-ir-adapters
 *
 * Output adapters (Phase 2 of the Creative IR Compiler). Each adapter reads a Creative IR and
 * emits a production artifact without ever mutating the IR. The Creative Package bundles them into
 * the canonical input for downstream generation engines.
 *
 * @packageDocumentation
 */

export const CREATIVE_IR_ADAPTERS_PACKAGE = '@creative-factory/creative-ir-adapters' as const;

export { BaseAdapter, eachScene, type BuildResult } from './base.js';

// Adapters
export { StandardStoryboardHTMLAdapter } from './storyboard-html.js';
export { StandardSceneSpecAdapter } from './scene-spec.js';
export { StandardShotListAdapter } from './shot-list.js';
export { StandardMotionSpecAdapter } from './motion-spec.js';
export { StandardAssetPlanAdapter } from './asset-plan.js';
export { StandardTimelineAdapter } from './timeline.js';
export { StandardQASpecAdapter } from './qa-spec.js';

// Registry
export { StandardAdapterRegistry } from './registry.js';

// Creative Package
export {
  CREATIVE_PACKAGE_VERSION,
  assembleCreativePackage,
  createStandardAdapters,
  renderCreativePackage,
  runAdapters,
  type CreativeMetadata,
  type CreativePackage,
  type CreativePackageArtifact,
} from './creative-package.js';

// Support
export { durationToFrames, durationToSeconds, escapeHtml } from './support.js';

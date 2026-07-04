/**
 * @creative-factory/creative-ir-compiler
 *
 * The deterministic Creative IR Compiler. Given a Creative Brief, Campaign, and Brand Tokens it
 * builds a fully-populated, schema-valid Creative IR through a pure nine-stage planning pipeline
 * (narrative → story → storyboard → scene → shot → composition → motion → timing → asset), then
 * runs any registered output adapters. No AI provider is ever contacted.
 *
 * @packageDocumentation
 */

export const CREATIVE_IR_COMPILER_PACKAGE = '@creative-factory/creative-ir-compiler' as const;

export { COMPILER_VERSION, EMITTED_SCHEMA_VERSION } from './version.js';

// Compiler
export {
  StandardCreativeIRCompiler,
  CompilationError,
  type CompilerDependencies,
} from './compiler.js';

// Pipeline (for advanced callers / testing)
export { buildCreativeIR } from './pipeline.js';

// Ports
export type {
  BrandTokensBundle,
  BrandTokensSource,
  CampaignSource,
  CompileInputs,
  CompilerPorts,
  CreativeBriefSource,
  PlanningContext,
} from './ports.js';

// Support
export { SystemClock, FixedClock, type Clock } from './support/clock.js';
export { DeterministicIdGenerator, RandomIdGenerator, type IdGenerator } from './support/id.js';
export { fnv1a, checksum } from './support/hash.js';

// In-memory sources (tests, examples, local dev)
export {
  InMemoryCreativeBriefSource,
  InMemoryCampaignSource,
  InMemoryBrandTokensSource,
} from './sources/in-memory.js';

// Worked example inputs
export { exampleCreativeBrief, exampleCampaign, exampleBrandBundle } from './examples.js';

// Planning stages + blueprints
export * from './stages/index.js';
export type {
  EmotionalWaypoint,
  NarrativeBlueprint,
  PlannedShot,
  SceneDraft,
  ShotDraft,
  StoryBeat,
  StoryBeatKind,
  StoryboardDraft,
  StoryDraft,
  TimingPlan,
} from './model.js';

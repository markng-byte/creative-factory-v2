/**
 * @creative-factory/pipeline
 *
 * The top-level orchestrator (Sprint 14). `createPipeline` wires all thirteen engines together;
 * `StandardPipeline.run` executes the whole system deterministically end to end — Creative Brief →
 * compile → translate → generate (image + video) → QA → catalog → export → analytics — returning the
 * finished, analyzed campaign and the complete event stream. No AI provider is contacted.
 *
 * @packageDocumentation
 */

export const PIPELINE_PACKAGE = '@creative-factory/pipeline' as const;

export {
  StandardPipeline,
  createPipeline,
  type CreatePipelineOptions,
  type PipelineEngines,
  type PipelineResult,
  type PipelineSummary,
} from './pipeline.js';

export {
  DeterministicIdGenerator,
  FixedClock,
  SystemClock,
  fnv1a,
  type Clock,
  type IdGenerator,
} from './support.js';

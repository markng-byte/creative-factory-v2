/**
 * @creative-factory/prompt-translation
 *
 * The Prompt Translation Engine (Sprint 7). Translates an approved Creative IR into deterministic,
 * provider-neutral prompt packages for image, video, and voiceover generation — the canonical
 * input to the downstream generation engines. This is the architecture's designated point of
 * provider coupling, but the core only *prepares* prompts: a real provider is addressed solely
 * through the dispatch seam, which defaults to an offline dry run.
 *
 * @packageDocumentation
 */

export const PROMPT_TRANSLATION_PACKAGE = '@creative-factory/prompt-translation' as const;

// Engine
export {
  StandardPromptTranslationEngine,
  PROMPT_TRANSLATION_ENGINE_VERSION,
  type PromptTranslationDependencies,
  type TranslateResult,
} from './engine.js';

// Creative IR adapter
export { StandardPromptTranslationAdapter } from './adapter.js';

// Targets
export { brandControls, negativeTerms, type PromptTarget, type ResolvedContext } from './target.js';
export { ImagePromptTarget } from './targets/image.js';
export { VideoPromptTarget } from './targets/video.js';
export { VoiceoverPromptTarget } from './targets/voiceover.js';

// Provider dispatch seam
export { DryRunProvider, type DispatchResult, type PromptProvider } from './provider.js';

// Model
export type { PromptPackage, PromptRequest, PromptTargetKind, TranslationUnit } from './types.js';

// Support
export {
  DeterministicIdGenerator,
  FixedClock,
  SystemClock,
  fnv1a,
  sourceHash,
  type Clock,
  type IdGenerator,
} from './support.js';

/**
 * @creative-factory/video-generation
 *
 * The Video Generation Engine (Sprint 9): the second concrete provider behind the Prompt
 * Translation dispatch seam, and a direct mirror of the Image Generation Engine. It renders
 * deterministic animated (SMIL) videos for video prompts, records `AssetOutput`s with provenance,
 * stores the viewable bytes, and writes the results back into the Creative IR. No live AI provider
 * is contacted — the synthetic renderer is offline and reproducible, and a real video API drops
 * into the same `PromptProvider` seam.
 *
 * @packageDocumentation
 */

export const VIDEO_GENERATION_PACKAGE = '@creative-factory/video-generation' as const;

// Engine
export {
  StandardVideoGenerationEngine,
  VIDEO_GENERATION_ENGINE_VERSION,
  type GenerationResult,
  type VideoGenerationDependencies,
} from './engine.js';

// Provider (dispatch-seam implementation)
export {
  SmilVideoProvider,
  VIDEO_PROVIDER_NAME,
  asRenderedVideo,
  type RenderedVideoPayload,
} from './provider.js';

// Renderer
export { renderVideo, RENDER_MODEL, type RenderedVideo } from './renderer.js';

// Asset store
export { InMemoryAssetStore, type AssetStore, type StoredAsset } from './store.js';

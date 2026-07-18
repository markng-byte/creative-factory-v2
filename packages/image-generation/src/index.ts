/**
 * @creative-factory/image-generation
 *
 * The Image Generation Engine (Sprint 8): the first concrete provider behind the Prompt
 * Translation dispatch seam. It renders deterministic branded images for image prompts, records
 * `AssetOutput`s with full provenance, stores the viewable bytes, and writes the results back into
 * the Creative IR. No live AI provider is contacted — the synthetic renderer is offline and
 * reproducible, and a real diffusion API drops into the same `PromptProvider` seam.
 *
 * @packageDocumentation
 */

export const IMAGE_GENERATION_PACKAGE = '@creative-factory/image-generation' as const;

// Engine
export {
  StandardImageGenerationEngine,
  IMAGE_GENERATION_ENGINE_VERSION,
  type GenerationResult,
  type ImageGenerationDependencies,
} from './engine.js';

// Provider (dispatch-seam implementation)
export {
  SvgImageProvider,
  IMAGE_PROVIDER_NAME,
  asRenderedImage,
  type RenderedImagePayload,
} from './provider.js';

// Renderer
export { renderImage, RENDER_MODEL, type RenderedImage } from './renderer.js';

// Asset store
export { InMemoryAssetStore, type AssetStore, type StoredAsset } from './store.js';

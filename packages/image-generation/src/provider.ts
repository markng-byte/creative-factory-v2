/**
 * SVG image provider.
 *
 * A concrete `PromptProvider` — the Sprint 7 dispatch seam finally has a real implementation.
 * It renders a deterministic branded SVG for each image prompt and returns it in the dispatch
 * result's payload. Offline and reproducible; a live diffusion API implements the same interface
 * to swap in.
 */

import type {
  DispatchResult,
  PromptProvider,
  PromptRequest,
  PromptTargetKind,
} from '@creative-factory/prompt-translation';
import { renderImage, type RenderedImage } from './renderer.js';

export const IMAGE_PROVIDER_NAME = 'svg-image' as const;

/** The payload shape this provider places on a DispatchResult. */
export interface RenderedImagePayload extends RenderedImage {
  readonly kind: 'image';
}

export class SvgImageProvider implements PromptProvider {
  readonly name = IMAGE_PROVIDER_NAME;

  supports(targetKind: PromptTargetKind): boolean {
    return targetKind === 'image';
  }

  async dispatch(request: PromptRequest): Promise<DispatchResult> {
    const rendered = renderImage(request);
    const payload: RenderedImagePayload = { kind: 'image', ...rendered };
    return {
      requestId: request.id,
      targetKind: request.targetKind,
      provider: this.name,
      status: 'submitted',
      preparedPayload: payload as unknown as Readonly<Record<string, unknown>>,
    };
  }
}

/** Narrow an untyped dispatch payload back to a rendered image, validating the provider output. */
export function asRenderedImage(payload: Readonly<Record<string, unknown>>): RenderedImagePayload {
  if (
    payload['kind'] !== 'image' ||
    typeof payload['dataUri'] !== 'string' ||
    typeof payload['width'] !== 'number' ||
    typeof payload['height'] !== 'number' ||
    typeof payload['fileSize'] !== 'number'
  ) {
    throw new Error('Image provider returned a payload that is not a rendered image');
  }
  return payload as unknown as RenderedImagePayload;
}

/**
 * SMIL video provider.
 *
 * A concrete `PromptProvider` for the video target — the second implementation of the Sprint 7
 * dispatch seam. It renders a deterministic animated SVG for each video prompt and returns it in
 * the dispatch result's payload. Offline and reproducible; a live video API implements the same
 * interface to swap in.
 */

import type {
  DispatchResult,
  PromptProvider,
  PromptRequest,
  PromptTargetKind,
} from '@creative-factory/prompt-translation';
import { renderVideo, type RenderedVideo } from './renderer.js';

export const VIDEO_PROVIDER_NAME = 'smil-video' as const;

export interface RenderedVideoPayload extends RenderedVideo {
  readonly kind: 'video';
}

export class SmilVideoProvider implements PromptProvider {
  readonly name = VIDEO_PROVIDER_NAME;

  supports(targetKind: PromptTargetKind): boolean {
    return targetKind === 'video';
  }

  async dispatch(request: PromptRequest): Promise<DispatchResult> {
    const rendered = renderVideo(request);
    const payload: RenderedVideoPayload = { kind: 'video', ...rendered };
    return {
      requestId: request.id,
      targetKind: request.targetKind,
      provider: this.name,
      status: 'submitted',
      preparedPayload: payload as unknown as Readonly<Record<string, unknown>>,
    };
  }
}

/** Narrow an untyped dispatch payload back to a rendered video, validating the provider output. */
export function asRenderedVideo(payload: Readonly<Record<string, unknown>>): RenderedVideoPayload {
  if (
    payload['kind'] !== 'video' ||
    typeof payload['dataUri'] !== 'string' ||
    typeof payload['width'] !== 'number' ||
    typeof payload['height'] !== 'number' ||
    typeof payload['fileSize'] !== 'number' ||
    typeof payload['durationSeconds'] !== 'number'
  ) {
    throw new Error('Video provider returned a payload that is not a rendered video');
  }
  return payload as unknown as RenderedVideoPayload;
}

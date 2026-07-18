/**
 * Video prompt target.
 *
 * Translates a shot's motion + visual specifications into a video-generation prompt: the visual
 * description plus explicit camera motion, easing, duration, and frame rate. Handles `video` and
 * `animation` asset types.
 */

import type { AssetType } from '@creative-factory/creative-ir';
import {
  brandControls,
  negativeTerms,
  type PromptTarget,
  type ResolvedContext,
} from '../target.js';
import { sourceHash } from '../support.js';
import type { PromptRequest } from '../types.js';

export class VideoPromptTarget implements PromptTarget {
  readonly kind = 'video' as const;
  readonly name = 'video.generative';

  handles(assetType: AssetType): boolean {
    return assetType === 'video' || assetType === 'animation';
  }

  translate(context: ResolvedContext): PromptRequest | undefined {
    const shot = context.shot;
    if (!shot) {
      return undefined;
    }
    const visual = shot.visualSpec;
    const motion = shot.motionSpec;
    const duration = shot.duration;
    const frameRate = duration.frameRate && duration.frameRate > 0 ? duration.frameRate : 30;
    const durationFrames =
      (duration.minutes * 60 + duration.seconds) * frameRate + (duration.frames ?? 0);
    const easings = [...new Set(motion.cameraMotion.map((keyframe) => keyframe.easing))].sort();

    const subject =
      visual.foregroundElements.find((element) => element.type === 'subject')?.description ??
      shot.description;

    const prompt = [
      `${visual.shotType} shot of ${subject}`,
      `camera ${visual.camera.movement}`,
      easings.length > 0 ? `motion easing ${easings.join('/')}` : '',
      `${visual.lighting.mood} mood`,
      `cinematic, ${context.creativeContext.visualStyle.cinematography}`,
    ]
      .filter((part) => part.length > 0)
      .join(', ');

    const negativePrompt = [...negativeTerms(context), 'flicker', 'warping', 'jitter']
      .filter((term) => term.length > 0)
      .join(', ');

    const hash = sourceHash(
      context.creativeIRId,
      shot.id as string,
      context.assetRequest.id as string,
      prompt,
    );

    return {
      id: context.ids.generate('prompt', context.assetRequest.id as string, 'video'),
      targetKind: 'video',
      target: this.name,
      shotId: shot.id as string,
      sceneId: context.scene ? (context.scene.id as string) : undefined,
      assetRequestId: context.assetRequest.id as string,
      prompt,
      negativePrompt,
      parameters: {
        durationFrames,
        frameRate,
        cameraMovement: visual.camera.movement,
        motionStrength: visual.camera.movement === 'static' ? 0.2 : 0.7,
        seed: parseInt(hash.slice(0, 6), 16),
      },
      brandControls: brandControls(context.brandTokens),
      sourceHash: hash,
      version: 1,
    };
  }
}

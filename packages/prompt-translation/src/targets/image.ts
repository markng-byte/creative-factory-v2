/**
 * Image prompt target.
 *
 * Translates a shot's visual specification into a diffusion-style image prompt: an affirmative
 * description assembled from shot type, composition, lighting, color grading, subject, and
 * environment, plus brand-derived parameters and a deterministic seed.
 */

import type { AssetType, VisualSpecification } from '@creative-factory/creative-ir';
import {
  brandControls,
  negativeTerms,
  type PromptTarget,
  type ResolvedContext,
} from '../target.js';
import { sourceHash } from '../support.js';
import type { PromptRequest } from '../types.js';

const ASPECT_DIMENSIONS: Record<string, string> = {
  '1920x1080': '16:9',
  '1080x1920': '9:16',
  '1080x1080': '1:1',
  '1440x1080': '4:3',
  '2560x1080': '21:9',
};

export class ImagePromptTarget implements PromptTarget {
  readonly kind = 'image' as const;
  readonly name = 'image.diffusion';

  handles(assetType: AssetType): boolean {
    return assetType === 'image';
  }

  translate(context: ResolvedContext): PromptRequest | undefined {
    const shot = context.shot;
    if (!shot) {
      return undefined;
    }
    const visual = shot.visualSpec;
    const controls = brandControls(context.brandTokens);
    const dims = context.assetRequest.specifications.dimensions;
    const aspect = ASPECT_DIMENSIONS[`${dims.width}x${dims.height}`] ?? '16:9';

    const subject =
      visual.foregroundElements.find((element) => element.type === 'subject')?.description ??
      shot.description;
    const environment = visual.backgroundElements[0]?.description ?? '';

    const prompt = buildPrompt(subject, environment, visual, context, controls['primaryColor']);
    const negativePrompt = [...negativeTerms(context), 'low quality', 'watermark', 'text artifacts']
      .filter((term) => term.length > 0)
      .join(', ');

    const hash = sourceHash(
      context.creativeIRId,
      shot.id as string,
      context.assetRequest.id as string,
      prompt,
    );

    return {
      id: context.ids.generate('prompt', context.assetRequest.id as string, 'image'),
      targetKind: 'image',
      target: this.name,
      shotId: shot.id as string,
      sceneId: context.scene ? (context.scene.id as string) : undefined,
      assetRequestId: context.assetRequest.id as string,
      prompt,
      negativePrompt,
      parameters: {
        aspectRatio: aspect,
        width: dims.width,
        height: dims.height,
        steps: 30,
        guidanceScale: 7,
        sampler: 'ddim',
        seed: parseInt(hash.slice(0, 6), 16),
        quality: context.assetRequest.specifications.quality,
      },
      brandControls: controls,
      sourceHash: hash,
      version: 1,
    };
  }
}

function buildPrompt(
  subject: string,
  environment: string,
  visual: VisualSpecification,
  context: ResolvedContext,
  primaryColor: string | undefined,
): string {
  const parts = [
    `${visual.shotType} shot of ${subject}`,
    environment ? `set in ${environment}` : '',
    `${visual.lighting.type} lighting, ${visual.lighting.mood} mood`,
    `${visual.composition.rule} composition, ${visual.composition.subjectPlacement}`,
    `${visual.colorGrading.look} color grade`,
    `cinematography: ${context.creativeContext.visualStyle.cinematography}`,
    primaryColor ? `brand accent ${primaryColor}` : '',
    'high detail, professional advertising photography',
  ];
  return parts.filter((part) => part.length > 0).join(', ');
}

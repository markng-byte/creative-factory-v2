/**
 * Voiceover (audio) prompt target.
 *
 * Handles `audio` asset requests. Voiceover requests become a text-to-speech prompt built from
 * the scene's voiceover spec (script, language, pacing, emotional tone); music-bed requests
 * become a music-generation brief built from the campaign mood. Both are the audio target;
 * `target` distinguishes them (`audio.voiceover` vs `audio.music`).
 */

import type { AssetType } from '@creative-factory/creative-ir';
import { brandControls, type PromptTarget, type ResolvedContext } from '../target.js';
import { sourceHash } from '../support.js';
import type { PromptRequest } from '../types.js';

export class VoiceoverPromptTarget implements PromptTarget {
  readonly kind = 'voiceover' as const;
  readonly name = 'audio';

  handles(assetType: AssetType): boolean {
    return assetType === 'audio';
  }

  translate(context: ResolvedContext): PromptRequest | undefined {
    const isMusic = context.assetRequest.specifications.description
      .toLowerCase()
      .startsWith('music');
    return isMusic ? this.music(context) : this.voiceover(context);
  }

  private voiceover(context: ResolvedContext): PromptRequest {
    const voiceover = context.scene?.audioSpecs.voiceover;
    const script = voiceover?.script ?? context.assetRequest.specifications.description;
    const hash = sourceHash(
      context.creativeIRId,
      context.assetRequest.id as string,
      'voiceover',
      script,
    );
    return {
      id: context.ids.generate('prompt', context.assetRequest.id as string, 'voiceover'),
      targetKind: 'voiceover',
      target: 'audio.voiceover',
      shotId: context.shot ? (context.shot.id as string) : undefined,
      sceneId: context.scene ? (context.scene.id as string) : undefined,
      assetRequestId: context.assetRequest.id as string,
      prompt: script,
      negativePrompt: '',
      parameters: {
        language: voiceover?.language ?? 'en',
        style: voiceover?.style ?? 'natural',
        pacing: voiceover?.pacing ?? 'measured',
        emotionalTone: voiceover?.emotionalTone ?? context.creativeContext.moodAndTone.primary,
      },
      brandControls: brandControls(context.brandTokens),
      sourceHash: hash,
      version: 1,
    };
  }

  private music(context: ResolvedContext): PromptRequest {
    const mood = context.creativeContext.moodAndTone.primary;
    const prompt = `${context.assetRequest.specifications.description}; mood: ${mood}; supports ${context.creativeContext.narrativeTheme}`;
    const hash = sourceHash(
      context.creativeIRId,
      context.assetRequest.id as string,
      'music',
      prompt,
    );
    return {
      id: context.ids.generate('prompt', context.assetRequest.id as string, 'music'),
      targetKind: 'voiceover',
      target: 'audio.music',
      shotId: context.shot ? (context.shot.id as string) : undefined,
      sceneId: context.scene ? (context.scene.id as string) : undefined,
      assetRequestId: context.assetRequest.id as string,
      prompt,
      negativePrompt: '',
      parameters: {
        mood,
        licensing: 'royalty-free-required',
      },
      brandControls: brandControls(context.brandTokens),
      sourceHash: hash,
      version: 1,
    };
  }
}

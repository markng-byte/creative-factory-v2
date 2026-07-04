/**
 * Asset Planning Engine (Stage 9).
 *
 * Identifies every asset that downstream generation engines must produce — before any
 * generation happens. Each shot yields a primary key-frame image; scene openers add a
 * voiceover request; the story opener adds a music-bed request. Nothing is generated here;
 * this stage only declares fully-specified `AssetRequest`s.
 */

import {
  createAssetRequestId,
  createShotId,
  type AspectRatio,
  type AssetRequest,
  type AssetSpecification,
  type AssetType,
} from '@creative-factory/creative-ir';
import type { ISO8601Timestamp } from '@creative-factory/domain';
import type { StoryBeatKind } from '../model.js';
import type { IdGenerator } from '../support/id.js';

export interface AssetPlanShot {
  readonly shotId: string;
  readonly description: string;
  readonly narrativeText: string;
  readonly beatKind: StoryBeatKind;
  readonly isSceneOpener: boolean;
  readonly isStoryOpener: boolean;
}

export interface AssetPlanInput {
  readonly shots: readonly AssetPlanShot[];
  readonly aspectRatio: AspectRatio;
  readonly createdAt: ISO8601Timestamp;
  readonly language: string;
}

export interface AssetPlanResult {
  readonly requests: AssetRequest[];
  readonly shotAssetIds: ReadonlyMap<string, string[]>;
}

const DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '21:9': { width: 2560, height: 1080 },
};

export function planAssets(input: AssetPlanInput, ids: IdGenerator): AssetPlanResult {
  const requests: AssetRequest[] = [];
  const shotAssetIds = new Map<string, string[]>();
  const dims = DIMENSIONS[input.aspectRatio];

  for (const shot of input.shots) {
    const forShot: string[] = [];

    const imageId = ids.generate('asset', shot.shotId, 'image');
    requests.push(
      makeRequest(imageId, shot.shotId, 'image', input.createdAt, 'critical', {
        description: `Key visual for shot: ${shot.description}`,
        dimensions: { width: dims.width, height: dims.height },
        format: 'png',
        colorSpace: 'sRGB',
        quality: 'high',
        constraints: [{ type: 'brand-safe', value: true }],
      }),
    );
    forShot.push(imageId);

    if (shot.isSceneOpener && shot.narrativeText.trim().length > 0) {
      const voId = ids.generate('asset', shot.shotId, 'voiceover');
      requests.push(
        makeRequest(voId, shot.shotId, 'audio', input.createdAt, 'high', {
          description: `Voiceover: "${shot.narrativeText}"`,
          dimensions: { width: 0, height: 0 },
          format: 'wav',
          colorSpace: 'n/a',
          quality: 'high',
          constraints: [{ type: 'language', value: input.language }],
        }),
      );
      forShot.push(voId);
    }

    if (shot.isStoryOpener) {
      const musicId = ids.generate('asset', shot.shotId, 'music');
      requests.push(
        makeRequest(musicId, shot.shotId, 'audio', input.createdAt, 'medium', {
          description: 'Music bed matching the emotional arc of the story',
          dimensions: { width: 0, height: 0 },
          format: 'wav',
          colorSpace: 'n/a',
          quality: 'high',
          constraints: [{ type: 'licensing', value: 'royalty-free-required' }],
        }),
      );
      forShot.push(musicId);
    }

    shotAssetIds.set(shot.shotId, forShot);
  }

  return { requests, shotAssetIds };
}

function makeRequest(
  id: string,
  shotId: string,
  assetType: AssetType,
  createdAt: ISO8601Timestamp,
  priority: AssetRequest['priority'],
  specifications: AssetSpecification,
): AssetRequest {
  return {
    id: createAssetRequestId(id),
    createdAt,
    shotId: createShotId(shotId),
    assetType,
    specifications,
    quantity: 1,
    priority,
    deliveredAssets: [],
    qaStatus: 'pending',
    metadata: {},
  };
}

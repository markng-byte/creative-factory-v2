/**
 * Standard Prompt Translation Engine.
 *
 * Walks an approved Creative IR's asset requests, resolves each to its owning shot/scene/story,
 * routes it to the first registered target that handles its asset type, and assembles the
 * results into a deterministic `PromptPackage`. Emits a `prompt.generated` contract event per
 * request. Optionally dispatches the package through a `PromptProvider` — by default the offline
 * `DryRunProvider`, so no AI provider is contacted unless one is explicitly injected.
 */

import type {
  AssetRequest,
  AssetType,
  CreativeIR,
  Scene,
  Shot,
  Story,
} from '@creative-factory/creative-ir';
import type { PromptGeneratedContract } from '@creative-factory/contracts';
import { DeterministicIdGenerator, SystemClock, type Clock, type IdGenerator } from './support.js';
import { ImagePromptTarget } from './targets/image.js';
import { VideoPromptTarget } from './targets/video.js';
import { VoiceoverPromptTarget } from './targets/voiceover.js';
import { DryRunProvider, type DispatchResult, type PromptProvider } from './provider.js';
import type { PromptTarget, ResolvedContext } from './target.js';
import type { PromptPackage, PromptRequest, PromptTargetKind } from './types.js';

export const PROMPT_TRANSLATION_ENGINE_VERSION = '1.0.0' as const;
const PROMPT_PACKAGE_VERSION = '1.0.0' as const;

export interface TranslateResult {
  readonly promptPackage: PromptPackage;
  readonly events: PromptGeneratedContract[];
  /** Asset request ids no registered target handled (e.g. unsupported types). */
  readonly unhandled: readonly string[];
}

export interface PromptTranslationDependencies {
  readonly targets?: readonly PromptTarget[];
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
  readonly provider?: PromptProvider;
}

interface ShotLocation {
  readonly shot: Shot;
  readonly scene: Scene;
  readonly story: Story;
}

export class StandardPromptTranslationEngine {
  private readonly targets: readonly PromptTarget[];
  private readonly clock: Clock;
  private readonly ids: IdGenerator;
  private readonly provider: PromptProvider;

  constructor(deps: PromptTranslationDependencies = {}) {
    this.targets = deps.targets ?? [
      new ImagePromptTarget(),
      new VideoPromptTarget(),
      new VoiceoverPromptTarget(),
    ];
    this.clock = deps.clock ?? new SystemClock();
    this.ids = deps.ids ?? new DeterministicIdGenerator();
    this.provider = deps.provider ?? new DryRunProvider();
  }

  translate(creativeIR: CreativeIR, campaignId: string = creativeIR.campaign.id): TranslateResult {
    const index = indexShots(creativeIR);
    const generatedAt = this.clock.now();
    const requests: PromptRequest[] = [];
    const events: PromptGeneratedContract[] = [];
    const unhandled: string[] = [];

    for (const assetRequest of creativeIR.assetRequests) {
      const location = index.get(assetRequest.shotId as string);
      const context = this.resolve(creativeIR, assetRequest, location);
      const target = this.targets.find((candidate) =>
        candidate.handles(assetRequest.assetType as AssetType, context),
      );
      const request = target?.translate(context);
      if (!request) {
        unhandled.push(assetRequest.id as string);
        continue;
      }
      requests.push(request);
      events.push(this.event(campaignId, request, generatedAt));
    }

    const counts = tally(requests);

    return {
      promptPackage: {
        packageVersion: PROMPT_PACKAGE_VERSION,
        creativeIRId: String(creativeIR.id),
        schemaVersion: creativeIR.version,
        generatedAt,
        engineVersion: PROMPT_TRANSLATION_ENGINE_VERSION,
        counts,
        requests,
      },
      events,
      unhandled,
    };
  }

  /** Cross the seam explicitly: dispatch every request through the configured provider. */
  async dispatch(promptPackage: PromptPackage): Promise<DispatchResult[]> {
    const results: DispatchResult[] = [];
    for (const request of promptPackage.requests) {
      if (!this.provider.supports(request.targetKind)) {
        results.push({
          requestId: request.id,
          targetKind: request.targetKind,
          provider: this.provider.name,
          status: 'skipped',
          preparedPayload: {},
        });
        continue;
      }
      results.push(await this.provider.dispatch(request));
    }
    return results;
  }

  private resolve(
    creativeIR: CreativeIR,
    assetRequest: AssetRequest,
    location: ShotLocation | undefined,
  ): ResolvedContext {
    return {
      creativeIRId: String(creativeIR.id),
      assetRequest,
      shot: location?.shot,
      scene: location?.scene,
      story: location?.story,
      brandTokens: creativeIR.brandTokens,
      creativeContext: creativeIR.creativeContext,
      ids: this.ids,
    };
  }

  private event(
    campaignId: string,
    request: PromptRequest,
    occurredAt: string,
  ): PromptGeneratedContract {
    return {
      id: this.ids.generate('evt', request.id),
      name: 'prompt.generated',
      version: 1,
      occurredAt,
      aggregateId: campaignId,
      correlationId: request.assetRequestId,
      payload: {
        campaignId,
        promptArtifactId: request.id,
        sourceHash: request.sourceHash,
        targetPath: request.target,
        version: request.version,
      },
    };
  }
}

function indexShots(creativeIR: CreativeIR): Map<string, ShotLocation> {
  const index = new Map<string, ShotLocation>();
  for (const story of creativeIR.stories) {
    for (const storyboard of story.storyboards) {
      for (const scene of storyboard.scenes) {
        for (const shot of scene.shots) {
          index.set(shot.id as string, { shot, scene, story });
        }
      }
    }
  }
  return index;
}

function tally(requests: readonly PromptRequest[]): Record<PromptTargetKind, number> {
  const counts: Record<PromptTargetKind, number> = { image: 0, video: 0, voiceover: 0 };
  for (const request of requests) {
    counts[request.targetKind] += 1;
  }
  return counts;
}

/**
 * Standard Video Generation Engine.
 *
 * The mirror of the Image Generation Engine for the video target. Consumes video prompts (from
 * the Prompt Translation Engine), dispatches each through the configured video `PromptProvider`
 * (default: the deterministic `SmilVideoProvider`), records an `AssetOutput` with full provenance
 * and clip metadata (duration, frame rate, frame count), stores the animated bytes, and writes the
 * outputs back into the Creative IR — attaching them to their `AssetRequest.deliveredAssets` and
 * advancing `qaStatus`.
 *
 * Deterministic: with the default synthetic provider and injected clock/id ports, identical input
 * yields a byte-identical updated Creative IR, asset set, and event stream.
 */

import type {
  AssetMetadata,
  AssetOutput,
  AssetRequest,
  AssetRequestId,
  CreativeIR,
  Duration,
  Provenance,
} from '@creative-factory/creative-ir';
import type { AssetGeneratedContract } from '@creative-factory/contracts';
import {
  DeterministicIdGenerator,
  StandardPromptTranslationEngine,
  SystemClock,
  type Clock,
  type IdGenerator,
  type PromptProvider,
  type PromptRequest,
} from '@creative-factory/prompt-translation';
import { asRenderedVideo, SmilVideoProvider } from './provider.js';
import { InMemoryAssetStore, type AssetStore } from './store.js';

export const VIDEO_GENERATION_ENGINE_VERSION = '1.0.0' as const;

export interface VideoGenerationDependencies {
  readonly provider?: PromptProvider;
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
  readonly store?: AssetStore;
}

export interface GenerationResult {
  readonly creativeIR: CreativeIR;
  readonly outputs: readonly AssetOutput[];
  readonly events: readonly AssetGeneratedContract[];
  readonly store: AssetStore;
  readonly skipped: readonly string[];
}

export class StandardVideoGenerationEngine {
  private readonly provider: PromptProvider;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;
  private readonly store: AssetStore;

  constructor(deps: VideoGenerationDependencies = {}) {
    this.provider = deps.provider ?? new SmilVideoProvider();
    this.clock = deps.clock ?? new SystemClock();
    this.ids = deps.ids ?? new DeterministicIdGenerator('vidgen');
    this.store = deps.store ?? new InMemoryAssetStore();
  }

  /** Full loop: translate the IR to video prompts, generate them, and write back. */
  async generate(creativeIR: CreativeIR): Promise<GenerationResult> {
    const translation = new StandardPromptTranslationEngine({
      clock: this.clock,
      ids: this.ids,
    }).translate(creativeIR);
    const videoRequests = translation.promptPackage.requests.filter(
      (request) => request.targetKind === 'video',
    );
    return this.generateForRequests(creativeIR, videoRequests);
  }

  async generateForRequests(
    creativeIR: CreativeIR,
    videoRequests: readonly PromptRequest[],
  ): Promise<GenerationResult> {
    const campaignId = creativeIR.campaign.id;
    const outputs: AssetOutput[] = [];
    const events: AssetGeneratedContract[] = [];
    const skipped: string[] = [];

    for (const request of videoRequests) {
      if (!this.provider.supports('video') || request.assetRequestId === undefined) {
        skipped.push(request.id);
        continue;
      }
      const dispatch = await this.provider.dispatch(request);
      if (dispatch.status === 'skipped') {
        skipped.push(request.id);
        continue;
      }
      const rendered = asRenderedVideo(dispatch.preparedPayload);
      const output = this.toAssetOutput(request, rendered);
      this.store.put({
        assetOutputId: output.id,
        contentType: 'image/svg+xml',
        dataUri: rendered.dataUri,
      });
      outputs.push(output);
      events.push(this.event(campaignId, request.assetRequestId, output));
    }

    return {
      creativeIR: this.writeBack(creativeIR, outputs),
      outputs,
      events,
      store: this.store,
      skipped,
    };
  }

  private toAssetOutput(
    request: PromptRequest,
    rendered: ReturnType<typeof asRenderedVideo>,
  ): AssetOutput {
    const generatedAt = this.clock.now();
    const seconds = Math.floor(rendered.durationSeconds);
    const duration: Duration = {
      minutes: Math.floor(seconds / 60),
      seconds: seconds % 60,
      frames: Math.round((rendered.durationSeconds - seconds) * rendered.frameRate),
      frameRate: rendered.frameRate,
    };
    const metadata: AssetMetadata = {
      width: rendered.width,
      height: rendered.height,
      fileSize: rendered.fileSize,
      duration,
      colorSpace: 'sRGB',
      frameCount: Math.round(rendered.durationSeconds * rendered.frameRate),
      framerate: rendered.frameRate,
    };
    const provenance: Provenance = {
      sourceEngine: 'video-generation',
      sourceModel: rendered.model,
      sourceVersion: VIDEO_GENERATION_ENGINE_VERSION,
      parameters: { ...request.parameters },
      seed: String(rendered.seed),
      generationTime: 0,
    };
    return {
      id: this.ids.generate('assetout', request.assetRequestId ?? request.id),
      requestId: (request.assetRequestId ?? '') as AssetRequestId,
      format: rendered.format,
      url: rendered.dataUri,
      metadata,
      generatedAt,
      generatedBy: 'video-generation-engine',
      provenance,
    };
  }

  private writeBack(creativeIR: CreativeIR, outputs: readonly AssetOutput[]): CreativeIR {
    if (outputs.length === 0) {
      return creativeIR;
    }
    const byRequest = new Map<string, AssetOutput[]>();
    for (const output of outputs) {
      const key = String(output.requestId);
      byRequest.set(key, [...(byRequest.get(key) ?? []), output]);
    }

    const assetRequests: AssetRequest[] = creativeIR.assetRequests.map((request) => {
      const delivered = byRequest.get(String(request.id));
      if (!delivered) {
        return request;
      }
      return {
        ...request,
        deliveredAssets: [...request.deliveredAssets, ...delivered],
        qaStatus: 'in-progress',
      };
    });

    return { ...creativeIR, assetRequests, updatedAt: this.clock.now() };
  }

  private event(
    campaignId: string,
    assetRequestId: string,
    output: AssetOutput,
  ): AssetGeneratedContract {
    return {
      id: this.ids.generate('evt', output.id),
      name: 'asset.generated',
      version: 1,
      occurredAt: output.generatedAt,
      aggregateId: campaignId,
      correlationId: assetRequestId,
      payload: {
        campaignId,
        assetRequestId,
        assetOutputId: output.id,
        sourceEngine: output.provenance.sourceEngine,
        format: output.format,
      },
    };
  }
}

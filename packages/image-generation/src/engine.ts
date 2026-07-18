/**
 * Standard Image Generation Engine.
 *
 * Consumes image prompts (produced by the Prompt Translation Engine), dispatches each through the
 * configured image `PromptProvider` (default: the deterministic `SvgImageProvider`), records an
 * `AssetOutput` with full provenance, stores the rendered bytes, and writes the outputs back into
 * the Creative IR — attaching them to their `AssetRequest.deliveredAssets` and advancing
 * `qaStatus`. The returned Creative IR is the canonical record of what was generated.
 *
 * Deterministic: with the default synthetic provider and injected clock/id ports, the same input
 * yields a byte-identical updated Creative IR, asset set, and event stream.
 */

import type {
  AssetMetadata,
  AssetOutput,
  AssetRequest,
  AssetRequestId,
  CreativeIR,
  Provenance,
} from '@creative-factory/creative-ir';
import type { AssetGeneratedContract } from '@creative-factory/contracts';
import {
  DeterministicIdGenerator,
  StandardPromptTranslationEngine,
  SystemClock,
  type Clock,
  type IdGenerator,
  type PromptRequest,
} from '@creative-factory/prompt-translation';
import { asRenderedImage, SvgImageProvider } from './provider.js';
import { InMemoryAssetStore, type AssetStore } from './store.js';
import type { PromptProvider } from '@creative-factory/prompt-translation';

export const IMAGE_GENERATION_ENGINE_VERSION = '1.0.0' as const;

export interface ImageGenerationDependencies {
  readonly provider?: PromptProvider;
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
  readonly store?: AssetStore;
}

export interface GenerationResult {
  /** The Creative IR with generated assets attached to their requests. */
  readonly creativeIR: CreativeIR;
  readonly outputs: readonly AssetOutput[];
  readonly events: readonly AssetGeneratedContract[];
  readonly store: AssetStore;
  /** Image prompt ids the provider declined to handle. */
  readonly skipped: readonly string[];
}

export class StandardImageGenerationEngine {
  private readonly provider: PromptProvider;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;
  private readonly store: AssetStore;

  constructor(deps: ImageGenerationDependencies = {}) {
    this.provider = deps.provider ?? new SvgImageProvider();
    this.clock = deps.clock ?? new SystemClock();
    this.ids = deps.ids ?? new DeterministicIdGenerator('imggen');
    this.store = deps.store ?? new InMemoryAssetStore();
  }

  /** Full loop: translate the IR to image prompts, generate them, and write back. */
  async generate(creativeIR: CreativeIR): Promise<GenerationResult> {
    const translation = new StandardPromptTranslationEngine({
      clock: this.clock,
      ids: this.ids,
    }).translate(creativeIR);
    const imageRequests = translation.promptPackage.requests.filter(
      (request) => request.targetKind === 'image',
    );
    return this.generateForRequests(creativeIR, imageRequests);
  }

  /** Generate for a specific set of image prompt requests. */
  async generateForRequests(
    creativeIR: CreativeIR,
    imageRequests: readonly PromptRequest[],
  ): Promise<GenerationResult> {
    const campaignId = creativeIR.campaign.id;
    const outputs: AssetOutput[] = [];
    const events: AssetGeneratedContract[] = [];
    const skipped: string[] = [];

    for (const request of imageRequests) {
      if (!this.provider.supports('image') || request.assetRequestId === undefined) {
        skipped.push(request.id);
        continue;
      }
      const dispatch = await this.provider.dispatch(request);
      if (dispatch.status === 'skipped') {
        skipped.push(request.id);
        continue;
      }
      const rendered = asRenderedImage(dispatch.preparedPayload);
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
    rendered: ReturnType<typeof asRenderedImage>,
  ): AssetOutput {
    const generatedAt = this.clock.now();
    const metadata: AssetMetadata = {
      width: rendered.width,
      height: rendered.height,
      fileSize: rendered.fileSize,
      colorSpace: 'sRGB',
      bitDepth: 8,
    };
    const provenance: Provenance = {
      sourceEngine: 'image-generation',
      sourceModel: rendered.model,
      sourceVersion: IMAGE_GENERATION_ENGINE_VERSION,
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
      generatedBy: 'image-generation-engine',
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

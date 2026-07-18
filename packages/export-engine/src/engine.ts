/**
 * Standard Export & Publishing Engine.
 *
 * The final stage of the production pipeline. It assembles an `ExportPackage` from a Creative IR's
 * approved, catalogued assets — a manifest, per-aspect-ratio channel bundles, and viewable
 * deliverables (a finished campaign page + the manifest) — publishes each bundle through the
 * dispatch seam (default: an offline dry run), records `ExportMetadata` back into the Creative IR,
 * drives the export workflow transitions, and emits `export.published` and lifecycle events.
 *
 * Deterministic: injected clock/id ports and content-derived ids make the whole export reproducible.
 */

import type { CreativeIR, ExportArtifact, ExportMetadata } from '@creative-factory/creative-ir';
import { createUserId, type CampaignLifecycleState } from '@creative-factory/domain';
import type {
  CampaignLifecycleTransitionedContract,
  ExportPublishedContract,
} from '@creative-factory/contracts';
import { evaluateTransition, type TransitionAccepted } from '@creative-factory/workflow-engine';
import { assembleCampaignPage, buildManifestJson } from './deliverable.js';
import { buildBundles, buildManifest } from './manifest.js';
import { DryRunPublishTarget, type PublishTarget } from './publish.js';
import { DeterministicIdGenerator, SystemClock, type Clock, type IdGenerator } from './support.js';
import type { ExportDeliverable, ExportPackage, PublishResult } from './types.js';

export const EXPORT_ENGINE_VERSION = '1.0.0' as const;
const EXPORT_PACKAGE_VERSION = '1.0.0' as const;

export interface ExportEngineDependencies {
  readonly target?: PublishTarget;
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
}

export interface ExportRunOptions {
  readonly lifecycleState?: CampaignLifecycleState;
}

export type ExportEvent = ExportPublishedContract | CampaignLifecycleTransitionedContract;

export interface ExportOutcome {
  readonly creativeIR: CreativeIR;
  readonly exportPackage: ExportPackage;
  readonly events: readonly ExportEvent[];
  readonly recommendedTransitions: readonly TransitionAccepted[];
}

export class StandardExportEngine {
  private readonly target: PublishTarget;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;

  constructor(deps: ExportEngineDependencies = {}) {
    this.target = deps.target ?? new DryRunPublishTarget();
    this.clock = deps.clock ?? new SystemClock();
    this.ids = deps.ids ?? new DeterministicIdGenerator();
  }

  async export(creativeIR: CreativeIR, options: ExportRunOptions = {}): Promise<ExportOutcome> {
    const campaignId = creativeIR.campaign.id;
    const generatedAt = this.clock.now();
    const packageId = this.ids.generate('exportpkg', String(creativeIR.id));

    const manifest = buildManifest(creativeIR);
    const bundles = buildBundles(manifest);

    const deliverables: ExportDeliverable[] = [
      deliverable('campaign.html', 'html', 'text/html', assembleCampaignPage(creativeIR)),
      deliverable('manifest.json', 'json', 'application/json', buildManifestJson(manifest)),
    ];

    const events: ExportEvent[] = [];
    const published: PublishResult[] = [];
    for (const bundle of bundles) {
      if (!this.target.supports(bundle.channel)) {
        published.push({
          bundleId: bundle.bundleId,
          channel: bundle.channel,
          target: this.target.name,
          status: 'skipped',
          location: '',
        });
        continue;
      }
      const result = await this.target.publish(bundle, campaignId);
      published.push(result);
      events.push(this.publishedEvent(campaignId, packageId, result, bundle.entries.length));
    }

    const exportPackage: ExportPackage = {
      packageId,
      packageVersion: EXPORT_PACKAGE_VERSION,
      campaignId,
      creativeIRId: String(creativeIR.id),
      generatedAt,
      engineVersion: EXPORT_ENGINE_VERSION,
      manifest,
      bundles,
      deliverables,
      published,
    };

    const exportMetadata = this.exportMetadata(packageId, generatedAt, deliverables);
    const recommendedTransitions = this.driveTransitions(
      options.lifecycleState ?? 'FINAL_APPROVAL',
      campaignId,
      String(creativeIR.id),
      generatedAt,
      events,
    );

    return {
      creativeIR: {
        ...creativeIR,
        exports: [...creativeIR.exports, exportMetadata],
        updatedAt: generatedAt,
      },
      exportPackage,
      events,
      recommendedTransitions,
    };
  }

  private exportMetadata(
    packageId: string,
    createdAt: string,
    deliverables: readonly ExportDeliverable[],
  ): ExportMetadata {
    const artifacts: ExportArtifact[] = deliverables.map((deliverable) => ({
      format: deliverable.format,
      url: `export://${packageId}/${deliverable.name}`,
      size: deliverable.size,
      generatedAt: createdAt,
      metadata: { mimeType: deliverable.mimeType },
    }));
    return {
      id: packageId,
      createdAt,
      exportedBy: createUserId('export-engine'),
      exportFormat: 'production-package',
      adapterUsed: 'export-engine',
      targetPlatform: this.target.name,
      artifacts,
      status: 'completed',
    };
  }

  private driveTransitions(
    lifecycleState: CampaignLifecycleState,
    campaignId: string,
    creativeIRId: string,
    occurredAt: string,
    events: ExportEvent[],
  ): TransitionAccepted[] {
    const names =
      lifecycleState === 'FINAL_APPROVAL'
        ? (['start_export', 'complete_export'] as const)
        : lifecycleState === 'EXPORTING'
          ? (['complete_export'] as const)
          : ([] as const);

    const transitions: TransitionAccepted[] = [];
    let from = lifecycleState;
    for (const name of names) {
      const evaluated = evaluateTransition({ from, transition: name });
      if (!evaluated.ok) {
        break;
      }
      transitions.push(evaluated.value);
      events.push({
        id: this.ids.generate('evt', creativeIRId, name),
        name: 'campaign.lifecycle.transitioned',
        version: 1,
        occurredAt,
        aggregateId: campaignId,
        correlationId: creativeIRId,
        payload: {
          campaignId,
          from: evaluated.value.from,
          to: evaluated.value.to,
          reason: `Export ${name}`,
        },
      });
      from = evaluated.value.to;
    }
    return transitions;
  }

  private publishedEvent(
    campaignId: string,
    packageId: string,
    result: PublishResult,
    artifactCount: number,
  ): ExportPublishedContract {
    return {
      id: this.ids.generate('evt', packageId, result.bundleId),
      name: 'export.published',
      version: 1,
      occurredAt: this.clock.now(),
      aggregateId: campaignId,
      correlationId: packageId,
      payload: {
        campaignId,
        exportId: packageId,
        bundleId: result.bundleId,
        channel: result.channel,
        target: result.target,
        artifactCount,
      },
    };
  }
}

function deliverable(
  name: string,
  format: string,
  mimeType: string,
  content: string,
): ExportDeliverable {
  return { name, format, mimeType, size: Buffer.byteLength(content, 'utf8'), content };
}

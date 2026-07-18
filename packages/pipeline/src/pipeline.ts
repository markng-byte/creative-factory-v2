/**
 * Standard Pipeline orchestrator.
 *
 * Composes every engine into one deterministic end-to-end run: a Creative Brief (resolved by the
 * compiler) becomes a compiled Creative IR, which is translated to prompts, generated (image +
 * video), QA'd, catalogued, exported to a finished campaign, and finally analyzed — collecting the
 * whole event stream along the way. This is the single entry point for the entire system.
 *
 * The orchestrator only wires data between engines; each engine owns its own determinism (injected
 * clock/id ports). Given deterministic engines, `run` is byte-reproducible end to end.
 */

import type { CompilerRequest, CreativeIR } from '@creative-factory/creative-ir';
import type { CreativeFactoryEventContract } from '@creative-factory/contracts';
import {
  StandardCreativeIRCompiler,
  type BrandTokensSource,
  type CampaignSource,
  type CreativeBriefSource,
} from '@creative-factory/creative-ir-compiler';
import {
  StandardPromptTranslationEngine,
  type PromptPackage,
} from '@creative-factory/prompt-translation';
import { StandardImageGenerationEngine } from '@creative-factory/image-generation';
import { StandardVideoGenerationEngine } from '@creative-factory/video-generation';
import { StandardQaEngine, type QaReport } from '@creative-factory/qa-engine';
import { InMemoryAssetLibrary, StandardAssetLibrarian } from '@creative-factory/asset-library';
import { StandardExportEngine, type ExportPackage } from '@creative-factory/export-engine';
import {
  StandardAnalyticsEngine,
  type AnalyticsReport,
  type OptimizationRecommendation,
} from '@creative-factory/analytics-engine';
import { DeterministicIdGenerator, SystemClock, type Clock } from './support.js';

export interface PipelineEngines {
  readonly compiler: StandardCreativeIRCompiler;
  readonly promptTranslation: StandardPromptTranslationEngine;
  readonly imageGeneration: StandardImageGenerationEngine;
  readonly videoGeneration: StandardVideoGenerationEngine;
  readonly qa: StandardQaEngine;
  readonly librarian: StandardAssetLibrarian;
  readonly exporter: StandardExportEngine;
  readonly analytics: StandardAnalyticsEngine;
}

export interface PipelineSummary {
  readonly scenes: number;
  readonly shots: number;
  readonly assetsGenerated: number;
  readonly assetsApproved: number;
  readonly completed: boolean;
  readonly eventCount: number;
}

export interface PipelineResult {
  /** The final Creative IR: compiled, generated, QA'd, catalogued, exported. */
  readonly creativeIR: CreativeIR;
  readonly promptPackage: PromptPackage;
  readonly qaReport: QaReport;
  readonly exportPackage: ExportPackage;
  readonly analyticsReport: AnalyticsReport;
  readonly recommendations: readonly OptimizationRecommendation[];
  /** The analytics dashboard (self-contained HTML). */
  readonly dashboard: string;
  /** The finished campaign page (self-contained HTML), if produced. */
  readonly finishedCampaignPage?: string;
  /** Every contract event emitted across the whole run, in stage order. */
  readonly events: readonly CreativeFactoryEventContract[];
  readonly summary: PipelineSummary;
}

export class StandardPipeline {
  constructor(private readonly engines: PipelineEngines) {}

  async run(request: CompilerRequest): Promise<PipelineResult> {
    const events: CreativeFactoryEventContract[] = [];

    const compiled = await this.engines.compiler.compile(request);
    const creativeIR = compiled.creativeIR;

    const translation = this.engines.promptTranslation.translate(creativeIR);
    events.push(...translation.events);

    const images = await this.engines.imageGeneration.generate(creativeIR);
    events.push(...images.events);

    const videos = await this.engines.videoGeneration.generate(images.creativeIR);
    events.push(...videos.events);

    const qa = this.engines.qa.run(videos.creativeIR);
    events.push(...qa.events);

    const cataloged = this.engines.librarian.ingest(qa.creativeIR);
    events.push(...cataloged.events);

    const exported = await this.engines.exporter.export(cataloged.creativeIR, {
      lifecycleState: 'FINAL_APPROVAL',
    });
    events.push(...exported.events);

    const analytics = this.engines.analytics.analyze(exported.creativeIR, events);
    const finishedCampaignPage = exported.exportPackage.deliverables.find(
      (deliverable) => deliverable.name === 'campaign.html',
    )?.content;

    return {
      creativeIR: exported.creativeIR,
      promptPackage: translation.promptPackage,
      qaReport: qa.report,
      exportPackage: exported.exportPackage,
      analyticsReport: analytics.report,
      recommendations: analytics.recommendations,
      dashboard: analytics.dashboard,
      finishedCampaignPage,
      events,
      summary: {
        scenes: analytics.report.structure.scenes,
        shots: analytics.report.structure.shots,
        assetsGenerated: analytics.report.assets.generated,
        assetsApproved: analytics.report.assets.approved,
        completed: analytics.report.lifecycle.completed,
        eventCount: events.length,
      },
    };
  }
}

export interface CreatePipelineOptions {
  readonly briefs: CreativeBriefSource;
  readonly campaigns: CampaignSource;
  readonly brands: BrandTokensSource;
  readonly clock?: Clock;
  readonly seed?: string;
}

/**
 * Build a fully-wired pipeline from the compiler's source ports. One shared clock drives every
 * stage; each engine gets its own seeded id generator so ids never collide across engines.
 */
export function createPipeline(options: CreatePipelineOptions): StandardPipeline {
  const clock = options.clock ?? new SystemClock();
  const seed = options.seed ?? 'creative-factory';
  const ids = (stage: string): DeterministicIdGenerator =>
    new DeterministicIdGenerator(`${seed}:${stage}`);

  return new StandardPipeline({
    compiler: new StandardCreativeIRCompiler({
      briefs: options.briefs,
      campaigns: options.campaigns,
      brands: options.brands,
      clock,
      ids: ids('compile'),
      seed,
    }),
    promptTranslation: new StandardPromptTranslationEngine({ clock, ids: ids('prompt') }),
    imageGeneration: new StandardImageGenerationEngine({ clock, ids: ids('image') }),
    videoGeneration: new StandardVideoGenerationEngine({ clock, ids: ids('video') }),
    qa: new StandardQaEngine({ clock, ids: ids('qa') }),
    librarian: new StandardAssetLibrarian({
      library: new InMemoryAssetLibrary(),
      clock,
      ids: ids('library'),
    }),
    exporter: new StandardExportEngine({ clock, ids: ids('export') }),
    analytics: new StandardAnalyticsEngine({ clock, ids: ids('analytics') }),
  });
}

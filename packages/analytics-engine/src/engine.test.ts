import { beforeAll, describe, expect, it } from 'vitest';
import { ValidationMode, type CreativeIR } from '@creative-factory/creative-ir';
import type { CreativeFactoryEventContract } from '@creative-factory/contracts';
import {
  DeterministicIdGenerator as CompilerIds,
  FixedClock as CompilerClock,
  InMemoryBrandTokensSource,
  InMemoryCampaignSource,
  InMemoryCreativeBriefSource,
  StandardCreativeIRCompiler,
  exampleBrandBundle,
  exampleCampaign,
  exampleCreativeBrief,
} from '@creative-factory/creative-ir-compiler';
import {
  DeterministicIdGenerator as GenIds,
  FixedClock as GenClock,
  StandardPromptTranslationEngine,
} from '@creative-factory/prompt-translation';
import { StandardImageGenerationEngine } from '@creative-factory/image-generation';
import { StandardVideoGenerationEngine } from '@creative-factory/video-generation';
import { StandardQaEngine } from '@creative-factory/qa-engine';
import { StandardAssetLibrarian, InMemoryAssetLibrary } from '@creative-factory/asset-library';
import { StandardExportEngine } from '@creative-factory/export-engine';
import { StandardAnalyticsEngine } from './engine.js';
import { FixedClock, DeterministicIdGenerator } from './support.js';

interface Pipeline {
  ir: CreativeIR;
  events: CreativeFactoryEventContract[];
}

/** Run the whole pipeline, collecting the emitted event stream. */
async function runPipeline(): Promise<Pipeline> {
  const events: CreativeFactoryEventContract[] = [];
  const brand = exampleBrandBundle();
  const compiler = new StandardCreativeIRCompiler({
    briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: new InMemoryCampaignSource([exampleCampaign()]),
    brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    clock: new CompilerClock('2026-07-01T00:00:00.000Z'),
    ids: new CompilerIds('an-test'),
  });
  const { creativeIR } = await compiler.compile({
    creativeBriefId: 'brief-northwind-001',
    brandId: 'brand-northwind',
    campaignId: 'campaign-northwind-q3',
    validationMode: ValidationMode.STRICT,
  });

  events.push(
    ...new StandardPromptTranslationEngine({
      clock: new GenClock('2026-07-03T00:00:00.000Z'),
      ids: new GenIds('p'),
    }).translate(creativeIR).events,
  );

  const img = await new StandardImageGenerationEngine({
    clock: new GenClock('2026-07-04T00:00:00.000Z'),
    ids: new GenIds('g'),
  }).generate(creativeIR);
  events.push(...img.events);

  const vid = await new StandardVideoGenerationEngine({
    clock: new GenClock('2026-07-05T00:00:00.000Z'),
    ids: new GenIds('v'),
  }).generate(img.creativeIR);
  events.push(...vid.events);

  const qa = new StandardQaEngine({
    clock: new FixedClock('2026-07-06T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('q'),
  }).run(vid.creativeIR);
  events.push(...qa.events);

  const cat = new StandardAssetLibrarian({
    library: new InMemoryAssetLibrary(),
    clock: new FixedClock('2026-07-07T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('l'),
  }).ingest(qa.creativeIR);
  events.push(...cat.events);

  const exp = await new StandardExportEngine({
    clock: new FixedClock('2026-07-08T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('x'),
  }).export(cat.creativeIR, { lifecycleState: 'FINAL_APPROVAL' });
  events.push(...exp.events);

  return { ir: exp.creativeIR, events };
}

function makeEngine(): StandardAnalyticsEngine {
  return new StandardAnalyticsEngine({
    clock: new FixedClock('2026-07-09T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('a'),
  });
}

describe('StandardAnalyticsEngine', () => {
  let pipeline: Pipeline;

  beforeAll(async () => {
    pipeline = await runPipeline();
  });

  it('computes structure and asset metrics from the Creative IR', () => {
    const { report } = makeEngine().analyze(pipeline.ir, pipeline.events);
    expect(report.structure.scenes).toBe(6);
    expect(report.structure.shots).toBe(13);
    expect(report.assets.total).toBe(33);
    expect(report.assets.generated).toBe(26); // 13 image + 13 video
    expect(report.assets.approved).toBe(26);
    expect(report.assets.pending).toBe(7); // audio
  });

  it('computes quality, reuse, and activity metrics from the event stream', () => {
    const { report } = makeEngine().analyze(pipeline.ir, pipeline.events);
    expect(report.quality.passRate).toBe(1);
    expect(report.activity.promptsGenerated).toBe(33);
    expect(report.activity.assetsGenerated).toBe(26);
    expect(report.activity.assetsCataloged).toBe(26);
    expect(report.activity.exportsPublished).toBe(1);
    expect(report.reuse.cataloged).toBe(26);
    expect(report.reuse.dedupRate).toBe(0); // first-time ingest, no duplicates
  });

  it('tracks the lifecycle funnel to COMPLETED', () => {
    const { report } = makeEngine().analyze(pipeline.ir, pipeline.events);
    expect(report.lifecycle.completed).toBe(true);
    expect(report.lifecycle.reachedStates).toContain('COMPLETED');
  });

  it('derives optimization recommendations, including the completion success', () => {
    const { recommendations } = makeEngine().analyze(pipeline.ir, pipeline.events);
    const ids = new Set(recommendations.map((rec) => rec.id));
    expect(ids.has('completed')).toBe(true);
    expect(ids.has('incomplete-generation')).toBe(true); // 7 audio pending
    expect(recommendations.find((rec) => rec.id === 'completed')?.severity).toBe('success');
  });

  it('renders a self-contained, viewable dashboard', () => {
    const { dashboard } = makeEngine().analyze(pipeline.ir, pipeline.events);
    expect(dashboard).toContain('<!doctype html>');
    expect(dashboard).toContain('Campaign Analytics');
    expect(dashboard).toContain('QA pass rate');
    expect(dashboard).not.toContain('<script');
  });

  it('is read-only — does not mutate the Creative IR', () => {
    const before = JSON.stringify(pipeline.ir);
    makeEngine().analyze(pipeline.ir, pipeline.events);
    expect(JSON.stringify(pipeline.ir)).toBe(before);
  });

  it('is deterministic — identical inputs yield an identical report and dashboard', () => {
    const a = makeEngine().analyze(pipeline.ir, pipeline.events);
    const b = makeEngine().analyze(pipeline.ir, pipeline.events);
    expect(JSON.stringify(a.report)).toBe(JSON.stringify(b.report));
    expect(a.dashboard).toBe(b.dashboard);
  });
});

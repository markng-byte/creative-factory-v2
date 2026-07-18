import { beforeAll, describe, expect, it } from 'vitest';
import { ValidationMode, type CreativeIR } from '@creative-factory/creative-ir';
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
import { DeterministicIdGenerator, FixedClock } from '@creative-factory/prompt-translation';
import { StandardVideoGenerationEngine } from './engine.js';
import { SmilVideoProvider } from './provider.js';

async function compileExampleIR(): Promise<CreativeIR> {
  const brand = exampleBrandBundle();
  const compiler = new StandardCreativeIRCompiler({
    briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: new InMemoryCampaignSource([exampleCampaign()]),
    brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    clock: new CompilerClock('2026-07-01T00:00:00.000Z'),
    ids: new CompilerIds('vidgen-test'),
  });
  const { creativeIR } = await compiler.compile({
    creativeBriefId: 'brief-northwind-001',
    brandId: 'brand-northwind',
    campaignId: 'campaign-northwind-q3',
    validationMode: ValidationMode.STRICT,
  });
  return creativeIR;
}

function makeEngine(): StandardVideoGenerationEngine {
  return new StandardVideoGenerationEngine({
    clock: new FixedClock('2026-07-05T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('v'),
  });
}

function videoRequestCount(ir: CreativeIR): number {
  return ir.assetRequests.filter((request) => request.assetType === 'video').length;
}

describe('StandardVideoGenerationEngine', () => {
  let ir: CreativeIR;

  beforeAll(async () => {
    ir = await compileExampleIR();
  });

  it('generates one clip per video request', async () => {
    const result = await makeEngine().generate(ir);
    expect(videoRequestCount(ir)).toBeGreaterThan(0);
    expect(result.outputs).toHaveLength(videoRequestCount(ir));
    expect(result.skipped).toEqual([]);
  });

  it('writes generated clips back into the Creative IR, leaving image/audio untouched', async () => {
    const { creativeIR } = await makeEngine().generate(ir);
    const video = creativeIR.assetRequests.filter((request) => request.assetType === 'video');
    for (const request of video) {
      expect(request.deliveredAssets).toHaveLength(1);
      expect(request.qaStatus).toBe('in-progress');
    }
    const image = creativeIR.assetRequests.find((request) => request.assetType === 'image');
    expect(image?.deliveredAssets).toHaveLength(0);
    expect(image?.qaStatus).toBe('pending');
  });

  it('records clip metadata and provenance', async () => {
    const { outputs } = await makeEngine().generate(ir);
    const output = outputs[0];
    expect(output?.provenance.sourceEngine).toBe('video-generation');
    expect(output?.provenance.sourceModel).toBe('smil-video-synth-v1');
    expect(output?.metadata.duration?.frameRate).toBe(30);
    expect(output?.metadata.frameCount).toBeGreaterThan(0);
  });

  it('stores viewable, actually-animated SVG clips', async () => {
    const { outputs, store } = await makeEngine().generate(ir);
    const stored = outputs[0] ? store.get(outputs[0].id) : undefined;
    expect(stored?.dataUri.startsWith('data:image/svg+xml;base64,')).toBe(true);
    const svg = Buffer.from(stored!.dataUri.split(',')[1] as string, 'base64').toString('utf8');
    expect(svg).toContain('<svg');
    expect(svg).toContain('<animate'); // SMIL animation present
    expect(svg).toContain('Northwind');
  });

  it('emits an asset.generated event per clip', async () => {
    const { outputs, events } = await makeEngine().generate(ir);
    expect(events).toHaveLength(outputs.length);
    expect(events.every((event) => event.name === 'asset.generated')).toBe(true);
    expect(events[0]?.payload.sourceEngine).toBe('video-generation');
  });

  it('is deterministic — identical IR yields identical outputs, IR, and events', async () => {
    const a = await makeEngine().generate(ir);
    const b = await makeEngine().generate(ir);
    expect(JSON.stringify(a.creativeIR)).toBe(JSON.stringify(b.creativeIR));
    expect(a.store.list().map((asset) => asset.dataUri)).toEqual(
      b.store.list().map((asset) => asset.dataUri),
    );
  });

  it('uses the concrete provider through the Sprint 7 dispatch seam', async () => {
    const provider = new SmilVideoProvider();
    expect(provider.supports('video')).toBe(true);
    expect(provider.supports('image')).toBe(false);
    const { outputs } = await new StandardVideoGenerationEngine({
      provider,
      clock: new FixedClock('2026-07-05T00:00:00.000Z'),
      ids: new DeterministicIdGenerator('v'),
    }).generate(ir);
    expect(outputs.length).toBe(videoRequestCount(ir));
  });
});

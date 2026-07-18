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
import {
  DeterministicIdGenerator,
  FixedClock,
  StandardPromptTranslationEngine,
} from '@creative-factory/prompt-translation';
import { StandardImageGenerationEngine } from './engine.js';
import { SvgImageProvider } from './provider.js';
import { renderImage } from './renderer.js';

async function compileExampleIR(): Promise<CreativeIR> {
  const brand = exampleBrandBundle();
  const compiler = new StandardCreativeIRCompiler({
    briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: new InMemoryCampaignSource([exampleCampaign()]),
    brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    clock: new CompilerClock('2026-07-01T00:00:00.000Z'),
    ids: new CompilerIds('imggen-test'),
  });
  const { creativeIR } = await compiler.compile({
    creativeBriefId: 'brief-northwind-001',
    brandId: 'brand-northwind',
    campaignId: 'campaign-northwind-q3',
    validationMode: ValidationMode.STRICT,
  });
  return creativeIR;
}

function makeEngine(): StandardImageGenerationEngine {
  return new StandardImageGenerationEngine({
    clock: new FixedClock('2026-07-04T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('g'),
  });
}

function imageRequestCount(ir: CreativeIR): number {
  return ir.assetRequests.filter((request) => request.assetType === 'image').length;
}

describe('StandardImageGenerationEngine', () => {
  let ir: CreativeIR;

  beforeAll(async () => {
    ir = await compileExampleIR();
  });

  it('generates one asset output per image request', async () => {
    const result = await makeEngine().generate(ir);
    expect(result.outputs).toHaveLength(imageRequestCount(ir));
    expect(result.skipped).toEqual([]);
  });

  it('writes generated assets back into the Creative IR with qa status advanced', async () => {
    const { creativeIR } = await makeEngine().generate(ir);
    const imageRequests = creativeIR.assetRequests.filter(
      (request) => request.assetType === 'image',
    );
    for (const request of imageRequests) {
      expect(request.deliveredAssets).toHaveLength(1);
      expect(request.qaStatus).toBe('in-progress');
      expect(request.deliveredAssets[0]?.requestId).toBe(request.id);
    }
    // Non-image requests are untouched.
    const audio = creativeIR.assetRequests.find((request) => request.assetType === 'audio');
    expect(audio?.deliveredAssets).toHaveLength(0);
    expect(audio?.qaStatus).toBe('pending');
  });

  it('records full provenance on each asset output', async () => {
    const { outputs } = await makeEngine().generate(ir);
    const output = outputs[0];
    expect(output?.provenance.sourceEngine).toBe('image-generation');
    expect(output?.provenance.sourceModel).toBe('svg-synth-v1');
    expect(output?.provenance.seed).toBeDefined();
    expect(output?.metadata.width).toBeGreaterThan(0);
    expect(output?.format).toBe('svg');
  });

  it('stores viewable SVG data URIs retrievable by output id', async () => {
    const { outputs, store } = await makeEngine().generate(ir);
    const first = outputs[0];
    const stored = first ? store.get(first.id) : undefined;
    expect(stored?.contentType).toBe('image/svg+xml');
    expect(stored?.dataUri.startsWith('data:image/svg+xml;base64,')).toBe(true);
    const svg = Buffer.from(stored!.dataUri.split(',')[1] as string, 'base64').toString('utf8');
    expect(svg).toContain('<svg');
    expect(svg).toContain('Northwind');
  });

  it('emits an asset.generated event per output', async () => {
    const { outputs, events } = await makeEngine().generate(ir);
    expect(events).toHaveLength(outputs.length);
    expect(events.every((event) => event.name === 'asset.generated')).toBe(true);
    expect(events[0]?.payload.assetOutputId).toBe(outputs[0]?.id);
  });

  it('is deterministic — identical IR yields identical outputs, IR, and events', async () => {
    const a = await makeEngine().generate(ir);
    const b = await makeEngine().generate(ir);
    expect(JSON.stringify(a.creativeIR)).toBe(JSON.stringify(b.creativeIR));
    expect(JSON.stringify(a.events)).toBe(JSON.stringify(b.events));
    expect(a.store.list().map((asset) => asset.dataUri)).toEqual(
      b.store.list().map((asset) => asset.dataUri),
    );
  });

  it('renders deterministically and touches no network', () => {
    const request = new StandardPromptTranslationEngine({
      clock: new FixedClock('2026-07-04T00:00:00.000Z'),
      ids: new DeterministicIdGenerator('g'),
    })
      .translate(ir)
      .promptPackage.requests.find((candidate) => candidate.targetKind === 'image');
    expect(request).toBeDefined();
    const a = renderImage(request!);
    const b = renderImage(request!);
    expect(a.dataUri).toBe(b.dataUri);
    expect(a.format).toBe('svg');
  });

  it('uses the concrete provider through the Sprint 7 dispatch seam', async () => {
    const provider = new SvgImageProvider();
    expect(provider.supports('image')).toBe(true);
    expect(provider.supports('video')).toBe(false);
    const { outputs } = await new StandardImageGenerationEngine({
      provider,
      clock: new FixedClock('2026-07-04T00:00:00.000Z'),
      ids: new DeterministicIdGenerator('g'),
    }).generate(ir);
    expect(outputs.length).toBe(imageRequestCount(ir));
  });
});

import { beforeAll, describe, expect, it } from 'vitest';
import { ValidationMode, type CreativeIR } from '@creative-factory/creative-ir';
import {
  StandardCreativeIRCompiler,
  exampleBrandBundle,
  exampleCampaign,
  exampleCreativeBrief,
  InMemoryBrandTokensSource,
  InMemoryCampaignSource,
  InMemoryCreativeBriefSource,
  FixedClock,
  DeterministicIdGenerator,
} from '@creative-factory/creative-ir-compiler';
import {
  assembleCreativePackage,
  createStandardAdapters,
  renderCreativePackage,
  runAdapters,
} from './creative-package.js';
import { StandardAdapterRegistry } from './registry.js';

async function compileExampleIR(): Promise<CreativeIR> {
  const brand = exampleBrandBundle();
  const compiler = new StandardCreativeIRCompiler({
    briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: new InMemoryCampaignSource([exampleCampaign()]),
    brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    clock: new FixedClock('2026-07-01T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('test-seed'),
  });
  const { creativeIR } = await compiler.compile({
    creativeBriefId: 'brief-northwind-001',
    brandId: 'brand-northwind',
    campaignId: 'campaign-northwind-q3',
    validationMode: ValidationMode.STRICT,
  });
  return creativeIR;
}

describe('Creative Package adapters', () => {
  let ir: CreativeIR;

  beforeAll(async () => {
    ir = await compileExampleIR();
  });

  it('renders every standard adapter into the package', async () => {
    const { creativePackage } = await renderCreativePackage(ir);
    expect(Object.keys(creativePackage.artifacts).sort()).toEqual([
      'asset-plan',
      'motion-spec',
      'qa-spec',
      'scene-spec',
      'shot-list',
      'storyboard-html',
      'timeline',
    ]);
    expect(creativePackage.metadata.totalScenes).toBe(6);
    expect(creativePackage.metadata.totalShots).toBe(13);
  });

  it('produces a self-contained HTML storyboard', async () => {
    const outputs = await runAdapters(ir);
    const html = outputs.get('storyboard-html')?.artifacts[0]?.content as string;
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Northwind');
    expect(html).not.toContain('<script');
  });

  it('emits complete scene specifications with business goals', async () => {
    const outputs = await runAdapters(ir);
    const json = outputs.get('scene-spec')?.artifacts[0]?.content as string;
    const parsed = JSON.parse(json) as { scenes: Array<Record<string, unknown>> };
    expect(parsed.scenes).toHaveLength(6);
    for (const scene of parsed.scenes) {
      expect(String(scene['businessGoal']).length).toBeGreaterThan(0);
      expect(scene['cameraDirection']).toBeTruthy();
    }
  });

  it('produces a frame-accurate timeline that sums to the campaign duration', async () => {
    const outputs = await runAdapters(ir);
    const json = outputs.get('timeline')?.artifacts[0]?.content as string;
    const parsed = JSON.parse(json) as { totalFrames: number };
    expect(parsed.totalFrames).toBe(900);
  });

  it('derives QA checks from brand tokens and constraints', async () => {
    const outputs = await runAdapters(ir);
    const json = outputs.get('qa-spec')?.artifacts[0]?.content as string;
    const parsed = JSON.parse(json) as { checks: Array<{ category: string }> };
    expect(parsed.checks.some((check) => check.category === 'brand')).toBe(true);
  });

  it('is deterministic — identical IR yields an identical package', async () => {
    const a = assembleCreativePackage(ir, await runAdapters(ir));
    const b = assembleCreativePackage(ir, await runAdapters(ir));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('discovers adapters by capability through the registry', () => {
    const registry = new StandardAdapterRegistry(createStandardAdapters());
    const brandAware = registry.listByCapability('brand-compliance-checks');
    expect(brandAware.map((info) => info.name)).toContain('qa-spec');
    expect(registry.list()).toHaveLength(7);
  });
});

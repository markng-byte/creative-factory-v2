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
import { StandardPromptTranslationEngine } from './engine.js';
import { StandardPromptTranslationAdapter } from './adapter.js';
import { DryRunProvider } from './provider.js';
import { DeterministicIdGenerator, FixedClock } from './support.js';
import type { PromptRequest } from './types.js';

async function compileExampleIR(): Promise<CreativeIR> {
  const brand = exampleBrandBundle();
  const compiler = new StandardCreativeIRCompiler({
    briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: new InMemoryCampaignSource([exampleCampaign()]),
    brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    clock: new CompilerClock('2026-07-01T00:00:00.000Z'),
    ids: new CompilerIds('prompt-test'),
  });
  const { creativeIR } = await compiler.compile({
    creativeBriefId: 'brief-northwind-001',
    brandId: 'brand-northwind',
    campaignId: 'campaign-northwind-q3',
    validationMode: ValidationMode.STRICT,
  });
  return creativeIR;
}

function makeEngine(): StandardPromptTranslationEngine {
  return new StandardPromptTranslationEngine({
    clock: new FixedClock('2026-07-03T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('t'),
  });
}

describe('StandardPromptTranslationEngine', () => {
  let ir: CreativeIR;

  beforeAll(async () => {
    ir = await compileExampleIR();
  });

  it('translates every asset request into a prompt (nothing dropped)', () => {
    const { promptPackage, unhandled } = makeEngine().translate(ir);
    expect(unhandled).toEqual([]);
    expect(promptPackage.requests).toHaveLength(ir.assetRequests.length);
  });

  it('routes asset types to the right target kind', () => {
    const { promptPackage } = makeEngine().translate(ir);
    const kinds = new Set(promptPackage.requests.map((request) => request.targetKind));
    expect(kinds.has('image')).toBe(true);
    expect(kinds.has('video')).toBe(true);
    expect(kinds.has('voiceover')).toBe(true);
    expect(promptPackage.counts.image).toBeGreaterThan(0);
    // Every asset request is one of the three target kinds.
    expect(
      promptPackage.counts.image + promptPackage.counts.video + promptPackage.counts.voiceover,
    ).toBe(ir.assetRequests.length);
  });

  it('builds image prompts from the shot visual spec with brand controls and a seed', () => {
    const { promptPackage } = makeEngine().translate(ir);
    const image = promptPackage.requests.find((request) => request.targetKind === 'image');
    expect(image).toBeDefined();
    expect(image?.prompt).toContain('shot of');
    expect(image?.brandControls['primaryColor']).toBe('#0B2E4F');
    expect(typeof image?.parameters['seed']).toBe('number');
    expect(image?.negativePrompt.length).toBeGreaterThan(0);
  });

  it('distinguishes voiceover from music within the audio target', () => {
    const { promptPackage } = makeEngine().translate(ir);
    const targets = new Set(
      promptPackage.requests
        .filter((request) => request.targetKind === 'voiceover')
        .map((request) => request.target),
    );
    expect(targets.has('audio.voiceover')).toBe(true);
    expect(targets.has('audio.music')).toBe(true);
  });

  it('emits a prompt.generated event per request', () => {
    const { promptPackage, events } = makeEngine().translate(ir);
    expect(events).toHaveLength(promptPackage.requests.length);
    expect(events.every((event) => event.name === 'prompt.generated')).toBe(true);
    expect(events[0]?.payload.sourceHash).toBe(promptPackage.requests[0]?.sourceHash);
  });

  it('is deterministic — identical IR yields a byte-identical package', () => {
    const a = makeEngine().translate(ir);
    const b = makeEngine().translate(ir);
    expect(JSON.stringify(a.promptPackage)).toBe(JSON.stringify(b.promptPackage));
  });

  it('reports unsupported asset types as unhandled instead of dropping them', () => {
    const withModel: CreativeIR = {
      ...ir,
      assetRequests: [
        ...ir.assetRequests,
        {
          ...(ir.assetRequests[0] as (typeof ir.assetRequests)[number]),
          id: 'asset_model_x' as (typeof ir.assetRequests)[number]['id'],
          assetType: '3d-model',
        },
      ],
    };
    const { unhandled } = makeEngine().translate(withModel);
    expect(unhandled).toContain('asset_model_x');
  });

  describe('dispatch seam', () => {
    it('prepares payloads offline via the default dry-run provider', async () => {
      const engine = makeEngine();
      const { promptPackage } = engine.translate(ir);
      const results = await engine.dispatch(promptPackage);
      expect(results).toHaveLength(promptPackage.requests.length);
      expect(results.every((result) => result.provider === 'dry-run')).toBe(true);
      expect(results.every((result) => result.status === 'prepared')).toBe(true);
    });

    it('skips requests a provider does not support', async () => {
      const imageOnlyProvider = {
        name: 'image-only',
        supports: (kind: PromptRequest['targetKind']) => kind === 'image',
        dispatch: new DryRunProvider().dispatch.bind(new DryRunProvider()),
      };
      const engine = new StandardPromptTranslationEngine({
        clock: new FixedClock('2026-07-03T00:00:00.000Z'),
        ids: new DeterministicIdGenerator('t'),
        provider: imageOnlyProvider,
      });
      const { promptPackage } = engine.translate(ir);
      const results = await engine.dispatch(promptPackage);
      const skipped = results.filter((result) => result.status === 'skipped');
      expect(skipped.length).toBeGreaterThan(0);
      expect(skipped.every((result) => result.targetKind !== 'image')).toBe(true);
    });
  });

  it('plugs into the Creative IR adapter registry contract', async () => {
    const adapter = new StandardPromptTranslationAdapter();
    expect(adapter.name).toBe('prompt-translation');
    expect(adapter.validate(ir).isValid).toBe(true);
    const output = await adapter.transform(ir, {
      outputFormat: 'json',
      includeMetadata: true,
      validationMode: ValidationMode.STRICT,
      parameters: {},
    });
    const artifact = output.artifacts[0];
    expect(artifact?.name).toBe('prompt-package.json');
    const parsed = JSON.parse(String(artifact?.content)) as { requests: unknown[] };
    expect(parsed.requests.length).toBe(ir.assetRequests.length);
  });
});

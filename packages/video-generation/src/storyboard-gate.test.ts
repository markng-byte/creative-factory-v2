import { describe, expect, it } from 'vitest';
import {
  ValidationMode,
  StoryboardNotApprovedError,
  type CreativeIR,
} from '@creative-factory/creative-ir';
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
import type { PromptProvider, PromptRequest } from '@creative-factory/prompt-translation';
import { StandardVideoGenerationEngine } from './engine.js';
import { SmilVideoProvider } from './provider.js';

async function compileIR(): Promise<CreativeIR> {
  const brand = exampleBrandBundle();
  const compiler = new StandardCreativeIRCompiler({
    briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: new InMemoryCampaignSource([exampleCampaign()]),
    brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    clock: new CompilerClock('2026-07-01T00:00:00.000Z'),
    ids: new CompilerIds('gate-test'),
  });
  const { creativeIR } = await compiler.compile({
    creativeBriefId: 'brief-northwind-001',
    brandId: 'brand-northwind',
    campaignId: 'campaign-northwind-q3',
    validationMode: ValidationMode.STRICT,
  });
  return creativeIR;
}

const withState = (
  ir: CreativeIR,
  state: CreativeIR['campaign']['lifecycleState'],
): CreativeIR => ({
  ...ir,
  campaign: { ...ir.campaign, lifecycleState: state },
});

/** Stands in for a paid external API: not offline, records every dispatch. */
class PaidProvider implements PromptProvider {
  readonly name = 'paid-api';
  readonly calls: string[] = [];
  private readonly inner = new SmilVideoProvider();
  supports(kind: Parameters<PromptProvider['supports']>[0]): boolean {
    return this.inner.supports(kind);
  }
  async dispatch(request: PromptRequest) {
    this.calls.push(request.id);
    return { ...(await this.inner.dispatch(request)), provider: this.name };
  }
}

describe('storyboard gate (video generation)', () => {
  it('refuses a paid provider before any call while the storyboard is not approved', async () => {
    const ir = await compileIR();
    expect(ir.campaign.lifecycleState).toBe('STORYBOARD_DRAFT');
    const provider = new PaidProvider();
    const engine = new StandardVideoGenerationEngine({ provider });
    await expect(engine.generate(ir)).rejects.toBeInstanceOf(StoryboardNotApprovedError);
    await expect(engine.generate(withState(ir, 'STORYBOARD_REVIEW'))).rejects.toMatchObject({
      code: 'STORYBOARD_NOT_APPROVED',
    });
    expect(provider.calls).toEqual([]);
  });

  it('lets a paid provider run once the storyboard is approved (PROMPT_READY or later)', async () => {
    const provider = new PaidProvider();
    const result = await new StandardVideoGenerationEngine({ provider }).generate(
      withState(await compileIR(), 'PROMPT_READY'),
    );
    expect(provider.calls.length).toBeGreaterThan(0);
    expect(result.outputs.length).toBe(provider.calls.length);
  });

  it('does not gate the offline renderer by default; "always" gates it; "off" never gates', async () => {
    const ir = await compileIR();
    expect((await new StandardVideoGenerationEngine().generate(ir)).outputs.length).toBeGreaterThan(
      0,
    );
    await expect(
      new StandardVideoGenerationEngine({ storyboardGate: 'always' }).generate(ir),
    ).rejects.toBeInstanceOf(StoryboardNotApprovedError);
    expect(
      (
        await new StandardVideoGenerationEngine({
          provider: new PaidProvider(),
          storyboardGate: 'off',
        }).generate(ir)
      ).outputs.length,
    ).toBeGreaterThan(0);
  });
});

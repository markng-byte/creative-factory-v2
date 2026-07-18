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
  DeterministicIdGenerator as GenIds,
  FixedClock as GenClock,
} from '@creative-factory/prompt-translation';
import { StandardImageGenerationEngine } from '@creative-factory/image-generation';
import { StandardVideoGenerationEngine } from '@creative-factory/video-generation';
import { StandardQaEngine } from './engine.js';
import { FixedClock, DeterministicIdGenerator } from './support.js';

/** Compile the example IR, then run image + video generation so QA has real assets to judge. */
async function generatedIR(): Promise<CreativeIR> {
  const brand = exampleBrandBundle();
  const compiler = new StandardCreativeIRCompiler({
    briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: new InMemoryCampaignSource([exampleCampaign()]),
    brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    clock: new CompilerClock('2026-07-01T00:00:00.000Z'),
    ids: new CompilerIds('qa-test'),
  });
  const { creativeIR } = await compiler.compile({
    creativeBriefId: 'brief-northwind-001',
    brandId: 'brand-northwind',
    campaignId: 'campaign-northwind-q3',
    validationMode: ValidationMode.STRICT,
  });
  const afterImages = await new StandardImageGenerationEngine({
    clock: new GenClock('2026-07-04T00:00:00.000Z'),
    ids: new GenIds('g'),
  }).generate(creativeIR);
  const afterVideo = await new StandardVideoGenerationEngine({
    clock: new GenClock('2026-07-05T00:00:00.000Z'),
    ids: new GenIds('v'),
  }).generate(afterImages.creativeIR);
  return afterVideo.creativeIR;
}

function makeEngine(): StandardQaEngine {
  return new StandardQaEngine({
    clock: new FixedClock('2026-07-06T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('q'),
  });
}

describe('StandardQaEngine', () => {
  let ir: CreativeIR;

  beforeAll(async () => {
    ir = await generatedIR();
  });

  it('passes QA on brand-compliant generated assets and recommends the review transition', () => {
    const outcome = makeEngine().run(ir);
    expect(outcome.report.overall).toBe('PASS');
    expect(outcome.report.assessed).toBe(26); // 13 image + 13 video
    expect(outcome.report.failed).toBe(0);
    expect(outcome.report.skipped).toBe(7); // audio not generated
    expect(outcome.recommendedTransition?.transition).toBe('complete_generation');
    expect(outcome.recommendedTransition?.to).toBe('ASSET_REVIEW');
  });

  it('inspects real content — brand palette and prohibited checks run against decoded bytes', () => {
    const outcome = makeEngine().run(ir);
    const result = outcome.report.assets[0];
    const ruleIds = new Set(result?.findings.map((finding) => finding.ruleId));
    expect(ruleIds.has('brand-palette')).toBe(true);
    expect(ruleIds.has('prohibited-absent')).toBe(true);
    expect(ruleIds.has('dimension-match')).toBe(true);
    expect(result?.findings.every((finding) => finding.passed)).toBe(true);
  });

  it('writes qaStatus back into the Creative IR for judged assets, leaving others pending', () => {
    const { creativeIR } = makeEngine().run(ir);
    const visual = creativeIR.assetRequests.filter(
      (request) => request.assetType === 'image' || request.assetType === 'video',
    );
    expect(visual.every((request) => request.qaStatus === 'approved')).toBe(true);
    const audio = creativeIR.assetRequests.find((request) => request.assetType === 'audio');
    expect(audio?.qaStatus).toBe('pending');
  });

  it('emits a qa.completed event carrying the overall verdict', () => {
    const { events, report } = makeEngine().run(ir);
    expect(events).toHaveLength(1);
    expect(events[0]?.name).toBe('qa.completed');
    expect(events[0]?.payload.status).toBe(report.overall);
    expect(events[0]?.payload.reportId).toBe(report.reportId);
  });

  it('fails QA and withholds the transition when a rule is violated', () => {
    // Tamper with one delivered image so its dimensions no longer match the spec.
    const tampered: CreativeIR = {
      ...ir,
      assetRequests: ir.assetRequests.map((request) => {
        if (request.assetType !== 'image' || request.deliveredAssets.length === 0) {
          return request;
        }
        const [first, ...rest] = request.deliveredAssets;
        return {
          ...request,
          deliveredAssets: [
            {
              ...(first as (typeof request.deliveredAssets)[number]),
              metadata: { ...first!.metadata, width: 3 },
            },
            ...rest,
          ],
        };
      }),
    };
    const outcome = makeEngine().run(tampered);
    expect(outcome.report.overall).toBe('FAIL');
    expect(outcome.report.failed).toBeGreaterThan(0);
    expect(outcome.recommendedTransition).toBeUndefined();
    expect(outcome.transitionUnavailable).toContain('QA failed');
    const rejected = outcome.creativeIR.assetRequests.find(
      (request) => request.qaStatus === 'rejected',
    );
    expect(rejected).toBeDefined();
  });

  it('is deterministic — identical input yields identical report, IR, and events', () => {
    const a = makeEngine().run(ir);
    const b = makeEngine().run(ir);
    expect(JSON.stringify(a.report)).toBe(JSON.stringify(b.report));
    expect(JSON.stringify(a.creativeIR)).toBe(JSON.stringify(b.creativeIR));
    expect(JSON.stringify(a.events)).toBe(JSON.stringify(b.events));
  });

  it('supports a custom rule set through the pluggable engine', () => {
    const alwaysFail = {
      id: 'always-fail',
      severity: 'critical' as const,
      evaluate: () => ({
        ruleId: 'always-fail',
        severity: 'critical' as const,
        passed: false,
        message: 'nope',
      }),
    };
    const outcome = new StandardQaEngine({
      rules: [alwaysFail],
      clock: new FixedClock('2026-07-06T00:00:00.000Z'),
      ids: new DeterministicIdGenerator('q'),
    }).run(ir);
    expect(outcome.report.overall).toBe('FAIL');
  });
});

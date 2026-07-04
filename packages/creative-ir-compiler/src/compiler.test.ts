import { describe, expect, it } from 'vitest';
import { ValidationMode, type CompilerRequest } from '@creative-factory/creative-ir';
import { CompilationError, StandardCreativeIRCompiler } from './compiler.js';
import { exampleBrandBundle, exampleCampaign, exampleCreativeBrief } from './examples.js';
import {
  InMemoryBrandTokensSource,
  InMemoryCampaignSource,
  InMemoryCreativeBriefSource,
} from './sources/in-memory.js';
import { FixedClock } from './support/clock.js';
import { DeterministicIdGenerator } from './support/id.js';

function makeCompiler(): StandardCreativeIRCompiler {
  const brand = exampleBrandBundle();
  return new StandardCreativeIRCompiler({
    briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: new InMemoryCampaignSource([exampleCampaign()]),
    brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    clock: new FixedClock('2026-07-01T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('test-seed'),
  });
}

const request: CompilerRequest = {
  creativeBriefId: 'brief-northwind-001',
  brandId: 'brand-northwind',
  campaignId: 'campaign-northwind-q3',
  validationMode: ValidationMode.STRICT,
};

describe('StandardCreativeIRCompiler', () => {
  it('compiles a valid Creative IR without contacting any provider', async () => {
    const { creativeIR, compilation } = await makeCompiler().compile(request);

    expect(compilation.success).toBe(true);
    expect(creativeIR.validationStatus.isValid).toBe(true);
    expect(creativeIR.stories).toHaveLength(1);

    const [story] = creativeIR.stories;
    expect(story?.storyboards[0]?.scenes).toHaveLength(6);
    expect(creativeIR.assetRequests.length).toBeGreaterThan(0);
  });

  it('produces a frame-accurate timeline that matches the campaign duration', async () => {
    const { creativeIR } = await makeCompiler().compile(request);
    // 30 seconds at 30fps.
    expect(creativeIR.stories[0]?.durationFrames).toBe(900);
  });

  it('is deterministic — identical inputs yield a byte-identical document', async () => {
    const first = await makeCompiler().compile(request);
    const second = await makeCompiler().compile(request);
    expect(JSON.stringify(second.creativeIR)).toBe(JSON.stringify(first.creativeIR));
  });

  it('links every asset request to a real shot', async () => {
    const { creativeIR } = await makeCompiler().compile(request);
    const shotIds = new Set(
      creativeIR.stories.flatMap((story) =>
        story.storyboards.flatMap((sb) =>
          sb.scenes.flatMap((scene) => scene.shots.map((shot) => shot.id as string)),
        ),
      ),
    );
    for (const req of creativeIR.assetRequests) {
      expect(shotIds.has(req.shotId as string)).toBe(true);
    }
  });

  it('rejects an unresolvable brief', async () => {
    await expect(
      makeCompiler().compile({ ...request, creativeBriefId: 'missing' }),
    ).rejects.toBeInstanceOf(CompilationError);
  });
});

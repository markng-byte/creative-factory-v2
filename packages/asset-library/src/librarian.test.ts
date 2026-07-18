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
import { StandardQaEngine } from '@creative-factory/qa-engine';
import { StandardAssetLibrarian } from './librarian.js';
import { InMemoryAssetLibrary } from './library.js';
import { DeterministicIdGenerator, FixedClock } from './support.js';

/** Compile → generate image+video → QA-approve, so the library has approved assets to ingest. */
async function approvedIR(): Promise<CreativeIR> {
  const brand = exampleBrandBundle();
  const compiler = new StandardCreativeIRCompiler({
    briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: new InMemoryCampaignSource([exampleCampaign()]),
    brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    clock: new CompilerClock('2026-07-01T00:00:00.000Z'),
    ids: new CompilerIds('lib-test'),
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
  const afterQa = new StandardQaEngine({
    clock: new FixedClock('2026-07-06T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('q'),
  }).run(afterVideo.creativeIR);
  return afterQa.creativeIR;
}

function makeLibrarian(): StandardAssetLibrarian {
  return new StandardAssetLibrarian({
    library: new InMemoryAssetLibrary(),
    clock: new FixedClock('2026-07-07T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('l'),
  });
}

describe('StandardAssetLibrarian', () => {
  let ir: CreativeIR;

  beforeAll(async () => {
    ir = await approvedIR();
  });

  it('catalogs only QA-approved assets, one logical asset per request', () => {
    const { report, library } = makeLibrarian().ingest(ir);
    // 26 approved visual assets (13 image + 13 video); audio is pending, not approved.
    expect(report.considered).toBe(26);
    expect(report.created).toBe(26);
    expect(report.deduped).toBe(0);
    expect(library.list()).toHaveLength(26);
    expect(library.list().every((asset) => asset.latestVersion === 1)).toBe(true);
  });

  it('content-addresses each version and records provenance', () => {
    const { library } = makeLibrarian().ingest(ir);
    const asset = library.list()[0];
    const version = asset?.versions[0];
    expect(version?.contentHash.startsWith('sha_')).toBe(true);
    expect(version?.version).toBe(1);
    expect(version?.provenance.sourceEngine).toMatch(/generation/);
  });

  it('records library references back onto the Creative IR', () => {
    const { creativeIR } = makeLibrarian().ingest(ir);
    const approved = creativeIR.assetRequests.find((request) => request.qaStatus === 'approved');
    const refs = approved?.metadata['library'] as Array<Record<string, unknown>> | undefined;
    expect(refs).toBeDefined();
    expect(String(refs?.[0]?.['libraryAssetId']).startsWith('libasset_')).toBe(true);
    expect(refs?.[0]?.['version']).toBe(1);
  });

  it('deduplicates on re-ingest of identical content — no new versions', () => {
    const librarian = makeLibrarian();
    const first = librarian.ingest(ir);
    const second = librarian.ingest(first.creativeIR);
    expect(second.report.created).toBe(0);
    expect(second.report.deduped).toBe(26);
    expect(second.library.list().every((asset) => asset.latestVersion === 1)).toBe(true);
  });

  it('creates a new version when an asset is regenerated with different content', () => {
    const librarian = makeLibrarian();
    librarian.ingest(ir);

    // Simulate a regeneration: same request, a different delivered asset (new url/content).
    const regenerated: CreativeIR = {
      ...ir,
      assetRequests: ir.assetRequests.map((request) => {
        if (request.assetType !== 'image' || request.qaStatus !== 'approved') {
          return request;
        }
        const [first] = request.deliveredAssets;
        if (!first) return request;
        return {
          ...request,
          deliveredAssets: [{ ...first, id: `${first.id}-v2`, url: `${first.url}#regen` }],
        };
      }),
    };
    const second = librarian.ingest(regenerated);
    expect(second.report.created).toBe(13); // 13 images regenerated
    expect(second.report.deduped).toBe(13); // 13 videos unchanged
    const anImage = second.library.list().find((asset) => asset.assetType === 'image');
    expect(anImage?.latestVersion).toBe(2);
    expect(anImage?.versions[1]?.version).toBe(2);
  });

  it('emits an asset.cataloged event per ingested output', () => {
    const { events, report } = makeLibrarian().ingest(ir);
    expect(events).toHaveLength(report.considered);
    expect(events.every((event) => event.name === 'asset.cataloged')).toBe(true);
    expect(events[0]?.payload.deduped).toBe(false);
  });

  it('is deterministic — identical input yields identical report, IR, and events', () => {
    const a = makeLibrarian().ingest(ir);
    const b = makeLibrarian().ingest(ir);
    expect(JSON.stringify(a.report)).toBe(JSON.stringify(b.report));
    expect(JSON.stringify(a.creativeIR)).toBe(JSON.stringify(b.creativeIR));
    expect(JSON.stringify(a.events)).toBe(JSON.stringify(b.events));
  });
});

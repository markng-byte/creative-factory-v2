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
import { StandardAssetLibrarian, InMemoryAssetLibrary } from '@creative-factory/asset-library';
import { StandardExportEngine } from './engine.js';
import { FixedClock, DeterministicIdGenerator } from './support.js';

/** Full pipeline: compile → generate → QA-approve → catalog, so export has a finished campaign. */
async function catalogedIR(): Promise<CreativeIR> {
  const brand = exampleBrandBundle();
  const compiler = new StandardCreativeIRCompiler({
    briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: new InMemoryCampaignSource([exampleCampaign()]),
    brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    clock: new CompilerClock('2026-07-01T00:00:00.000Z'),
    ids: new CompilerIds('export-test'),
  });
  const { creativeIR } = await compiler.compile({
    creativeBriefId: 'brief-northwind-001',
    brandId: 'brand-northwind',
    campaignId: 'campaign-northwind-q3',
    validationMode: ValidationMode.STRICT,
  });
  const img = await new StandardImageGenerationEngine({
    clock: new GenClock('2026-07-04T00:00:00.000Z'),
    ids: new GenIds('g'),
  }).generate(creativeIR);
  const vid = await new StandardVideoGenerationEngine({
    clock: new GenClock('2026-07-05T00:00:00.000Z'),
    ids: new GenIds('v'),
  }).generate(img.creativeIR);
  const qa = new StandardQaEngine({
    clock: new FixedClock('2026-07-06T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('q'),
  }).run(vid.creativeIR);
  const cataloged = new StandardAssetLibrarian({
    library: new InMemoryAssetLibrary(),
    clock: new FixedClock('2026-07-07T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('l'),
  }).ingest(qa.creativeIR);
  return cataloged.creativeIR;
}

function makeEngine(): StandardExportEngine {
  return new StandardExportEngine({
    clock: new FixedClock('2026-07-08T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('x'),
  });
}

describe('StandardExportEngine', () => {
  let ir: CreativeIR;

  beforeAll(async () => {
    ir = await catalogedIR();
  });

  it('assembles a manifest of the approved, catalogued assets with content hashes', async () => {
    const { exportPackage } = await makeEngine().export(ir);
    expect(exportPackage.manifest.totalAssets).toBe(26); // 13 image + 13 video approved
    expect(exportPackage.manifest.byType['image']).toBe(13);
    expect(exportPackage.manifest.byType['video']).toBe(13);
    const entry = exportPackage.manifest.entries[0];
    expect(entry?.contentHash.startsWith('sha_')).toBe(true);
    expect(entry?.libraryAssetId?.startsWith('libasset_')).toBe(true); // from Sprint 11 link-back
  });

  it('groups assets into per-aspect-ratio channel bundles and publishes them', async () => {
    const { exportPackage } = await makeEngine().export(ir);
    expect(exportPackage.bundles).toHaveLength(1); // all 16:9 in the example
    expect(exportPackage.bundles[0]?.aspectRatio).toBe('16:9');
    expect(exportPackage.published.every((result) => result.status === 'published')).toBe(true);
    expect(exportPackage.published[0]?.location.startsWith('dryrun://')).toBe(true);
  });

  it('assembles a viewable finished campaign page embedding the real generated media', async () => {
    const { exportPackage } = await makeEngine().export(ir);
    const page = exportPackage.deliverables.find((d) => d.name === 'campaign.html');
    expect(page?.mimeType).toBe('text/html');
    expect(page?.content).toContain('<!doctype html>');
    expect(page?.content).toContain('Final Delivery');
    expect(page?.content).toContain('data:image/svg+xml;base64,'); // embedded generated assets
    expect(page?.content).toContain('Northwind');
  });

  it('records ExportMetadata back into the Creative IR', async () => {
    const { creativeIR } = await makeEngine().export(ir);
    expect(creativeIR.exports).toHaveLength(1);
    const record = creativeIR.exports[0];
    expect(record?.exportFormat).toBe('production-package');
    expect(record?.status).toBe('completed');
    expect(record?.artifacts.length).toBe(2); // campaign.html + manifest.json
  });

  it('drives the export workflow transitions to COMPLETED', async () => {
    const { recommendedTransitions } = await makeEngine().export(ir, {
      lifecycleState: 'FINAL_APPROVAL',
    });
    expect(recommendedTransitions.map((t) => t.transition)).toEqual([
      'start_export',
      'complete_export',
    ]);
    expect(recommendedTransitions[recommendedTransitions.length - 1]?.to).toBe('COMPLETED');
  });

  it('emits export.published and lifecycle events', async () => {
    const { events } = await makeEngine().export(ir);
    const names = events.map((event) => event.name);
    expect(names).toContain('export.published');
    expect(names).toContain('campaign.lifecycle.transitioned');
  });

  it('is deterministic — identical input yields an identical package, IR, and events', async () => {
    const a = await makeEngine().export(ir);
    const b = await makeEngine().export(ir);
    expect(JSON.stringify(a.exportPackage)).toBe(JSON.stringify(b.exportPackage));
    expect(JSON.stringify(a.creativeIR)).toBe(JSON.stringify(b.creativeIR));
    expect(JSON.stringify(a.events)).toBe(JSON.stringify(b.events));
  });
});

import { describe, expect, it } from 'vitest';
import { ValidationMode } from '@creative-factory/creative-ir';
import {
  InMemoryBrandTokensSource,
  InMemoryCampaignSource,
  InMemoryCreativeBriefSource,
  exampleBrandBundle,
  exampleCampaign,
  exampleCreativeBrief,
} from '@creative-factory/creative-ir-compiler';
import { createPipeline } from './pipeline.js';
import { FixedClock } from './support.js';

function buildPipeline() {
  const brand = exampleBrandBundle();
  return createPipeline({
    briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: new InMemoryCampaignSource([exampleCampaign()]),
    brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    clock: new FixedClock('2026-07-10T00:00:00.000Z'),
    seed: 'northwind',
  });
}

const request = {
  creativeBriefId: 'brief-northwind-001',
  brandId: 'brand-northwind',
  campaignId: 'campaign-northwind-q3',
  validationMode: ValidationMode.STRICT,
};

describe('StandardPipeline (end-to-end)', () => {
  it('runs the whole system from brief to a finished, analyzed campaign in one call', async () => {
    const result = await buildPipeline().run(request);

    // Compiled structure.
    expect(result.summary.scenes).toBe(6);
    expect(result.summary.shots).toBe(13);

    // Translated + generated + approved.
    expect(result.promptPackage.requests.length).toBe(33);
    expect(result.summary.assetsGenerated).toBe(26);
    expect(result.summary.assetsApproved).toBe(26);
    expect(result.qaReport.overall).toBe('PASS');

    // Exported to a finished campaign and completed.
    expect(result.exportPackage.manifest.totalAssets).toBe(26);
    expect(result.finishedCampaignPage).toContain('<!doctype html>');
    expect(result.summary.completed).toBe(true);

    // Analyzed.
    expect(result.analyticsReport.lifecycle.completed).toBe(true);
    expect(result.dashboard).toContain('Campaign Analytics');
    expect(result.recommendations.some((rec) => rec.id === 'completed')).toBe(true);
  });

  it('collects the full event stream across every stage', async () => {
    const result = await buildPipeline().run(request);
    const names = new Set(result.events.map((event) => event.name));
    expect(names).toContain('prompt.generated');
    expect(names).toContain('asset.generated');
    expect(names).toContain('qa.completed');
    expect(names).toContain('asset.cataloged');
    expect(names).toContain('export.published');
    expect(names).toContain('campaign.lifecycle.transitioned');
    expect(result.summary.eventCount).toBe(result.events.length);
  });

  it('produces a valid Creative IR at the end of the run', async () => {
    const result = await buildPipeline().run(request);
    expect(result.creativeIR.validationStatus.isValid).toBe(true);
    expect(result.creativeIR.exports).toHaveLength(1);
  });

  it('is deterministic end to end — identical inputs yield an identical result', async () => {
    const a = await buildPipeline().run(request);
    const b = await buildPipeline().run(request);
    expect(JSON.stringify(a.creativeIR)).toBe(JSON.stringify(b.creativeIR));
    expect(JSON.stringify(a.events)).toBe(JSON.stringify(b.events));
    expect(a.dashboard).toBe(b.dashboard);
    expect(a.finishedCampaignPage).toBe(b.finishedCampaignPage);
  });
});

#!/usr/bin/env node
/**
 * Creative Factory — end-to-end demo.
 *
 * Runs the entire pipeline in one call for the built-in "Northwind Analytics" example:
 * Brief → compile → translate → generate (image + video) → QA → catalog → export → analyze.
 * Writes the finished campaign page and the analytics dashboard to `.demo-output/`.
 *
 * Prerequisite: `pnpm build` (or `pnpm demo`, which builds the pipeline first).
 * No network, no AI provider, no secrets — fully deterministic.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ValidationMode } from '@creative-factory/creative-ir';
import { createPipeline } from '@creative-factory/pipeline';
import {
  InMemoryBrandTokensSource,
  InMemoryCampaignSource,
  InMemoryCreativeBriefSource,
  exampleBrandBundle,
  exampleCampaign,
  exampleCreativeBrief,
} from '@creative-factory/creative-ir-compiler';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '.demo-output');

const brand = exampleBrandBundle();
const pipeline = createPipeline({
  briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
  campaigns: new InMemoryCampaignSource([exampleCampaign()]),
  brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
  seed: 'northwind',
});

const started = Date.now();
const result = await pipeline.run({
  creativeBriefId: 'brief-northwind-001',
  brandId: 'brand-northwind',
  campaignId: 'campaign-northwind-q3',
  validationMode: ValidationMode.STRICT,
});
const ms = Date.now() - started;

mkdirSync(outDir, { recursive: true });
if (result.finishedCampaignPage) {
  writeFileSync(resolve(outDir, 'final-delivery.html'), result.finishedCampaignPage);
}
writeFileSync(resolve(outDir, 'analytics-dashboard.html'), result.dashboard);
writeFileSync(
  resolve(outDir, 'creative-ir.json'),
  JSON.stringify(result.creativeIR, null, 2),
);

const { summary, analyticsReport } = result;
const eventNames = [...new Set(result.events.map((event) => event.name))].sort();

console.log('');
console.log('  Creative Factory — end-to-end run complete in %dms', ms);
console.log('  ─────────────────────────────────────────────────');
console.log('  Campaign      : %s', result.creativeIR.campaign.name);
console.log('  Structure     : %d scenes · %d shots', summary.scenes, summary.shots);
console.log(
  '  Assets        : %d generated · %d approved (of %d planned)',
  summary.assetsGenerated,
  summary.assetsApproved,
  analyticsReport.assets.total,
);
console.log('  QA            : %s (%s pass rate)', result.qaReport.overall, pct(analyticsReport.quality.passRate));
console.log('  Export        : %d bundle(s) published · lifecycle COMPLETED=%s', result.exportPackage.bundles.length, summary.completed);
console.log('  Events        : %d (%s)', summary.eventCount, eventNames.join(', '));
console.log('  Recommendations:');
for (const rec of result.recommendations) {
  console.log('    [%s] %s', rec.severity, rec.message);
}
console.log('');
console.log('  Wrote:');
console.log('    %s', resolve(outDir, 'final-delivery.html'));
console.log('    %s', resolve(outDir, 'analytics-dashboard.html'));
console.log('    %s', resolve(outDir, 'creative-ir.json'));
console.log('');
console.log('  Open the two HTML files in a browser to see the finished campaign and dashboard.');
console.log('');

function pct(value) {
  return `${Math.round(value * 1000) / 10}%`;
}

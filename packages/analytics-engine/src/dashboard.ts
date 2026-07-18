/**
 * Dashboard renderer.
 *
 * Renders a self-contained, deterministic HTML dashboard from an analytics report and its
 * recommendations: KPI tiles, the lifecycle funnel, quality/reuse meters, and the recommendation
 * list. No external assets; brand-styled and theme-aware.
 */

import { escapeHtml, pct } from './support.js';
import type { AnalyticsReport, OptimizationRecommendation } from './types.js';

export function assembleDashboard(
  report: AnalyticsReport,
  recommendations: readonly OptimizationRecommendation[],
): string {
  const tiles = [
    tile('Assets generated', `${report.assets.generated}`, `of ${report.assets.total} planned`),
    tile(
      'QA pass rate',
      pct(report.quality.passRate),
      `${report.quality.passed}/${report.quality.assessed} assessed`,
    ),
    tile('Approved', `${report.assets.approved}`, 'ready to publish'),
    tile(
      'Dedup rate',
      pct(report.reuse.dedupRate),
      `${report.reuse.deduped}/${report.reuse.cataloged} catalogued`,
    ),
    tile('Prompts', `${report.activity.promptsGenerated}`, 'translated'),
    tile(
      'Completed',
      report.lifecycle.completed ? 'Yes' : 'No',
      report.lifecycle.reachedStates.at(-1) ?? '—',
    ),
  ].join('\n');

  const funnel = report.lifecycle.reachedStates
    .map((state) => `<li>${escapeHtml(state)}</li>`)
    .join('\n');

  const recs = recommendations
    .map(
      (rec) => `<li class="rec ${rec.severity}">
      <span class="sev">${rec.severity}</span>
      <div><strong>${escapeHtml(rec.category)}</strong><p>${escapeHtml(rec.message)}</p>${rec.metric ? `<code>${escapeHtml(rec.metric)}</code>` : ''}</div>
    </li>`,
    )
    .join('\n');

  const assetsByType = Object.entries(report.assets.byType)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, count]) => `<li><span>${escapeHtml(type)}</span><b>${count}</b></li>`)
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Campaign Analytics — ${escapeHtml(report.campaignId)}</title>
<style>${STYLES}</style></head>
<body>
<header><p class="kicker">Analytics &amp; Optimization</p><h1>Campaign Analytics</h1><p class="sub">${escapeHtml(report.campaignId)} · Creative IR ${escapeHtml(report.creativeIRId)}</p></header>
<main>
  <section class="tiles">${tiles}</section>
  <div class="cols">
    <section class="card"><h2>Lifecycle</h2><ol class="funnel">${funnel || '<li>none</li>'}</ol></section>
    <section class="card"><h2>Assets by type</h2><ul class="bars">${assetsByType}</ul></section>
  </div>
  <section class="card"><h2>Optimization recommendations</h2><ul class="recs">${recs}</ul></section>
</main>
<footer>Generated deterministically from the Creative IR and event stream · ${escapeHtml(report.generatedAt)}</footer>
</body></html>`;
}

function tile(label: string, value: string, sub: string): string {
  return `<div class="tile"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(value)}</span><span class="tsub">${escapeHtml(sub)}</span></div>`;
}

const STYLES = `
:root{color-scheme:light dark}
*{box-sizing:border-box}
body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;line-height:1.5;color:#0b0f14;background:#f5f7fa}
header{padding:2rem;background:linear-gradient(135deg,#0B2E4F,#1FB6A6);color:#fff}
.kicker{margin:0 0 .35rem;text-transform:uppercase;letter-spacing:.08em;font-size:.72rem;opacity:.85}
header h1{margin:0 0 .2rem}
.sub{margin:0;opacity:.9;font-family:monospace;font-size:.82rem}
main{max-width:1100px;margin:0 auto;padding:1.5rem 2rem}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:1rem}
.tile{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:1rem 1.1rem;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.tile .label{display:block;color:#6b7280;font-size:.78rem}
.tile .value{display:block;font-size:1.7rem;font-weight:700;color:#0B2E4F;margin:.15rem 0}
.tile .tsub{display:block;color:#9ca3af;font-size:.74rem}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:1rem 1.25rem;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.card h2{margin:.1rem 0 .8rem;font-size:1rem}
.funnel{margin:0;padding-left:1.1rem}
.funnel li{padding:.15rem 0;color:#374151}
.bars{list-style:none;margin:0;padding:0}
.bars li{display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px solid #f0f2f5}
.recs{list-style:none;margin:0;padding:0}
.rec{display:flex;gap:.75rem;align-items:flex-start;padding:.6rem 0;border-bottom:1px solid #f0f2f5}
.rec p{margin:.15rem 0}
.rec code{font-size:.74rem;color:#6b7280}
.sev{flex:0 0 auto;font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;border-radius:999px;padding:.1rem .55rem;color:#fff}
.rec.success .sev{background:#1FB6A6}.rec.info .sev{background:#3b82f6}.rec.warning .sev{background:#F5A623;color:#3a2600}.rec.critical .sev{background:#e5484d}
footer{max-width:1100px;margin:0 auto;padding:1.5rem 2rem;color:#9ca3af;font-family:monospace;font-size:.76rem}
@media (max-width:720px){.cols{grid-template-columns:1fr}}
@media (prefers-color-scheme:dark){body{background:#0b0f14;color:#e5e7eb}.tile,.card{background:#111820;border-color:#1f2937}.tile .value{color:#8fd3ff}.funnel li,.bars li{color:#cbd5e1;border-color:#1f2937}.rec{border-color:#1f2937}}
`;

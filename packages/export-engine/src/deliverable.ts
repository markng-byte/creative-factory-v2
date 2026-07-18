/**
 * Viewable deliverables.
 *
 * `assembleCampaignPage` composes the finished piece: a self-contained HTML page that lays the
 * *actual generated* key-frames and animated clips out scene-by-scene, in narrative order — the
 * payoff you open in a browser. It reads only the Creative IR's approved delivered assets and is
 * deterministic. `buildManifestJson` renders the machine-readable manifest.
 */

import type { CreativeIR } from '@creative-factory/creative-ir';
import { escapeHtml } from './support.js';
import type { ExportManifest } from './types.js';

interface ShotAssets {
  imageUrl?: string;
  videoUrl?: string;
}

export function assembleCampaignPage(creativeIR: CreativeIR): string {
  const byShot = indexApprovedByShot(creativeIR);
  const title = escapeHtml(creativeIR.creativeContext.briefTitle);
  const theme = escapeHtml(creativeIR.creativeContext.narrativeTheme);
  const cta = escapeHtml(creativeIR.creativeContext.callToAction);

  const sections = creativeIR.stories
    .flatMap((story) => story.storyboards.flatMap((sb) => sb.scenes))
    .map((scene) => {
      const shots = scene.shots
        .map((shot) => {
          const assets = byShot.get(String(shot.id)) ?? {};
          const media = assets.videoUrl ?? assets.imageUrl;
          if (!media) {
            return '';
          }
          return `<figure class="shot">
        <img src="${media}" alt="${escapeHtml(String(shot.id))}" loading="lazy" />
        <figcaption>${escapeHtml(shot.description)}</figcaption>
      </figure>`;
        })
        .filter((markup) => markup.length > 0)
        .join('\n');
      const emotion = escapeHtml(scene.objectives?.emotion ?? '');
      return `<section class="scene">
      <div class="scene-head"><h2>${escapeHtml(scene.title)}</h2>${emotion ? `<span class="badge">${emotion}</span>` : ''}</div>
      <p class="narration">${escapeHtml(scene.narrativeText)}</p>
      <div class="shots">${shots}</div>
    </section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} — Final Delivery</title>
<style>${STYLES}</style></head>
<body>
<header><p class="kicker">Final Delivery · assembled from approved, catalogued assets</p><h1>${title}</h1><p class="theme">${theme}</p></header>
<main>${sections}</main>
<footer><p class="cta">${cta}</p><p class="meta">Creative IR ${escapeHtml(String(creativeIR.id))} · v${escapeHtml(creativeIR.version)} · animated clips play in-browser</p></footer>
</body></html>`;
}

export function buildManifestJson(manifest: ExportManifest): string {
  return JSON.stringify(manifest, null, 2);
}

function indexApprovedByShot(creativeIR: CreativeIR): Map<string, ShotAssets> {
  const byShot = new Map<string, ShotAssets>();
  for (const request of creativeIR.assetRequests) {
    if (request.qaStatus !== 'approved' || request.deliveredAssets.length === 0) {
      continue;
    }
    const shotId = String(request.shotId);
    const entry = byShot.get(shotId) ?? {};
    const url = request.deliveredAssets[0]?.url;
    if (url) {
      if (request.assetType === 'video') {
        entry.videoUrl = url;
      } else if (request.assetType === 'image') {
        entry.imageUrl = url;
      }
    }
    byShot.set(shotId, entry);
  }
  return byShot;
}

const STYLES = `
:root{color-scheme:light dark}
*{box-sizing:border-box}
body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;line-height:1.5;color:#0b0f14;background:#f7f8fa}
header{padding:2.5rem 2rem;background:linear-gradient(135deg,#0B2E4F,#1FB6A6);color:#fff}
.kicker{margin:0 0 .5rem;text-transform:uppercase;letter-spacing:.08em;font-size:.72rem;opacity:.85}
header h1{margin:0 0 .25rem;font-size:2rem}
.theme{opacity:.9;margin:0;max-width:46rem}
main{max-width:1100px;margin:0 auto;padding:2rem}
.scene{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:1.25rem 1.5rem;margin:1.25rem 0;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.scene-head{display:flex;align-items:center;gap:.6rem}
.scene-head h2{margin:0;font-size:1.15rem}
.badge{font-size:.72rem;background:#F5A62322;color:#8a5a00;border-radius:999px;padding:.15rem .6rem}
.narration{color:#6b7280;font-style:italic;margin:.35rem 0 1rem}
.shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem}
.shot{margin:0;border:1px solid #eef2f7;border-radius:10px;overflow:hidden;background:#fff}
.shot img{display:block;width:100%;height:auto;background:#0B2E4F}
.shot figcaption{padding:.55rem .7rem;font-size:.78rem;color:#374151}
footer{max-width:1100px;margin:0 auto;padding:2rem;color:#6b7280}
.cta{font-size:1.1rem;font-weight:600;color:#0B2E4F}
.meta{font-family:monospace;font-size:.78rem;color:#9ca3af}
@media (prefers-color-scheme:dark){body{background:#0b0f14;color:#e5e7eb}.scene{background:#111820;border-color:#1f2937}.shot{background:#0b0f14;border-color:#1f2937}.shot figcaption{color:#cbd5e1}.narration{color:#9ca3af}.cta{color:#8fd3ff}}
`;

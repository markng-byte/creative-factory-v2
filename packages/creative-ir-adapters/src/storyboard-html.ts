/**
 * Storyboard HTML Adapter.
 *
 * Renders a human-readable HTML storyboard — the review artifact stakeholders read. Self-contained
 * (inline CSS), deterministic, and driven entirely by the Creative IR.
 */

import type {
  AdapterCapability,
  AdapterOptions,
  CreativeIR,
  Scene,
  Shot,
  StoryboardHTMLAdapter,
} from '@creative-factory/creative-ir';
import { BaseAdapter, type BuildResult } from './base.js';
import { durationToSeconds, escapeHtml } from './support.js';

export class StandardStoryboardHTMLAdapter
  extends BaseAdapter
  implements StoryboardHTMLAdapter
{
  readonly name = 'storyboard-html' as const;
  readonly version = '1.0.0';
  readonly supportedOutputFormats = ['html'];
  readonly capabilities: AdapterCapability[] = [
    { feature: 'human-readable-review', level: 'required' },
    { feature: 'self-contained', level: 'required' },
  ];

  protected build(creativeIR: CreativeIR, _options: AdapterOptions): BuildResult {
    const title = escapeHtml(creativeIR.creativeContext.briefTitle);
    const sections = creativeIR.stories
      .map((story) => this.renderStory(story.title, story.storyboards.flatMap((sb) => sb.scenes)))
      .join('\n');

    const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${title} — Storyboard</title>
<style>${STYLES}</style></head>
<body>
<header><h1>${title}</h1><p class="theme">${escapeHtml(creativeIR.creativeContext.narrativeTheme)}</p></header>
${sections}
<footer>Generated deterministically from Creative IR ${escapeHtml(String(creativeIR.id))} · v${escapeHtml(creativeIR.version)}</footer>
</body></html>`;

    return {
      artifacts: [this.artifact('storyboard.html', 'html', html, 'text/html')],
      warnings: [],
      transformRules: ['story-sections', 'scene-cards', 'shot-rows'],
    };
  }

  private renderStory(storyTitle: string, scenes: Scene[]): string {
    const cards = scenes.map((scene) => this.renderScene(scene)).join('\n');
    return `<section class="story"><h2>${escapeHtml(storyTitle)}</h2>${cards}</section>`;
  }

  private renderScene(scene: Scene): string {
    const emotion = escapeHtml(scene.objectives?.emotion ?? '');
    const purpose = escapeHtml(scene.objectives?.purpose ?? scene.description ?? '');
    const shots = scene.shots.map((shot) => this.renderShot(shot)).join('\n');
    return `<article class="scene">
  <div class="scene-head">
    <h3>${escapeHtml(scene.title)}</h3>
    <span class="badge">${durationToSeconds(scene.duration)}s</span>
    ${emotion ? `<span class="badge emotion">${emotion}</span>` : ''}
  </div>
  <p class="purpose">${purpose}</p>
  <p class="narration">${escapeHtml(scene.narrativeText)}</p>
  <div class="shots">${shots}</div>
</article>`;
  }

  private renderShot(shot: Shot): string {
    const visual = shot.visualSpec;
    const subject = visual.foregroundElements.find((element) => element.type === 'subject');
    return `<div class="shot">
    <div class="frame"><span>${escapeHtml(visual.shotType)}</span></div>
    <dl>
      <dt>Camera</dt><dd>${escapeHtml(visual.camera.movement)} · ${escapeHtml(visual.camera.lens.type)}</dd>
      <dt>Subject</dt><dd>${escapeHtml(subject?.description ?? shot.description)}</dd>
      <dt>Duration</dt><dd>${durationToSeconds(shot.duration)}s</dd>
    </dl>
  </div>`;
  }
}

const STYLES = `
:root{color-scheme:light dark}
*{box-sizing:border-box}
body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;line-height:1.5;color:#111;background:#fafafa}
header{padding:2rem;background:#0B2E4F;color:#fff}
header h1{margin:0 0 .25rem}
.theme{opacity:.85;margin:0}
.story{padding:1.5rem 2rem}
.story h2{border-bottom:2px solid #1FB6A6;padding-bottom:.35rem}
.scene{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:1rem 1.25rem;margin:1rem 0;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.scene-head{display:flex;align-items:center;gap:.6rem}
.scene-head h3{margin:0;flex:0 0 auto}
.badge{font-size:.72rem;background:#eef2f7;border-radius:999px;padding:.15rem .6rem;color:#0B2E4F}
.badge.emotion{background:#F5A62322;color:#8a5a00}
.purpose{color:#374151;margin:.4rem 0 .2rem}
.narration{color:#6b7280;font-style:italic;margin:.2rem 0 .8rem}
.shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem}
.shot{border:1px solid #eee;border-radius:10px;overflow:hidden;background:#fff}
.frame{aspect-ratio:16/9;background:linear-gradient(135deg,#0B2E4F,#1FB6A6);display:flex;align-items:center;justify-content:center;color:#fff;text-transform:uppercase;letter-spacing:.05em;font-size:.8rem}
.shot dl{display:grid;grid-template-columns:auto 1fr;gap:.15rem .5rem;margin:0;padding:.6rem .75rem;font-size:.8rem}
.shot dt{color:#9ca3af}
.shot dd{margin:0;color:#111}
footer{padding:1.5rem 2rem;color:#9ca3af;font-size:.8rem}
@media (prefers-color-scheme:dark){body{background:#0b0f14;color:#e5e7eb}.scene{background:#111820;border-color:#1f2937}.shot{background:#0b0f14;border-color:#1f2937}.shot dd{color:#e5e7eb}.purpose{color:#cbd5e1}}
`;

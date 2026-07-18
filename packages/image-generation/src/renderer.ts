/**
 * Deterministic branded SVG renderer.
 *
 * "Generates" an image for an image `PromptRequest` by composing a small, viewable SVG from the
 * brand palette and a seed derived from the prompt. It is a pure function — same request in, same
 * bytes out — and touches no network, so the whole pipeline stays hermetic. A real diffusion
 * provider replaces this behind the same dispatch seam without changing anything downstream.
 */

import type { PromptRequest } from '@creative-factory/prompt-translation';

export interface RenderedImage {
  readonly format: 'svg';
  readonly svg: string;
  /** `data:image/svg+xml;base64,…` — self-contained and viewable. */
  readonly dataUri: string;
  readonly width: number;
  readonly height: number;
  readonly fileSize: number;
  readonly seed: number;
  readonly model: string;
}

export const RENDER_MODEL = 'svg-synth-v1' as const;

export function renderImage(request: PromptRequest): RenderedImage {
  const width = numberParam(request.parameters['width'], 1920);
  const height = numberParam(request.parameters['height'], 1080);
  const seed = numberParam(request.parameters['seed'], 0);

  const primary = request.brandControls['primaryColor'] ?? '#111111';
  const accent = request.brandControls['accentColor'] ?? primary;
  const brand = request.brandControls['brandName'] ?? 'Brand';

  // Deterministic composition driven entirely by the seed.
  const cx = seed % width;
  const cy = Math.floor(seed / 7) % height;
  const r = Math.max(48, seed % Math.floor(Math.min(width, height) / 3) || 96);
  const label = escapeXml(shortLabel(request));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(brand)} synthetic frame">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${escapeXml(primary)}"/>
      <stop offset="1" stop-color="${escapeXml(accent)}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${escapeXml(accent)}" fill-opacity="0.35"/>
  <text x="${Math.round(width / 2)}" y="${Math.round(height / 2)}" fill="#ffffff" font-family="sans-serif" font-size="${Math.round(height / 18)}" text-anchor="middle" dominant-baseline="middle">${escapeXml(brand)}</text>
  <text x="24" y="${height - 60}" fill="#ffffff" fill-opacity="0.85" font-family="monospace" font-size="${Math.round(height / 36)}">${label}</text>
  <text x="24" y="${height - 24}" fill="#ffffff" fill-opacity="0.6" font-family="monospace" font-size="${Math.round(height / 44)}">SYNTHETIC · seed ${seed}</text>
</svg>`;

  const base64 = Buffer.from(svg, 'utf8').toString('base64');
  return {
    format: 'svg',
    svg,
    dataUri: `data:image/svg+xml;base64,${base64}`,
    width,
    height,
    fileSize: Buffer.byteLength(svg, 'utf8'),
    seed,
    model: RENDER_MODEL,
  };
}

function shortLabel(request: PromptRequest): string {
  const shot = request.shotId ?? 'shot';
  return `${shot} · ${request.target}`;
}

function numberParam(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

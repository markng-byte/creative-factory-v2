/**
 * Deterministic animated-SVG video renderer.
 *
 * "Generates" a video for a video `PromptRequest` by composing a self-contained SVG whose SMIL
 * animation is driven by the shot's camera movement, easing, and duration. It genuinely moves in
 * a browser, yet is a pure function — same request in, same bytes out — and touches no network.
 * A real video-generation API replaces it behind the same dispatch seam.
 */

import type { PromptRequest } from '@creative-factory/prompt-translation';

export interface RenderedVideo {
  readonly format: 'svg';
  readonly svg: string;
  /** `data:image/svg+xml;base64,…` — a self-contained, animated, viewable clip. */
  readonly dataUri: string;
  readonly width: number;
  readonly height: number;
  readonly fileSize: number;
  readonly seed: number;
  readonly durationSeconds: number;
  readonly frameRate: number;
  readonly cameraMovement: string;
  readonly model: string;
}

export const RENDER_MODEL = 'smil-video-synth-v1' as const;

export function renderVideo(request: PromptRequest): RenderedVideo {
  const width = numberParam(request.parameters['width'], 1920);
  const height = numberParam(request.parameters['height'], 1080);
  const seed = numberParam(request.parameters['seed'], 0);
  const frameRate = numberParam(request.parameters['frameRate'], 30);
  const durationFrames = numberParam(request.parameters['durationFrames'], frameRate);
  const durationSeconds = round(durationFrames / (frameRate > 0 ? frameRate : 30), 3);
  const movement = String(request.parameters['cameraMovement'] ?? 'static');
  const motionStrength = numberParam(request.parameters['motionStrength'], 0.5);

  const primary = request.brandControls['primaryColor'] ?? '#111111';
  const accent = request.brandControls['accentColor'] ?? primary;
  const brand = request.brandControls['brandName'] ?? 'Brand';
  const label = escapeXml(`${request.shotId ?? 'shot'} · ${movement}`);
  const dur = `${durationSeconds}s`;

  const cx = seed % width;
  const cy = Math.floor(seed / 7) % height;
  const r = Math.max(48, seed % Math.floor(Math.min(width, height) / 3) || 96);
  const cameraAnim = cameraAnimation(movement, motionStrength, dur, width, height);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(brand)} synthetic clip">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${escapeXml(primary)}"/>
      <stop offset="1" stop-color="${escapeXml(accent)}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <g>
    ${cameraAnim}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${escapeXml(accent)}" fill-opacity="0.35">
      <animate attributeName="fill-opacity" values="0.2;0.5;0.2" dur="${dur}" repeatCount="indefinite"/>
    </circle>
    <text x="${Math.round(width / 2)}" y="${Math.round(height / 2)}" fill="#ffffff" font-family="sans-serif" font-size="${Math.round(height / 18)}" text-anchor="middle" dominant-baseline="middle">${escapeXml(brand)}</text>
  </g>
  <text x="24" y="${height - 60}" fill="#ffffff" fill-opacity="0.85" font-family="monospace" font-size="${Math.round(height / 36)}">${label}</text>
  <text x="24" y="${height - 24}" fill="#ffffff" fill-opacity="0.6" font-family="monospace" font-size="${Math.round(height / 44)}">SYNTHETIC · ${durationSeconds}s @ ${frameRate}fps · seed ${seed}</text>
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
    durationSeconds,
    frameRate,
    cameraMovement: movement,
    model: RENDER_MODEL,
  };
}

/** A SMIL transform animation on the scene group, chosen by camera movement. */
function cameraAnimation(
  movement: string,
  strength: number,
  dur: string,
  width: number,
  height: number,
): string {
  const shift = Math.round(Math.min(width, height) * 0.08 * strength);
  const loop = 'repeatCount="indefinite"';
  switch (movement) {
    case 'dolly':
      return `<animateTransform attributeName="transform" type="scale" values="1;${(1 + 0.1 * strength).toFixed(3)};1" dur="${dur}" ${loop} additive="sum"/>`;
    case 'tracking':
      return `<animateTransform attributeName="transform" type="translate" values="0 0;${shift} 0;0 0" dur="${dur}" ${loop} additive="sum"/>`;
    case 'crane':
      return `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${shift};0 0" dur="${dur}" ${loop} additive="sum"/>`;
    case 'orbit':
      return `<animateTransform attributeName="transform" type="rotate" values="0 ${width / 2} ${height / 2};${Math.round(6 * strength)} ${width / 2} ${height / 2};0 ${width / 2} ${height / 2}" dur="${dur}" ${loop} additive="sum"/>`;
    case 'pan':
      return `<animateTransform attributeName="transform" type="translate" values="0 0;${Math.round(shift / 2)} 0;0 0" dur="${dur}" ${loop} additive="sum"/>`;
    default:
      return `<animateTransform attributeName="transform" type="scale" values="1;${(1 + 0.02 * strength).toFixed(3)};1" dur="${dur}" ${loop} additive="sum"/>`;
  }
}

function numberParam(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

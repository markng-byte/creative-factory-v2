/** Small shared helpers for adapters. */

import type { Duration } from '@creative-factory/creative-ir';

/** Convert a Creative IR `Duration` to total seconds (frames included when present). */
export function durationToSeconds(duration: Duration): number {
  const base = duration.minutes * 60 + duration.seconds;
  if (duration.frames && duration.frameRate && duration.frameRate > 0) {
    return round(base + duration.frames / duration.frameRate);
  }
  return base;
}

/** Convert a `Duration` to a whole number of frames using its own frame rate (default 30). */
export function durationToFrames(duration: Duration): number {
  const frameRate = duration.frameRate && duration.frameRate > 0 ? duration.frameRate : 30;
  return (duration.minutes * 60 + duration.seconds) * frameRate + (duration.frames ?? 0);
}

/** Escape a string for safe inclusion in HTML text/attribute content. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function round(value: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

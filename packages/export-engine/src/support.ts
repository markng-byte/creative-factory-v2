/**
 * Deterministic support: stable hashing, injected clock/id ports, HTML/aspect helpers. No wall
 * clock or RNG, so an export package is byte-reproducible.
 */

import type { ISO8601Timestamp } from '@creative-factory/domain';

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export function fnv1a(input: string): string {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function contentHash(content: string): string {
  return `sha_${fnv1a(content)}`;
}

export interface Clock {
  now(): ISO8601Timestamp;
}

export class SystemClock implements Clock {
  now(): ISO8601Timestamp {
    return new Date().toISOString();
  }
}

export class FixedClock implements Clock {
  constructor(private readonly timestamp: ISO8601Timestamp = '2026-01-01T00:00:00.000Z') {}

  now(): ISO8601Timestamp {
    return this.timestamp;
  }
}

export interface IdGenerator {
  generate(namespace: string, ...parts: Array<string | number>): string;
}

export class DeterministicIdGenerator implements IdGenerator {
  constructor(private readonly seed: string = 'export') {}

  generate(namespace: string, ...parts: Array<string | number>): string {
    return `${namespace}_${fnv1a([this.seed, namespace, ...parts.map(String)].join(':'))}`;
  }
}

const ASPECT_BY_DIMENSIONS: Record<string, string> = {
  '1920x1080': '16:9',
  '1080x1920': '9:16',
  '1080x1080': '1:1',
  '1440x1080': '4:3',
  '2560x1080': '21:9',
};

export function aspectRatioOf(width: number, height: number): string {
  return ASPECT_BY_DIMENSIONS[`${width}x${height}`] ?? `${width}x${height}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

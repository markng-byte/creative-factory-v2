/**
 * Deterministic support: injected clock/id ports, stable hashing, HTML/number helpers. Analytics
 * is a pure read over the Creative IR and event stream — no wall clock or RNG — so reports and the
 * dashboard are byte-reproducible.
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
  constructor(private readonly seed: string = 'analytics') {}

  generate(namespace: string, ...parts: Array<string | number>): string {
    return `${namespace}_${fnv1a([this.seed, namespace, ...parts.map(String)].join(':'))}`;
  }
}

/** Ratio rounded to 4 decimals; 0 when the denominator is 0. */
export function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }
  return Math.round((numerator / denominator) * 10000) / 10000;
}

export function pct(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Deterministic support: stable content hashing plus injected clock and id ports. The content
 * hash is what makes the library content-addressed — identical bytes always hash to the same id,
 * which drives deduplication.
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

/** A stable content fingerprint used for content-addressing and dedup. */
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
  constructor(private readonly seed: string = 'lib') {}

  generate(namespace: string, ...parts: Array<string | number>): string {
    return `${namespace}_${fnv1a([this.seed, namespace, ...parts.map(String)].join(':'))}`;
  }
}

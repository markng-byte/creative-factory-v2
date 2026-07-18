/**
 * Deterministic support: injected clock and id ports, plus data-URI decoding for content
 * inspection. No wall-clock or RNG, so QA reports are byte-reproducible.
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
  constructor(private readonly seed: string = 'qa') {}

  generate(namespace: string, ...parts: Array<string | number>): string {
    return `${namespace}_${fnv1a([this.seed, namespace, ...parts.map(String)].join(':'))}`;
  }
}

/**
 * Decode an asset URL into inspectable text when it is a `data:` URI (as produced by the
 * synthetic generators). Returns undefined for opaque URLs (a real provider's remote asset),
 * in which case content-inspecting rules report as not-applicable rather than failing.
 */
export function decodeContent(url: string): string | undefined {
  if (!url.startsWith('data:')) {
    return undefined;
  }
  const comma = url.indexOf(',');
  if (comma === -1) {
    return undefined;
  }
  const meta = url.slice(5, comma);
  const data = url.slice(comma + 1);
  try {
    if (meta.includes(';base64')) {
      return Buffer.from(data, 'base64').toString('utf8');
    }
    return decodeURIComponent(data);
  } catch {
    return undefined;
  }
}

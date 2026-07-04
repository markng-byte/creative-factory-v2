/**
 * Clock port.
 *
 * The compiler never calls `Date.now()` directly; all timestamps flow through an injected
 * {@link Clock}. Production uses {@link SystemClock}; tests inject {@link FixedClock} to keep
 * compilation deterministic and reproducible.
 */

import type { ISO8601Timestamp } from '@creative-factory/domain';

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

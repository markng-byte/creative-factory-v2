/**
 * Engine ports for time and identity.
 *
 * Defined locally (rather than imported from the compiler package) so the review engine stays
 * dependency-light and the arrow between engines always points through canonical packages.
 * `SequentialIdGenerator` is deterministic given the same operation order — the property the
 * determinism tests assert.
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

export interface IdGenerator {
  generate(namespace: string): string;
}

export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly seed: string = 'rev') {}

  generate(namespace: string): string {
    this.counter += 1;
    return `${namespace}_${this.seed}_${String(this.counter).padStart(4, '0')}`;
  }
}

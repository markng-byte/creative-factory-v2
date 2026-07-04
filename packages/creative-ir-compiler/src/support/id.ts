/**
 * Identifier generation port.
 *
 * {@link DeterministicIdGenerator} derives ids from the content path (namespace + parts), so
 * the same logical element always receives the same id across compilations — a prerequisite
 * for byte-identical output. {@link RandomIdGenerator} is available where uniqueness matters
 * more than reproducibility.
 */

import { randomUUID } from 'node:crypto';
import { fnv1a } from './hash.js';

export interface IdGenerator {
  generate(namespace: string, ...parts: Array<string | number>): string;
}

export class DeterministicIdGenerator implements IdGenerator {
  constructor(private readonly seed: string = 'creative-factory') {}

  generate(namespace: string, ...parts: Array<string | number>): string {
    const key = [this.seed, namespace, ...parts.map(String)].join(':');
    return `${namespace}_${fnv1a(key)}`;
  }
}

export class RandomIdGenerator implements IdGenerator {
  generate(namespace: string): string {
    return `${namespace}_${randomUUID()}`;
  }
}

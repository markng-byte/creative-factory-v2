/**
 * Small pure helpers used across planning stages. These exist to satisfy
 * `noUncheckedIndexedAccess` cleanly and to keep stage code focused on intent.
 */

/** Cyclically pick from an array with a guaranteed fallback for empty arrays. */
export function pick<T>(items: readonly T[], index: number, fallback: T): T {
  if (items.length === 0) {
    return fallback;
  }
  const normalized = ((index % items.length) + items.length) % items.length;
  return items[normalized] as T;
}

/** First element or a fallback. */
export function first<T>(items: readonly T[], fallback: T): T {
  return items.length > 0 ? (items[0] as T) : fallback;
}

/** Return `value` when it is a non-blank string, otherwise `fallback`. */
export function nonBlankOr(value: string | undefined, fallback: string): string {
  return value !== undefined && value.trim().length > 0 ? value : fallback;
}

/** Clamp a number into an inclusive range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Round to a fixed number of decimals to keep serialized output stable. */
export function round(value: number, decimals = 4): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

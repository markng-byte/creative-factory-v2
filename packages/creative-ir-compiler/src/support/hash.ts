/**
 * Deterministic, dependency-free string hashing (FNV-1a, 32-bit).
 *
 * Used to derive stable identifiers and checksums during compilation so that identical
 * inputs always yield byte-identical Creative IR. This is not a cryptographic hash; it is
 * a fast, stable content fingerprint.
 */

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** Return an 8-character hex FNV-1a hash of the input string. */
export function fnv1a(input: string): string {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Hash an ordered list of parts into a single stable fingerprint. */
export function checksum(...parts: Array<string | number>): string {
  return fnv1a(parts.map(String).join('␟'));
}

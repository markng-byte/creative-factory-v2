import { describe, expect, it } from 'vitest';
import { err, ok } from './index.js';

describe('shared-kernel scaffold', () => {
  it('ok returns success result', () => {
    const result = ok(42);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it('err returns failure result', () => {
    const result = err('failed');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('failed');
    }
  });
});

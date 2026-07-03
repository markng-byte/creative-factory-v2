import { describe, it, expect } from 'vitest';

import { BRAND_ENGINE_PACKAGE, BRAND_ENGINE_VERSION } from '../index.js';

describe('Brand Engine Package', () => {
  it('should export package constants', () => {
    expect(BRAND_ENGINE_PACKAGE).toBe('@creative-factory/brand-engine');
    expect(BRAND_ENGINE_VERSION).toBe('1.0.0');
  });
});

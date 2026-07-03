import { describe, it, expect } from 'vitest';

import { BRAND_TOKENIZER_PACKAGE, BRAND_TOKENIZER_VERSION } from '../index.js';
import { BrandTokenGenerator } from '../tokenizer.js';

describe('Brand Tokenizer Package', () => {
  it('should export package constants', () => {
    expect(BRAND_TOKENIZER_PACKAGE).toBe('@creative-factory/brand-tokenizer');
    expect(BRAND_TOKENIZER_VERSION).toBe('1.0.0');
  });

  it('should generate tokens from brand profile', () => {
    const generator = new BrandTokenGenerator();

    // Create a minimal profile for testing
    const profile = {
      colorPalette: {
        primaryColors: [
          {
            id: 'color:1',
            name: 'Blue',
            hex: '#0066CC',
            rgb: { r: 0, g: 102, b: 204 },
            hsl: { h: 210, s: 100, l: 40 },
            hsv: { h: 210, s: 100, v: 80 },
            usage: 'Primary',
            contexts: ['web'],
            accessibility: { wcagAACompliant: true, wcagAAACompliant: true, contrastRatio: 7 },
          },
        ],
        secondaryColors: [],
        accentColors: [],
        neutrals: [],
        semanticColors: [],
        guidelines: [],
      },
      typography: { families: [], scales: [], weights: [], guidelines: [] },
      motionGuide: { duration: { normalAnimation: 300 } as any, easing: [], transitions: [], guidelines: [] },
    } as any;

    const tokens = generator.generate(profile);

    expect(tokens.colorTokens).toBeDefined();
    expect(tokens.colorTokens.length).toBeGreaterThan(0);
    expect(tokens.spacingTokens).toBeDefined();
    expect(tokens.animationTokens).toBeDefined();
  });
});

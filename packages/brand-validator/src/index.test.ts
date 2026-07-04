import { describe, it, expect } from 'vitest';

import { BRAND_VALIDATOR_PACKAGE, BRAND_VALIDATOR_VERSION } from './index.js';
import { StandardBrandValidator } from './validator.js';

describe('Brand Validator Package', () => {
  it('should export package constants', () => {
    expect(BRAND_VALIDATOR_PACKAGE).toBe('@creative-factory/brand-validator');
    expect(BRAND_VALIDATOR_VERSION).toBe('1.0.0');
  });

  it('should validate brand profiles', () => {
    const validator = new StandardBrandValidator();

    const profile = {
      id: 'profile:1' as any,
      brandId: 'brand:1' as any,
      name: 'Test Brand',
      version: '1.0.0',
      description: '',
      status: 'valid' as const,
      colorPalette: {
        primaryColors: [
          {
            id: 'color:1',
            name: 'Primary Blue',
            hex: '#0066CC',
            rgb: { r: 0, g: 102, b: 204 },
            hsl: { h: 210, s: 100, l: 40 },
            hsv: { h: 210, s: 100, v: 80 },
            usage: 'Primary branding',
            contexts: ['web', 'print'],
            accessibility: { wcagAACompliant: true, wcagAAACompliant: true, contrastRatio: 7.5 },
          },
        ],
        secondaryColors: [],
        accentColors: [],
        neutrals: [],
        semanticColors: [],
        guidelines: [],
      },
      typography: { families: [], scales: [], weights: [], guidelines: [] },
      logoSystem: { variations: [], guidelines: [], spacing: {} as any, colorRules: [] },
      iconSystem: {
        name: '',
        description: '',
        gridSize: 24,
        strokeWidth: 2,
        icons: [],
        guidelines: [],
        sets: [],
      },
      illustrationGuide: {
        style: '',
        characteristics: [],
        colorUsage: '',
        examples: [],
        guidelines: [],
        prohibited: [],
      },
      photographyGuide: {
        style: '',
        characteristics: [],
        lighting: '',
        composition: '',
        colorTreatment: '',
        examples: [],
        guidelines: [],
        prohibited: [],
      },
      motionGuide: { duration: {} as any, easing: [], transitions: [], guidelines: [] },
      voiceAndTone: {
        personality: [],
        traits: [],
        toneInContext: {},
        guidelines: [],
        prohibitedTerms: [],
        approvedTerms: [],
        examples: [],
      },
      rules: [],
      tokens: {
        colorTokens: [],
        typographyTokens: [],
        spacingTokens: [],
        animationTokens: [],
        shadowTokens: [],
        componentTokens: [],
      },
      templates: [],
      metadata: {
        organization: '',
        owner: '',
        contact: '',
        lastReviewDate: '',
        nextReviewDate: '',
        changeLog: [],
        tags: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = validator.validateProfile(profile);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

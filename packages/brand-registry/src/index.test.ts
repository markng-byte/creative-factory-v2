import { describe, it, expect } from 'vitest';

import { BRAND_REGISTRY_PACKAGE, BRAND_REGISTRY_VERSION } from '../index.js';
import { MemoryBrandRegistry } from '../registry.js';

describe('Brand Registry Package', () => {
  it('should export package constants', () => {
    expect(BRAND_REGISTRY_PACKAGE).toBe('@creative-factory/brand-registry');
    expect(BRAND_REGISTRY_VERSION).toBe('1.0.0');
  });

  it('should store and retrieve brand profiles', async () => {
    const registry = new MemoryBrandRegistry();

    const profile = {
      id: 'profile:1' as any,
      brandId: 'brand:1' as any,
      name: 'Test Brand',
      version: '1.0.0',
      description: '',
      status: 'valid' as const,
      colorPalette: {
        primaryColors: [],
        secondaryColors: [],
        accentColors: [],
        neutrals: [],
        semanticColors: [],
        guidelines: [],
      },
      typography: { families: [], scales: [], weights: [], guidelines: [] },
      logoSystem: { variations: [], guidelines: [], spacing: {} as any, colorRules: [] },
      iconSystem: { name: '', description: '', gridSize: 24, strokeWidth: 2, icons: [], guidelines: [], sets: [] },
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

    await registry.store(profile);

    const retrieved = await registry.get('profile:1' as any);
    expect(retrieved).toEqual(profile);

    const exists = await registry.exists('profile:1' as any);
    expect(exists).toBe(true);
  });
});

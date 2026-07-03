import { describe, it, expect } from 'vitest';

import type { CreativeIR } from '../index.js';
import { CREATIVE_IR_PACKAGE, CREATIVE_IR_VERSION } from '../index.js';

describe('Creative IR Package', () => {
  it('should export package constants', () => {
    expect(CREATIVE_IR_PACKAGE).toBe('@creative-factory/creative-ir');
    expect(CREATIVE_IR_VERSION).toBe('1.0.0');
  });

  it('should define proper structure for Creative IR', () => {
    const exampleIR: CreativeIR = {
      version: '1.0.0',
      id: 'creative-ir:example-001' as any,
      createdAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
      revisionHistory: [],
      campaign: {
        id: 'campaign:001',
        name: 'Example Campaign',
        description: 'Test campaign',
        objective: 'Increase awareness',
        targetAudience: {
          demographics: [{ age: { min: 18, max: 35 } }],
          psychographics: [],
          mediaPreferences: [],
          geographies: [],
        },
        duration: { minutes: 0, seconds: 30 },
        aspectRatios: ['16:9'],
        languages: ['en'],
        marketRegions: ['US'],
        lifecycleState: 'DRAFT',
        approvalState: 'pending',
        createdBy: 'user:001' as any,
        updatedBy: 'user:001' as any,
      },
      creativeContext: {
        briefId: 'brief:001',
        briefTitle: 'Brand Campaign',
        briefObjective: 'Launch new product',
        creativeDirection: 'Modern and dynamic',
        moodAndTone: {
          primary: 'energetic',
          secondary: [],
          avoided: [],
        },
        visualStyle: {
          cinematography: 'handheld',
          colorPalette: ['#FF0000', '#00FF00'],
          lighting: 'natural',
          composition: 'rule-of-thirds',
          references: [],
        },
        narrativeTheme: 'Product launch',
        keyMessages: ['Innovation', 'Quality'],
        callToAction: 'Learn more',
        brandGuidelines: {
          logoUsage: 'Top right corner',
          colorRules: [],
          typographyRules: [],
          voiceAndTone: {
            personality: [],
            toneInContext: {},
            doNotUse: [],
          },
          prohibitedElements: [],
        },
        constraints: [],
      },
      stories: [],
      brandTokens: {
        brandId: 'brand:001',
        brandName: 'Example Brand',
        primaryColors: [],
        secondaryColors: [],
        accentColors: [],
        typography: [],
        logoVariations: [],
        imageryGuidelines: [],
        voiceAndTone: {
          personality: [],
          toneInContext: {},
          doNotUse: [],
        },
        prohibitedElements: [],
        brandPersonality: {
          primaryTraits: [],
          secondaryTraits: [],
          communicationStyle: '',
          valuePropositions: [],
        },
      },
      designTokens: {
        spacing: [],
        sizing: [],
        shadows: [],
        borders: [],
        animations: [],
        breakpoints: [],
      },
      assetRequests: [],
      reviews: [],
      exports: [],
      validationStatus: {
        isValid: true,
        errors: [],
        warnings: [],
        lastValidatedAt: new Date().toISOString() as any,
      },
      compilerMetadata: {
        compileVersion: '1.0.0',
        compileTimestamp: new Date().toISOString() as any,
        sourceComponents: [],
        compileRules: [],
        adapterMetadata: {},
        diagnostics: [],
      },
    };

    expect(exampleIR).toBeDefined();
    expect(exampleIR.version).toBe('1.0.0');
    expect(exampleIR.campaign.name).toBe('Example Campaign');
  });
});

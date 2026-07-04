import { describe, expect, it } from 'vitest';
import type { CreativeIR } from './types.js';
import { ValidationMode } from './validation.js';
import { StandardCreativeIRValidator } from './validator.js';

const fixedNow = () => '2026-01-01T00:00:00.000Z';

/** A structurally minimal-but-broken document for exercising the rule families. */
function brokenIR(): CreativeIR {
  return {
    version: '1.0.0',
    id: 'cir_test' as CreativeIR['id'],
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z', // earlier than createdAt -> temporal error
    revisionHistory: [],
    campaign: {
      id: 'c1',
      name: 'x',
      description: 'x',
      objective: 'x',
      targetAudience: {
        demographics: [],
        psychographics: [],
        mediaPreferences: [],
        geographies: [],
      },
      duration: { minutes: 0, seconds: 10 },
      aspectRatios: ['16:9'],
      languages: ['en'],
      marketRegions: ['US'],
      lifecycleState: 'DRAFT',
      approvalState: 'pending',
      createdBy: 'u1' as CreativeIR['campaign']['createdBy'],
      updatedBy: 'u1' as CreativeIR['campaign']['updatedBy'],
    },
    creativeContext: {
      briefId: 'b1',
      briefTitle: 't',
      briefObjective: 'o',
      creativeDirection: 'd',
      moodAndTone: { primary: 'confident', secondary: [], avoided: [] },
      visualStyle: {
        cinematography: 'x',
        colorPalette: [],
        lighting: 'x',
        composition: 'x',
        references: [],
      },
      narrativeTheme: 'x',
      keyMessages: [],
      callToAction: 'x',
      brandGuidelines: {
        logoUsage: 'x',
        colorRules: [],
        typographyRules: [],
        voiceAndTone: { personality: [], toneInContext: {}, doNotUse: [] },
        prohibitedElements: [],
      },
      constraints: [],
    },
    stories: [], // empty -> structural error
    brandTokens: {
      brandId: 'brand',
      brandName: 'Brand',
      primaryColors: [],
      secondaryColors: [],
      accentColors: [],
      typography: [],
      logoVariations: [],
      imageryGuidelines: [],
      voiceAndTone: { personality: [], toneInContext: {}, doNotUse: [] },
      prohibitedElements: [],
      brandPersonality: {
        primaryTraits: [],
        secondaryTraits: [],
        communicationStyle: 'x',
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
    validationStatus: { isValid: true, errors: [], warnings: [], lastValidatedAt: fixedNow() },
    compilerMetadata: {
      compileVersion: '1.0.0',
      compileTimestamp: fixedNow(),
      sourceComponents: [],
      compileRules: [],
      adapterMetadata: {},
      diagnostics: [],
    },
  };
}

describe('StandardCreativeIRValidator', () => {
  const validator = new StandardCreativeIRValidator(fixedNow);

  it('flags an empty story list as a critical structural error', () => {
    const status = validator.validate(brokenIR(), ValidationMode.STRICT);
    expect(status.isValid).toBe(false);
    expect(status.errors.map((error) => error.code)).toContain('STORIES_EMPTY');
  });

  it('flags temporal inconsistency in strict mode', () => {
    const status = validator.validate(brokenIR(), ValidationMode.STRICT);
    expect(status.errors.map((error) => error.code)).toContain('TEMPORAL_CONSISTENCY');
  });

  it('demotes semantic failures to warnings in permissive mode', () => {
    const status = validator.validate(brokenIR(), ValidationMode.PERMISSIVE);
    expect(status.warnings.map((warning) => warning.code)).toContain('TEMPORAL_CONSISTENCY');
  });

  it('is deterministic under a fixed clock', () => {
    expect(validator.validate(brokenIR())).toEqual(validator.validate(brokenIR()));
  });
});

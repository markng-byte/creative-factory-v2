/**
 * Creative Context builder.
 *
 * Assembles the Creative IR `CreativeContext` and `BrandGuidelines` from the Creative Brief and
 * Brand Tokens. This is where "marketing constraints" from the brief are normalized onto the
 * canonical `Constraint` model — the compiler introduces no new constraint concept.
 */

import type { CreativeBrief, CreativeConstraintType } from '@creative-factory/domain';
import type {
  BrandGuidelines,
  ColorRule,
  Constraint,
  CreativeContext,
  Reference,
  TypographyRule,
} from '@creative-factory/creative-ir';
import type { NarrativeBlueprint } from '../model.js';
import type { BrandTokensBundle } from '../ports.js';
import { first } from '../support/util.js';

const CONSTRAINT_TYPE: Record<CreativeConstraintType, Constraint['type']> = {
  technical: 'technical',
  legal: 'legal',
  brand: 'brand',
  creative: 'creative',
  resource: 'resource',
  budget: 'resource',
  timeline: 'resource',
  compliance: 'legal',
  accessibility: 'technical',
  cultural: 'creative',
};

export function buildBrandGuidelines(brand: BrandTokensBundle): BrandGuidelines {
  const tokens = brand.brandTokens;

  const colorRules: ColorRule[] = tokens.primaryColors.map((token) => ({
    color: token.hex,
    usage: token.usage,
    context: token.context,
  }));

  const typographyRules: TypographyRule[] = tokens.typography.map((token) => ({
    fontFamily: token.fontFamily,
    fontWeight: token.fontWeight,
    fontSize: token.fontSize,
    usage: token.usage,
  }));

  return {
    logoUsage: first(
      tokens.logoVariations.map((logo) => logo.clearanceRules),
      'Maintain clear space and approved logo variations',
    ),
    colorRules,
    typographyRules,
    voiceAndTone: {
      personality: tokens.voiceAndTone.personality,
      toneInContext: tokens.voiceAndTone.toneInContext,
      doNotUse: tokens.voiceAndTone.doNotUse,
    },
    prohibitedElements: tokens.prohibitedElements.map((element) => element.description),
  };
}

export function buildCreativeContext(
  brief: CreativeBrief,
  brand: BrandTokensBundle,
  narrative: NarrativeBlueprint,
): CreativeContext {
  const palette = [
    ...brand.brandTokens.primaryColors,
    ...brand.brandTokens.secondaryColors,
    ...brand.brandTokens.accentColors,
  ].map((token) => token.hex);

  const references: Reference[] = brief.visualDirection.visualReferences.map((reference) => ({
    title: reference.title,
    url: reference.url,
    creator: reference.source,
    description: reference.description,
  }));

  const constraints: Constraint[] = brief.creativeConstraints.map((constraint) => ({
    type: CONSTRAINT_TYPE[constraint.type],
    description: `${constraint.description} (${constraint.rationale})`,
    impact: constraint.impact,
  }));

  return {
    briefId: brief.id,
    briefTitle: brief.campaignContext.name,
    briefObjective: brief.campaignContext.goal,
    creativeDirection: brief.visualDirection.visualConcept,
    moodAndTone: {
      primary: narrative.moodPrimary,
      secondary: [...narrative.moodSecondary],
      avoided: [...narrative.moodAvoided],
    },
    visualStyle: {
      cinematography: brief.visualDirection.aestheticStyle,
      colorPalette: palette,
      lighting: `${narrative.moodPrimary} key with brand-accent fill`,
      composition: 'Rule-of-thirds driven, brand-forward framing',
      references,
    },
    narrativeTheme: narrative.theme,
    keyMessages: [...narrative.keyMessages],
    callToAction: narrative.callToAction,
    brandGuidelines: buildBrandGuidelines(brand),
    competitiveContext: brief.campaignContext.competitiveContext,
    constraints,
  };
}

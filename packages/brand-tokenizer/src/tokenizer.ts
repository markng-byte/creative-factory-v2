/**
 * Brand Tokenizer
 *
 * Converts brand profiles into design tokens for Creative IR.
 */

import type {
  BrandProfile,
  BrandProfileTokens,
  ColorToken as DomainColorToken,
} from '@creative-factory/domain';

export interface TokenGenerator {
  generate(profile: BrandProfile): BrandProfileTokens;
}

export class BrandTokenGenerator implements TokenGenerator {
  generate(profile: BrandProfile): BrandProfileTokens {
    return {
      colorTokens: this.generateColorTokens(profile),
      typographyTokens: this.generateTypographyTokens(profile),
      spacingTokens: this.generateSpacingTokens(profile),
      animationTokens: this.generateAnimationTokens(profile),
      shadowTokens: this.generateShadowTokens(profile),
      componentTokens: this.generateComponentTokens(profile),
    };
  }

  private generateColorTokens(profile: BrandProfile): DomainColorToken[] {
    const tokens: DomainColorToken[] = [];
    let id = 0;

    // Primary colors
    for (const color of profile.colorPalette?.primaryColors || []) {
      tokens.push({
        id: `color-token-${id++}`,
        name: `primary-${color.name.toLowerCase().replace(/\s+/g, '-')}`,
        value: color.hex,
        category: 'primary',
        description: color.usage,
        usage: color.contexts,
      });
    }

    // Secondary colors
    for (const color of profile.colorPalette?.secondaryColors || []) {
      tokens.push({
        id: `color-token-${id++}`,
        name: `secondary-${color.name.toLowerCase().replace(/\s+/g, '-')}`,
        value: color.hex,
        category: 'secondary',
        description: color.usage,
        usage: color.contexts,
      });
    }

    // Accent colors
    for (const color of profile.colorPalette?.accentColors || []) {
      tokens.push({
        id: `color-token-${id++}`,
        name: `accent-${color.name.toLowerCase().replace(/\s+/g, '-')}`,
        value: color.hex,
        category: 'accent',
        description: color.usage,
        usage: color.contexts,
      });
    }

    return tokens;
  }

  private generateTypographyTokens(profile: BrandProfile) {
    const tokens = [];
    let id = 0;

    for (const family of profile.typography?.families || []) {
      for (const scale of profile.typography?.scales || []) {
        for (const step of scale.steps) {
          tokens.push({
            id: `typo-token-${id++}`,
            name: `${family.name.toLowerCase()}-${step.level}`,
            fontFamily: family.name,
            fontSize: step.fontSize,
            fontWeight: step.fontWeight,
            lineHeight: step.lineHeight,
            letterSpacing: step.letterSpacing,
            category: scale.name,
            usage: [step.usage],
          });
        }
      }
    }

    return tokens;
  }

  private generateSpacingTokens(_profile: BrandProfile) {
    // Generate default spacing scale if not present
    const spacingScale = [4, 8, 12, 16, 24, 32, 48, 64, 80, 96];
    return spacingScale.map((value, idx) => ({
      id: `spacing-token-${idx}`,
      name: `spacing-${value}`,
      value,
      unit: 'px',
      category: 'spacing',
      usage: ['margins', 'padding', 'gaps'],
    }));
  }

  private generateAnimationTokens(profile: BrandProfile) {
    const tokens = [];
    let id = 0;

    for (const easing of profile.motionGuide?.easing || []) {
      tokens.push({
        id: `animation-token-${id++}`,
        name: easing.name.toLowerCase().replace(/\s+/g, '-'),
        duration: profile.motionGuide?.duration?.normalAnimation || 300,
        easing: easing.curve,
        category: 'animation',
        usage: [easing.usage],
      });
    }

    return tokens;
  }

  private generateShadowTokens(_profile: BrandProfile) {
    // Generate default shadow system
    return [
      {
        id: 'shadow-token-0',
        name: 'shadow-sm',
        value: '0 1px 2px rgba(0, 0, 0, 0.05)',
        category: 'shadow',
        usage: ['subtle'],
      },
      {
        id: 'shadow-token-1',
        name: 'shadow-md',
        value: '0 4px 6px rgba(0, 0, 0, 0.1)',
        category: 'shadow',
        usage: ['medium'],
      },
      {
        id: 'shadow-token-2',
        name: 'shadow-lg',
        value: '0 10px 15px rgba(0, 0, 0, 0.1)',
        category: 'shadow',
        usage: ['prominent'],
      },
    ];
  }

  private generateComponentTokens(profile: BrandProfile) {
    // Generate component-level tokens combining colors, typography, spacing
    return [
      {
        id: 'component-token-0',
        name: 'button-primary',
        tokens: {
          backgroundColor: profile.colorPalette?.primaryColors?.[0]?.hex || '#0066CC',
          textColor: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '4px',
          fontSize: '14px',
        },
        category: 'button',
        usage: ['interactive'],
      },
    ];
  }
}

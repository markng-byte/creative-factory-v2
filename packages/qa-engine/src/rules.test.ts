import { describe, expect, it } from 'vitest';
import type { CreativeIR } from '@creative-factory/creative-ir';
import { prohibitedAbsentRule } from './rules.js';
import type { QaRuleContext } from './types.js';

const context = (content: string): QaRuleContext =>
  ({
    creativeIR: {
      brandTokens: { brandName: 'Offshore Company Corp (One IBC)' },
    } as unknown as CreativeIR,
    request: { assetType: 'image' },
    output: {},
    content,
    brandHexes: [],
    prohibitedTerms: ['offshore', 'no tax'],
  }) as unknown as QaRuleContext;

describe('prohibitedAbsentRule', () => {
  it("exempts the brand's own name but still catches the banned word elsewhere", () => {
    expect(
      prohibitedAbsentRule.evaluate(context('<text>Offshore Company Corp (One IBC)</text>'))
        ?.passed,
    ).toBe(true);
    const bad = prohibitedAbsentRule.evaluate(
      context('<text>Offshore Company Corp (One IBC): go offshore, no tax</text>'),
    );
    expect(bad?.passed).toBe(false);
    expect(bad?.message).toBe('Prohibited elements present: offshore, no tax');
  });
});

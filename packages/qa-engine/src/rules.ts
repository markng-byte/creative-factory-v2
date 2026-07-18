/**
 * Default QA rules.
 *
 * Each rule is pure and independently testable, and inspects the *actual* generated content when
 * it can (the synthetic assets are data-URI SVGs, so brand colors and prohibited terms are really
 * verifiable). Visual-only rules report not-applicable for non-visual assets. Register additional
 * rules to extend coverage without changing the engine.
 */

import type { QaFinding, QaRule, QaRuleContext } from './types.js';

const VISUAL_TYPES = new Set(['image', 'video', 'animation']);

function finding(rule: QaRule, passed: boolean, message: string): QaFinding {
  return { ruleId: rule.id, severity: rule.severity, passed, message };
}

/** The asset must actually carry content (a resolvable URL). */
export const contentIntegrityRule: QaRule = {
  id: 'content-integrity',
  severity: 'critical',
  evaluate(context: QaRuleContext): QaFinding {
    const hasUrl = context.output.url.trim().length > 0;
    return finding(this, hasUrl, hasUrl ? 'Asset has resolvable content' : 'Asset URL is empty');
  },
};

/** Output dimensions must match the request specification. */
export const dimensionMatchRule: QaRule = {
  id: 'dimension-match',
  severity: 'major',
  evaluate(context: QaRuleContext): QaFinding | undefined {
    if (!VISUAL_TYPES.has(context.request.assetType)) {
      return undefined;
    }
    const spec = context.request.specifications.dimensions;
    const meta = context.output.metadata;
    const ok = meta.width === spec.width && meta.height === spec.height;
    return finding(
      this,
      ok,
      ok
        ? `Dimensions ${meta.width}×${meta.height} match spec`
        : `Dimensions ${meta.width}×${meta.height} do not match spec ${spec.width}×${spec.height}`,
    );
  },
};

/** The rendered content must use at least one brand color. */
export const brandPaletteRule: QaRule = {
  id: 'brand-palette',
  severity: 'major',
  evaluate(context: QaRuleContext): QaFinding | undefined {
    if (!VISUAL_TYPES.has(context.request.assetType) || context.content === undefined) {
      return undefined;
    }
    const haystack = context.content.toLowerCase();
    const present = context.brandHexes.some((hex) => haystack.includes(hex.toLowerCase()));
    return finding(
      this,
      present,
      present ? 'Brand palette present in asset' : 'No brand color found in asset',
    );
  },
};

/** The rendered content must not include any prohibited element. */
export const prohibitedAbsentRule: QaRule = {
  id: 'prohibited-absent',
  severity: 'major',
  evaluate(context: QaRuleContext): QaFinding | undefined {
    if (!VISUAL_TYPES.has(context.request.assetType) || context.content === undefined) {
      return undefined;
    }
    const haystack = context.content.toLowerCase();
    const violations = context.prohibitedTerms.filter(
      (term) => term.trim().length > 0 && haystack.includes(term.toLowerCase()),
    );
    const ok = violations.length === 0;
    return finding(
      this,
      ok,
      ok
        ? 'No prohibited elements present'
        : `Prohibited elements present: ${violations.join(', ')}`,
    );
  },
};

export const DEFAULT_QA_RULES: readonly QaRule[] = [
  contentIntegrityRule,
  dimensionMatchRule,
  brandPaletteRule,
  prohibitedAbsentRule,
];

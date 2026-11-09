/**
 * Tier 4 of the One IBC diagnosis (Growth Workspace spec section 8): rejection reasons that repeat in
 * the sales team's feedback are pushed back to step 1 so lines 2 to 3 of the copy filter the audience.
 * Growth sends the codes (its catalogue `rejection-reason-codes.md`); each known code becomes one
 * advisory creative constraint on the Creative IR. Unknown codes are ignored.
 */
import type { Constraint } from '@creative-factory/creative-ir';

export const REJECTION_FILTERS: Readonly<Record<string, string>> = {
  PRICE_TOO_HIGH: 'Lines 2 to 3: state the all-in package price and what it includes.',
  PRICE_COMPARING: 'Lines 2 to 3: show what the fee covers compared with typical hidden fees.',
  NO_NEED_NOW: 'Lines 2 to 3: add a timing filter that says who needs this now.',
  NO_NEED: 'Lines 2 to 3: name the audience precisely so people without the need opt out.',
  EXPECTATION_MISMATCH:
    'Lines 2 to 3: set expectations; bank or EMI approval is neither guaranteed nor instant.',
  SCOPE_ADVISORY_DEPTH:
    'Lines 2 to 3: clarify the package scope (incorporation and compliance support, not bespoke advisory).',
  RESTRICTED_INDUSTRY:
    'Lines 2 to 3: add an industry filter; Forex, markets and financial brokerage are not accepted.',
  BANK_DECLINED: "Lines 2 to 3: say that account approval depends on the bank's own review.",
};

export function rejectionConstraints(codes: readonly string[]): Constraint[] {
  return [...new Set(codes)]
    .filter((c) => Object.hasOwn(REJECTION_FILTERS, c))
    .map((c) => ({ type: 'creative', description: REJECTION_FILTERS[c]!, impact: 'advisory' }));
}

/**
 * QA model.
 *
 * A `QaRule` inspects one delivered asset (in the context of its request and the Creative IR) and
 * returns a `QaFinding`, or `undefined` when the rule does not apply. The engine folds findings
 * into an `AssetQaResult` (approved / rejected) and an overall `QaReport`
 * (PASS / FAIL / NEEDS_REVIEW). Everything here is plain serializable data.
 */

import type { AssetOutput, AssetRequest, CreativeIR } from '@creative-factory/creative-ir';

export type QaSeverity = 'critical' | 'major' | 'minor';

export type QaOverall = 'PASS' | 'FAIL' | 'NEEDS_REVIEW';

export type AssetQaStatus = 'approved' | 'rejected';

export interface QaFinding {
  readonly ruleId: string;
  readonly severity: QaSeverity;
  readonly passed: boolean;
  readonly message: string;
}

export interface AssetQaResult {
  readonly assetRequestId: string;
  readonly assetOutputId: string;
  readonly assetType: string;
  readonly status: AssetQaStatus;
  readonly findings: readonly QaFinding[];
}

export interface QaReport {
  readonly reportId: string;
  readonly creativeIRId: string;
  readonly campaignId: string;
  readonly generatedAt: string;
  readonly overall: QaOverall;
  readonly assessed: number;
  readonly passed: number;
  readonly failed: number;
  /** Requests with no delivered assets yet (e.g. audio, not generated) — not judged. */
  readonly skipped: number;
  readonly assets: readonly AssetQaResult[];
}

/** Everything a rule needs to judge a single delivered asset. */
export interface QaRuleContext {
  readonly creativeIR: CreativeIR;
  readonly request: AssetRequest;
  readonly output: AssetOutput;
  /** Decoded asset text when the URL is a data URI, else undefined. */
  readonly content: string | undefined;
  readonly brandHexes: readonly string[];
  readonly prohibitedTerms: readonly string[];
}

export interface QaRule {
  readonly id: string;
  readonly severity: QaSeverity;
  /** Return a finding, or undefined when the rule does not apply to this asset. */
  evaluate(context: QaRuleContext): QaFinding | undefined;
}

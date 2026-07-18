/**
 * Standard QA & Brand Compliance Engine.
 *
 * Runs a pluggable rule set over every generated asset in a Creative IR — inspecting the actual
 * rendered content — and folds the findings into per-asset verdicts and an overall report. It then
 * writes each `AssetRequest.qaStatus` back into the Creative IR, emits a `qa.completed` contract
 * event, and (when QA passes) recommends the `complete_generation` workflow transition, validated
 * by the deterministic state machine. Like the review engine, it returns an outcome rather than
 * forcing a transition.
 *
 * Deterministic: no wall clock or RNG; identical input yields a byte-identical report, updated IR,
 * and event.
 */

import type { AssetOutput, AssetRequest, CreativeIR } from '@creative-factory/creative-ir';
import type { CampaignLifecycleState } from '@creative-factory/domain';
import type { QACompletedContract } from '@creative-factory/contracts';
import { evaluateTransition, type TransitionAccepted } from '@creative-factory/workflow-engine';
import { DEFAULT_QA_RULES } from './rules.js';
import {
  DeterministicIdGenerator,
  SystemClock,
  decodeContent,
  type Clock,
  type IdGenerator,
} from './support.js';
import type { AssetQaResult, QaFinding, QaOverall, QaReport, QaRule } from './types.js';

export const QA_ENGINE_VERSION = '1.0.0' as const;

export interface QaEngineDependencies {
  readonly rules?: readonly QaRule[];
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
}

export interface QaRunOptions {
  /** Campaign lifecycle state, used to validate the recommended transition. */
  readonly lifecycleState?: CampaignLifecycleState;
}

export interface QaOutcome {
  readonly creativeIR: CreativeIR;
  readonly report: QaReport;
  readonly events: readonly QACompletedContract[];
  /** The state-machine move QA recommends when it passes, if one is valid from the current state. */
  readonly recommendedTransition?: TransitionAccepted;
  readonly transitionUnavailable?: string;
}

export class StandardQaEngine {
  private readonly rules: readonly QaRule[];
  private readonly clock: Clock;
  private readonly ids: IdGenerator;

  constructor(deps: QaEngineDependencies = {}) {
    this.rules = deps.rules ?? DEFAULT_QA_RULES;
    this.clock = deps.clock ?? new SystemClock();
    this.ids = deps.ids ?? new DeterministicIdGenerator();
  }

  run(creativeIR: CreativeIR, options: QaRunOptions = {}): QaOutcome {
    const brandHexes = collectBrandHexes(creativeIR);
    const prohibitedTerms = collectProhibited(creativeIR);
    const generatedAt = this.clock.now();

    const results: AssetQaResult[] = [];
    const statusByRequest = new Map<string, 'approved' | 'rejected'>();
    let skipped = 0;

    for (const request of creativeIR.assetRequests) {
      if (request.deliveredAssets.length === 0) {
        skipped += 1;
        continue;
      }
      let requestApproved = true;
      for (const output of request.deliveredAssets) {
        const result = this.assess(creativeIR, request, output, brandHexes, prohibitedTerms);
        results.push(result);
        if (result.status === 'rejected') {
          requestApproved = false;
        }
      }
      statusByRequest.set(String(request.id), requestApproved ? 'approved' : 'rejected');
    }

    const failed = results.filter((result) => result.status === 'rejected').length;
    const passed = results.length - failed;
    const overall = deriveOverall(results);

    const reportId = this.ids.generate('qareport', String(creativeIR.id));
    const report: QaReport = {
      reportId,
      creativeIRId: String(creativeIR.id),
      campaignId: creativeIR.campaign.id,
      generatedAt,
      overall,
      assessed: results.length,
      passed,
      failed,
      skipped,
      assets: results,
    };

    const event: QACompletedContract = {
      id: this.ids.generate('evt', reportId),
      name: 'qa.completed',
      version: 1,
      occurredAt: generatedAt,
      aggregateId: creativeIR.campaign.id,
      correlationId: reportId,
      payload: { campaignId: creativeIR.campaign.id, reportId, status: overall },
    };

    const { recommendedTransition, transitionUnavailable } = this.recommendTransition(
      overall,
      options.lifecycleState ?? 'ASSET_GENERATION_RUNNING',
    );

    return {
      creativeIR: writeBack(creativeIR, statusByRequest, generatedAt),
      report,
      events: [event],
      recommendedTransition,
      transitionUnavailable,
    };
  }

  private assess(
    creativeIR: CreativeIR,
    request: AssetRequest,
    output: AssetOutput,
    brandHexes: readonly string[],
    prohibitedTerms: readonly string[],
  ): AssetQaResult {
    const content = decodeContent(output.url);
    const findings: QaFinding[] = [];
    for (const rule of this.rules) {
      const finding = rule.evaluate({
        creativeIR,
        request,
        output,
        content,
        brandHexes,
        prohibitedTerms,
      });
      if (finding) {
        findings.push(finding);
      }
    }
    const rejected = findings.some((finding) => !finding.passed && finding.severity !== 'minor');
    return {
      assetRequestId: String(request.id),
      assetOutputId: output.id,
      assetType: request.assetType,
      status: rejected ? 'rejected' : 'approved',
      findings,
    };
  }

  private recommendTransition(
    overall: QaOverall,
    lifecycleState: CampaignLifecycleState,
  ): { recommendedTransition?: TransitionAccepted; transitionUnavailable?: string } {
    if (overall === 'FAIL') {
      return { transitionUnavailable: 'QA failed; assets require regeneration before review' };
    }
    const evaluated = evaluateTransition({
      from: lifecycleState,
      transition: 'complete_generation',
    });
    if (evaluated.ok) {
      return { recommendedTransition: evaluated.value };
    }
    return { transitionUnavailable: evaluated.error.message };
  }
}

function writeBack(
  creativeIR: CreativeIR,
  statusByRequest: ReadonlyMap<string, 'approved' | 'rejected'>,
  updatedAt: string,
): CreativeIR {
  if (statusByRequest.size === 0) {
    return creativeIR;
  }
  const assetRequests: AssetRequest[] = creativeIR.assetRequests.map((request) => {
    const status = statusByRequest.get(String(request.id));
    return status ? { ...request, qaStatus: status } : request;
  });
  return { ...creativeIR, assetRequests, updatedAt };
}

function deriveOverall(results: readonly AssetQaResult[]): QaOverall {
  if (results.some((result) => result.status === 'rejected')) {
    return 'FAIL';
  }
  const hasMinorIssue = results.some((result) =>
    result.findings.some((finding) => !finding.passed),
  );
  return hasMinorIssue ? 'NEEDS_REVIEW' : 'PASS';
}

function collectBrandHexes(creativeIR: CreativeIR): string[] {
  const tokens = creativeIR.brandTokens;
  return [...tokens.primaryColors, ...tokens.secondaryColors, ...tokens.accentColors].map(
    (token) => token.hex,
  );
}

function collectProhibited(creativeIR: CreativeIR): string[] {
  const fromGuidelines = creativeIR.creativeContext.brandGuidelines.prohibitedElements;
  const fromTokens = creativeIR.brandTokens.prohibitedElements.map(
    (element) => element.description,
  );
  return [...new Set([...fromGuidelines, ...fromTokens])].sort();
}

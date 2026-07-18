import { beforeAll, describe, expect, it } from 'vitest';
import { ValidationMode, type CreativeIR } from '@creative-factory/creative-ir';
import { createUserId } from '@creative-factory/domain';
import {
  DeterministicIdGenerator,
  FixedClock as CompilerFixedClock,
  InMemoryBrandTokensSource,
  InMemoryCampaignSource,
  InMemoryCreativeBriefSource,
  StandardCreativeIRCompiler,
  exampleBrandBundle,
  exampleCampaign,
  exampleCreativeBrief,
} from '@creative-factory/creative-ir-compiler';
import { StandardReviewEngine } from './engine.js';
import { FixedClock, SequentialIdGenerator } from './support.js';
import type { CommentAnchor, ReviewCycleId } from './types.js';

const CREATIVE = createUserId('creative-lead');
const BRAND = createUserId('brand-guardian');

function makeCompiler(): StandardCreativeIRCompiler {
  const brand = exampleBrandBundle();
  return new StandardCreativeIRCompiler({
    briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: new InMemoryCampaignSource([exampleCampaign()]),
    brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    clock: new CompilerFixedClock('2026-07-01T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('review-test'),
  });
}

async function compileIR(
  reviewFeedback?: Parameters<StandardCreativeIRCompiler['compile']>[0]['reviewFeedback'],
): Promise<CreativeIR> {
  const { creativeIR } = await makeCompiler().compile({
    creativeBriefId: 'brief-northwind-001',
    brandId: 'brand-northwind',
    campaignId: 'campaign-northwind-q3',
    validationMode: ValidationMode.STRICT,
    reviewFeedback: reviewFeedback ? [...reviewFeedback] : undefined,
  });
  return creativeIR;
}

function makeEngine(): StandardReviewEngine {
  return new StandardReviewEngine({
    clock: new FixedClock('2026-07-02T09:00:00.000Z'),
    ids: new SequentialIdGenerator('t'),
  });
}

function firstSceneId(ir: CreativeIR): string {
  return String(ir.stories[0]?.storyboards[0]?.scenes[0]?.id);
}

describe('StandardReviewEngine', () => {
  let ir: CreativeIR;

  beforeAll(async () => {
    ir = await compileIR();
  });

  it('refuses to open a cycle when the campaign is not at the matching gate', () => {
    const result = makeEngine().openCycle({
      campaignId: 'campaign-northwind-q3',
      creativeIR: ir,
      targetKind: 'storyboard',
      lifecycleState: 'DRAFT',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('WRONG_LIFECYCLE_STATE');
    }
  });

  it('validates comment anchors against the reviewed document', () => {
    const engine = makeEngine();
    const opened = engine.openCycle({
      campaignId: 'campaign-northwind-q3',
      creativeIR: ir,
      targetKind: 'storyboard',
      lifecycleState: 'STORYBOARD_REVIEW',
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const bad = engine.addComment({
      cycleId: opened.value.id,
      author: CREATIVE,
      text: 'Comment on nothing',
      anchor: { kind: 'scene', targetId: 'scene_does_not_exist' },
    });
    expect(bad.ok).toBe(false);

    const good = engine.addComment({
      cycleId: opened.value.id,
      author: CREATIVE,
      text: 'Open on the product, not the empty room',
      anchor: { kind: 'scene', targetId: firstSceneId(ir) },
      severity: 'blocking',
      suggestedChange: 'Lead with the dashboard hero shot',
    });
    expect(good.ok).toBe(true);
  });

  it('closes the full changes-requested loop: review → feedback → recompile revision', async () => {
    const engine = makeEngine();
    const opened = engine.openCycle({
      campaignId: 'campaign-northwind-q3',
      creativeIR: ir,
      targetKind: 'storyboard',
      lifecycleState: 'STORYBOARD_REVIEW',
    });
    if (!opened.ok) throw new Error('cycle should open');
    const cycleId = opened.value.id;

    const anchor: CommentAnchor = { kind: 'scene', targetId: firstSceneId(ir) };
    engine.addComment({
      cycleId,
      author: CREATIVE,
      text: 'The opening scene buries the product',
      anchor,
      severity: 'blocking',
      suggestedChange: 'Open on the narrative view',
    });

    const decided = engine.recordDecision({
      cycleId,
      reviewer: CREATIVE,
      verdict: 'request-changes',
      comment: 'Fix the opening before brand review',
    });
    expect(decided.ok).toBe(true);
    if (!decided.ok || !decided.value.outcome) throw new Error('outcome expected');

    const outcome = decided.value.outcome;
    expect(outcome.cycle.state).toBe('changes-requested');
    expect(outcome.workflowTransition?.transition).toBe('request_storyboard_changes');
    expect(outcome.workflowTransition?.to).toBe('STORYBOARD_DRAFT');
    expect(outcome.events.map((event) => event.name)).toEqual([
      'review.completed',
      'campaign.lifecycle.transitioned',
    ]);
    expect(outcome.feedback).toHaveLength(1);
    expect(outcome.feedback[0]?.priority).toBe(1); // blocking
    expect(outcome.structuredFeedback[0]?.anchor).toEqual(anchor);
    expect(outcome.irReview.decision).toBe('rejected');

    // Recompile with the feedback: the document records the loop in its revision history.
    const recompiled = await compileIR(outcome.feedback);
    const lastRevision = recompiled.revisionHistory[recompiled.revisionHistory.length - 1];
    expect(recompiled.revisionHistory).toHaveLength(2);
    expect(lastRevision?.changeDescription).toContain(String(outcome.cycle.id));
  });

  it('walks the multi-level chain to approval and drives the gate transition', () => {
    const engine = makeEngine();
    const opened = engine.openCycle({
      campaignId: 'campaign-northwind-q3',
      creativeIR: ir,
      targetKind: 'storyboard',
      lifecycleState: 'STORYBOARD_REVIEW',
    });
    if (!opened.ok) throw new Error('cycle should open');
    const cycleId = opened.value.id;

    const first = engine.recordDecision({ cycleId, reviewer: CREATIVE, verdict: 'approve' });
    expect(first.ok && first.value.outcome).toBeFalsy(); // level 1 of 2: still open
    if (!first.ok) throw new Error('decision should record');
    expect(first.value.cycle.currentLevel).toBe(2);

    const second = engine.recordDecision({
      cycleId,
      reviewer: BRAND,
      verdict: 'approve-with-changes',
      comment: 'Approved; tighten logo clearance in the end card',
    });
    if (!second.ok || !second.value.outcome) throw new Error('outcome expected');

    const outcome = second.value.outcome;
    expect(outcome.cycle.state).toBe('approved');
    expect(outcome.workflowTransition?.transition).toBe('approve_storyboard');
    expect(outcome.workflowTransition?.to).toBe('PROMPT_READY');
    expect(outcome.irReview.decision).toBe('approved-with-changes');
    expect(outcome.feedback).toHaveLength(0); // approval produces no recompile feedback
  });

  it('rejects a duplicate decision from the same reviewer at the same level', () => {
    const engine = makeEngine();
    const opened = engine.openCycle({
      campaignId: 'campaign-northwind-q3',
      creativeIR: ir,
      targetKind: 'assets',
      lifecycleState: 'ASSET_REVIEW',
      policy: {
        targetKind: 'assets',
        escalation: 'advance-to-next-level',
        steps: [
          { level: 1, approvalType: 'creative', description: 'Dual sign-off', minApprovals: 2 },
        ],
      },
    });
    if (!opened.ok) throw new Error('cycle should open');

    const cycleId = opened.value.id;
    // Quorum is 2, so the first approval keeps the cycle at level 1...
    const first = engine.recordDecision({ cycleId, reviewer: CREATIVE, verdict: 'approve' });
    expect(first.ok && first.value.cycle.state).toBe('open');
    // ...and the same reviewer cannot vote a second time at that level.
    const repeat = engine.recordDecision({ cycleId, reviewer: CREATIVE, verdict: 'approve' });
    expect(repeat.ok).toBe(false);
    if (!repeat.ok) {
      expect(repeat.error.code).toBe('DUPLICATE_REVIEWER');
    }
    // A different reviewer completes the quorum.
    const second = engine.recordDecision({ cycleId, reviewer: BRAND, verdict: 'approve' });
    expect(second.ok && second.value.outcome?.cycle.state).toBe('approved');
  });

  it('reports no transition for changes requested at the final gate', () => {
    const engine = makeEngine();
    const opened = engine.openCycle({
      campaignId: 'campaign-northwind-q3',
      creativeIR: ir,
      targetKind: 'final',
      lifecycleState: 'FINAL_APPROVAL',
    });
    if (!opened.ok) throw new Error('cycle should open');

    const decided = engine.recordDecision({
      cycleId: opened.value.id,
      reviewer: BRAND,
      verdict: 'request-changes',
    });
    if (!decided.ok || !decided.value.outcome) throw new Error('outcome expected');

    expect(decided.value.outcome.workflowTransition).toBeUndefined();
    expect(decided.value.outcome.transitionUnavailable).toContain('final');
    // review.completed still fires; no lifecycle event.
    expect(decided.value.outcome.events.map((event) => event.name)).toEqual(['review.completed']);
  });

  it('is deterministic: identical operation sequences yield identical cycles and events', () => {
    const run = () => {
      const engine = makeEngine();
      const opened = engine.openCycle({
        campaignId: 'campaign-northwind-q3',
        creativeIR: ir,
        targetKind: 'storyboard',
        lifecycleState: 'STORYBOARD_REVIEW',
      });
      if (!opened.ok) throw new Error('cycle should open');
      engine.addComment({
        cycleId: opened.value.id,
        author: CREATIVE,
        text: 'Same comment',
        anchor: { kind: 'scene', targetId: firstSceneId(ir) },
        severity: 'major',
      });
      const decided = engine.recordDecision({
        cycleId: opened.value.id,
        reviewer: CREATIVE,
        verdict: 'request-changes',
      });
      if (!decided.ok || !decided.value.outcome) throw new Error('outcome expected');
      return decided.value.outcome;
    };

    expect(JSON.stringify(run())).toBe(JSON.stringify(run()));
  });

  it('lists cycles through the registry facade', () => {
    const engine = makeEngine();
    const opened = engine.openCycle({
      campaignId: 'campaign-northwind-q3',
      creativeIR: ir,
      targetKind: 'strategy',
      lifecycleState: 'STRATEGY_REVIEW',
    });
    if (!opened.ok) throw new Error('cycle should open');
    expect(engine.getCycle(opened.value.id as ReviewCycleId)?.targetKind).toBe('strategy');
  });
});

import { describe, expect, it } from 'vitest';
import { DEFAULT_APPROVAL_POLICIES, evaluateChain, validatePolicy } from './policy.js';
import type { ApprovalPolicy, RecordedDecision, ReviewVerdict } from './types.js';

function decision(verdict: ReviewVerdict, level: number, reviewer = 'r'): RecordedDecision {
  return {
    id: `d-${level}-${verdict}-${reviewer}` as RecordedDecision['id'],
    reviewer: reviewer as RecordedDecision['reviewer'],
    level,
    verdict,
    timestamp: '2026-01-01T00:00:00.000Z',
  };
}

const twoLevel: ApprovalPolicy = DEFAULT_APPROVAL_POLICIES.storyboard;

describe('validatePolicy', () => {
  it('accepts every default policy', () => {
    for (const policy of Object.values(DEFAULT_APPROVAL_POLICIES)) {
      expect(validatePolicy(policy).ok).toBe(true);
    }
  });

  it('rejects an empty chain', () => {
    const result = validatePolicy({ ...twoLevel, steps: [] });
    expect(result.ok).toBe(false);
  });

  it('rejects non-contiguous levels', () => {
    const result = validatePolicy({
      ...twoLevel,
      steps: [
        { level: 1, approvalType: 'creative', description: 'x', minApprovals: 1 },
        { level: 3, approvalType: 'brand', description: 'x', minApprovals: 1 },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a zero-approval quorum', () => {
    const result = validatePolicy({
      ...twoLevel,
      steps: [{ level: 1, approvalType: 'creative', description: 'x', minApprovals: 0 }],
    });
    expect(result.ok).toBe(false);
  });
});

describe('evaluateChain', () => {
  it('advances level by level and approves at the end of the chain', () => {
    const afterFirst = evaluateChain(twoLevel, [decision('approve', 1)]);
    expect(afterFirst).toEqual({ state: 'open', currentLevel: 2 });

    const afterSecond = evaluateChain(twoLevel, [
      decision('approve', 1),
      decision('approve', 2, 'brand-reviewer'),
    ]);
    expect(afterSecond).toEqual({ state: 'approved', currentLevel: 2 });
  });

  it('holds a step open until its quorum is met', () => {
    const quorumTwo: ApprovalPolicy = {
      targetKind: 'assets',
      escalation: 'advance-to-next-level',
      steps: [{ level: 1, approvalType: 'creative', description: 'x', minApprovals: 2 }],
    };
    expect(evaluateChain(quorumTwo, [decision('approve', 1, 'a')])).toEqual({
      state: 'open',
      currentLevel: 1,
    });
    expect(
      evaluateChain(quorumTwo, [decision('approve', 1, 'a'), decision('approve', 1, 'b')]),
    ).toEqual({ state: 'approved', currentLevel: 1 });
  });

  it('closes as changes-requested immediately at any level', () => {
    expect(evaluateChain(twoLevel, [decision('request-changes', 1)])).toEqual({
      state: 'changes-requested',
      currentLevel: 1,
    });
    expect(
      evaluateChain(twoLevel, [decision('approve', 1), decision('request-changes', 2)]),
    ).toEqual({ state: 'changes-requested', currentLevel: 2 });
  });

  it('closes as rejected on reject', () => {
    expect(evaluateChain(twoLevel, [decision('reject', 1)])).toEqual({
      state: 'rejected',
      currentLevel: 1,
    });
  });

  it('escalation jumps to the next level, or rejects at the top of the chain', () => {
    expect(evaluateChain(twoLevel, [decision('escalate', 1)])).toEqual({
      state: 'open',
      currentLevel: 2,
    });
    expect(evaluateChain(twoLevel, [decision('escalate', 1), decision('escalate', 2)])).toEqual({
      state: 'rejected',
      currentLevel: 2,
    });
  });

  it('escalation terminates immediately under a terminate policy', () => {
    expect(evaluateChain(DEFAULT_APPROVAL_POLICIES.final, [decision('escalate', 1)])).toEqual({
      state: 'rejected',
      currentLevel: 1,
    });
  });

  it('approve-with-changes counts toward quorum', () => {
    expect(
      evaluateChain(twoLevel, [
        decision('approve-with-changes', 1),
        decision('approve', 2, 'brand-reviewer'),
      ]),
    ).toEqual({ state: 'approved', currentLevel: 2 });
  });
});

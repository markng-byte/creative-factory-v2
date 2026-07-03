import { describe, expect, it } from 'vitest';
import {
  allowedTransitionsFrom,
  evaluateTransition,
  HUMAN_GATE_STATES,
  isHumanGateState,
} from './index.js';

describe('workflow engine', () => {
  it('accepts the first Sprint 2 lifecycle transition', () => {
    const result = evaluateTransition({
      from: 'DRAFT',
      transition: 'submit_brief',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.to).toBe('BRIEF_READY');
      expect(result.value.requiresHumanGate).toBe(false);
    }
  });

  it('rejects skipped transitions', () => {
    const result = evaluateTransition({
      from: 'DRAFT',
      transition: 'approve_storyboard',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
  });

  it('marks review and approval states as human gates', () => {
    expect(HUMAN_GATE_STATES).toEqual([
      'STRATEGY_REVIEW',
      'STORYBOARD_REVIEW',
      'ASSET_REVIEW',
      'FINAL_APPROVAL',
    ]);
    expect(isHumanGateState('STORYBOARD_REVIEW')).toBe(true);
    expect(isHumanGateState('PROMPT_READY')).toBe(false);
  });

  it('lists legal transitions from a state', () => {
    const transitions = allowedTransitionsFrom('STORYBOARD_REVIEW').map(
      (definition) => definition.transition,
    );

    expect(transitions).toEqual(['approve_storyboard', 'request_storyboard_changes', 'cancel']);
  });
});

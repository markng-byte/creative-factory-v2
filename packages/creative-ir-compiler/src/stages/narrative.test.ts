import { describe, expect, it } from 'vitest';
import { exampleCreativeBrief } from '../examples.js';
import { planNarrative } from './narrative.js';

describe('planNarrative', () => {
  const brief = exampleCreativeBrief();
  const narrative = planNarrative(brief);

  it('produces the canonical six-beat arc in order', () => {
    expect(narrative.beats.map((beat) => beat.kind)).toEqual([
      'setup',
      'inciting',
      'rising',
      'climax',
      'resolution',
      'call-to-action',
    ]);
  });

  it('assigns beat weights that sum to 1', () => {
    const total = narrative.beats.reduce((sum, beat) => sum + beat.weight, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it('routes the peak emotion to the climax beat', () => {
    const climax = narrative.beats.find((beat) => beat.kind === 'climax');
    expect(climax?.emotion).toBe('confident');
  });

  it('carries key messages and a call to action from the brief', () => {
    expect(narrative.keyMessages[0]).toBe('See the whole story your data is telling');
    expect(narrative.callToAction).toContain('trial');
  });

  it('is a pure function of its input', () => {
    expect(planNarrative(brief)).toEqual(narrative);
  });
});

import { describe, expect, it } from 'vitest';
import { planTiming, type TimingInput } from './timing.js';

const input: TimingInput = {
  frameRate: 30,
  totalSeconds: 30,
  stories: [
    {
      id: 'story-1',
      scenes: [
        { id: 'scene-a', weight: 0.5, shotIds: ['shot-a1', 'shot-a2'] },
        { id: 'scene-b', weight: 0.5, shotIds: ['shot-b1'] },
      ],
    },
  ],
};

describe('planTiming', () => {
  const plan = planTiming(input);

  it('allocates exactly the campaign total in frames', () => {
    expect(plan.totalFrames).toBe(900);
    const sceneSum = [...plan.sceneFrames.values()].reduce((a, b) => a + b, 0);
    expect(sceneSum).toBe(900);
  });

  it('splits scene frames across its shots without loss', () => {
    const sceneA = plan.sceneFrames.get('scene-a') ?? 0;
    const shotSum = (plan.shotFrames.get('shot-a1') ?? 0) + (plan.shotFrames.get('shot-a2') ?? 0);
    expect(shotSum).toBe(sceneA);
  });

  it('rolls scene frames up into the story total', () => {
    expect(plan.storyFrames.get('story-1')).toBe(900);
  });

  it('is deterministic', () => {
    expect(planTiming(input)).toEqual(plan);
  });
});

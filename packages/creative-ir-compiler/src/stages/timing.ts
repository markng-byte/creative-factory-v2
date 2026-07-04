/**
 * Timing Planner (Stage 8).
 *
 * Distributes the campaign's total duration across scenes (by dramatic weight) and across the
 * shots within each scene (evenly), in whole frames. The distribution is exact: rounding
 * remainders are absorbed by the final element so the per-element frames always sum back to the
 * campaign total. This makes the resulting timeline frame-accurate and deterministic.
 */

import type { TimingPlan } from '../model.js';

export interface TimingSceneInput {
  readonly id: string;
  readonly weight: number;
  readonly shotIds: readonly string[];
}

export interface TimingStoryInput {
  readonly id: string;
  readonly scenes: readonly TimingSceneInput[];
}

export interface TimingInput {
  readonly frameRate: number;
  readonly totalSeconds: number;
  readonly stories: readonly TimingStoryInput[];
}

export function planTiming(input: TimingInput): TimingPlan {
  const frameRate = input.frameRate > 0 ? input.frameRate : 30;
  const totalFrames = Math.max(1, Math.round(input.totalSeconds * frameRate));

  const scenes = input.stories.flatMap((story) => story.scenes);
  const weightTotal = scenes.reduce((sum, scene) => sum + scene.weight, 0) || 1;

  const sceneFrames = new Map<string, number>();
  const shotFrames = new Map<string, number>();
  const storyFrames = new Map<string, number>();

  // Distribute frames across scenes, giving the rounding remainder to the last scene.
  let allocated = 0;
  scenes.forEach((scene, index) => {
    const isLast = index === scenes.length - 1;
    const frames = isLast
      ? totalFrames - allocated
      : Math.round((scene.weight / weightTotal) * totalFrames);
    sceneFrames.set(scene.id, frames);
    allocated += frames;
    distributeShots(scene, frames, shotFrames);
  });

  for (const story of input.stories) {
    const frames = story.scenes.reduce((sum, scene) => sum + (sceneFrames.get(scene.id) ?? 0), 0);
    storyFrames.set(story.id, frames);
  }

  return { frameRate, totalFrames, sceneFrames, shotFrames, storyFrames };
}

function distributeShots(
  scene: TimingSceneInput,
  sceneFrameCount: number,
  shotFrames: Map<string, number>,
): void {
  const count = scene.shotIds.length;
  if (count === 0) {
    return;
  }
  const base = Math.floor(sceneFrameCount / count);
  let allocated = 0;
  scene.shotIds.forEach((shotId, index) => {
    const isLast = index === count - 1;
    const frames = isLast ? sceneFrameCount - allocated : base;
    shotFrames.set(shotId, frames);
    allocated += frames;
  });
}

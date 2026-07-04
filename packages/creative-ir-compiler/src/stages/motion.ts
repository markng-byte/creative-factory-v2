/**
 * Motion Planner (Stage 7).
 *
 * Produces the `MotionSpecification` for a shot: camera-motion keyframes derived from the
 * planned camera movement, plus a subtle subject motion. Times are normalized to 0..1 and
 * scaled to real frames later by the timing planner and downstream engines.
 */

import type {
  CameraMotionKeyframes,
  EasingFunction,
  MotionSpecification,
  ObjectMotion,
  Vector3D,
  VisualSpecification,
} from '@creative-factory/creative-ir';
import type { ShotDraft, StoryBeatKind } from '../model.js';
import { round } from '../support/util.js';

const EASING_BY_BEAT: Record<StoryBeatKind, EasingFunction> = {
  setup: 'ease-in-out',
  inciting: 'ease-in',
  rising: 'ease-in-out',
  climax: 'ease-out',
  resolution: 'ease-in-out',
  'call-to-action': 'linear',
};

export function planMotion(shot: ShotDraft, visual: VisualSpecification): MotionSpecification {
  const easing = EASING_BY_BEAT[shot.beatKind];
  const focalLength = parseFocalLength(visual.camera.lens.type);
  const focusDistance = round(1 + visual.camera.depth * 9);

  const [startOffset, endOffset] = cameraDisplacement(visual.camera.movement);

  const cameraMotion: CameraMotionKeyframes[] = [
    {
      time: 0,
      position: startOffset,
      rotation: { x: 0, y: 0, z: 0 },
      focalLength,
      focusDistance,
      easing,
    },
    {
      time: 1,
      position: endOffset,
      rotation: rotationForMovement(visual.camera.movement),
      focalLength: visual.camera.focus.type === 'shallow' ? round(focalLength * 1.1) : focalLength,
      focusDistance,
      easing,
    },
  ];

  const objectMotions: ObjectMotion[] = [
    {
      objectId: `${shot.id}-fg`,
      loop: false,
      keyframes: [
        {
          time: 0,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          easing,
        },
        {
          time: 1,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: shot.beatKind === 'climax' ? { x: 1.05, y: 1.05, z: 1 } : { x: 1, y: 1, z: 1 },
          easing,
        },
      ],
    },
  ];

  return {
    cameraMotion,
    objectMotions,
    particleEffects: [],
  };
}

function cameraDisplacement(movement: string): [Vector3D, Vector3D] {
  switch (movement) {
    case 'dolly':
      return [
        { x: 0, y: 0, z: -1 },
        { x: 0, y: 0, z: 0 },
      ];
    case 'tracking':
      return [
        { x: -1, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
      ];
    case 'crane':
      return [
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 1, z: 0 },
      ];
    case 'orbit':
      return [
        { x: -0.5, y: 0, z: -0.5 },
        { x: 0.5, y: 0, z: -0.5 },
      ];
    default:
      return [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
      ];
  }
}

function rotationForMovement(movement: string): { x: number; y: number; z: number } {
  switch (movement) {
    case 'pan':
      return { x: 0, y: 15, z: 0 };
    case 'tilt':
      return { x: 10, y: 0, z: 0 };
    case 'orbit':
      return { x: 0, y: 30, z: 0 };
    default:
      return { x: 0, y: 0, z: 0 };
  }
}

function parseFocalLength(lens: string): number {
  const match = lens.match(/(\d+)/);
  return match ? Number(match[1]) : 35;
}

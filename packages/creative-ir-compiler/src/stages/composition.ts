/**
 * Composition Planner (Stage 6).
 *
 * Produces the full `VisualSpecification` for a shot: shot type, camera configuration,
 * composition, lighting, and color grading. Brand color tokens drive the key-light color and
 * grading temperature so every frame is brand-consistent by construction.
 */

import type { CreativeBrief } from '@creative-factory/domain';
import type {
  CameraMovement,
  CompositionSpec,
  LightingSpec,
  ShotType,
  VisualElement,
  VisualSpecification,
} from '@creative-factory/creative-ir';
import type { ShotDraft, StoryBeatKind } from '../model.js';
import type { BrandTokensBundle } from '../ports.js';
import { clamp, first, pick } from '../support/util.js';

const SHOT_TYPE_BY_BEAT: Record<StoryBeatKind, ShotType> = {
  setup: 'wide',
  inciting: 'medium',
  rising: 'medium',
  climax: 'close-up',
  resolution: 'medium',
  'call-to-action': 'close-up',
};

const MOVEMENT_BY_BEAT: Record<StoryBeatKind, CameraMovement> = {
  setup: 'dolly',
  inciting: 'pan',
  rising: 'tracking',
  climax: 'orbit',
  resolution: 'crane',
  'call-to-action': 'static',
};

export function planComposition(
  shot: ShotDraft,
  brief: CreativeBrief,
  brand: BrandTokensBundle,
  emotionIntensity: number,
): VisualSpecification {
  const shotType: ShotType =
    shot.sequence === 0 && shot.beatKind !== 'call-to-action'
      ? widen(SHOT_TYPE_BY_BEAT[shot.beatKind])
      : SHOT_TYPE_BY_BEAT[shot.beatKind];

  const keyColor = first(
    brand.brandTokens.primaryColors.map((token) => token.hex),
    '#1A1A1A',
  );
  const accentColor = first(
    brand.brandTokens.accentColors.map((token) => token.hex),
    keyColor,
  );

  const composition: CompositionSpec = {
    rule: shot.beatKind === 'climax' ? 'center' : 'rule-of-thirds',
    subjectPlacement: shot.beatKind === 'climax' ? 'centered, dominant' : 'lower-left third',
    balanceType: shot.beatKind === 'call-to-action' ? 'symmetrical' : 'asymmetrical',
  };

  const lighting: LightingSpec = {
    type: shot.beatKind === 'climax' ? 'three-point' : 'sidelighting',
    keyLight: {
      intensity: clamp(0.6 + emotionIntensity * 0.03, 0, 1),
      color: keyColor,
      direction: '45deg camera-left',
      softness: shot.beatKind === 'climax' ? 0.3 : 0.6,
    },
    fillLight: {
      intensity: 0.4,
      color: accentColor,
      direction: 'camera-right',
      softness: 0.7,
    },
    shadows: shot.beatKind === 'climax' ? 'deep, directional' : 'soft, diffuse',
    mood: brief.visualDirection.colorMood,
  };

  const foregroundElements: VisualElement[] = [
    {
      id: `${shot.id}-subject`,
      type: 'subject',
      description: shot.subject,
      opacity: 1,
    },
    {
      id: `${shot.id}-fg`,
      type: 'foreground-motif',
      description: shot.foreground,
      opacity: 1,
    },
  ];
  const backgroundElements: VisualElement[] = [
    {
      id: `${shot.id}-bg`,
      type: 'environment',
      description: shot.background,
      opacity: 1,
    },
  ];

  return {
    shotType,
    camera: {
      movement: MOVEMENT_BY_BEAT[shot.beatKind],
      angle: { pitch: 0, yaw: 0, roll: 0 },
      lens: { type: lensForShotType(shotType) },
      focus: { type: shot.beatKind === 'climax' ? 'shallow' : 'deep' },
      depth: shot.beatKind === 'climax' ? 0.3 : 0.7,
    },
    composition,
    lighting,
    colorGrading: {
      look: pick(brief.visualDirection.visualThemes, shot.sequence, brief.visualDirection.aestheticStyle),
      colorCast: brief.visualDirection.colorMood,
      saturation: clamp(0.5 + emotionIntensity * 0.04, 0, 1),
      contrast: shot.beatKind === 'climax' ? 0.75 : 0.55,
      highlights: 0.6,
      shadows: 0.4,
      temperature: temperatureFromMood(brief.visualDirection.colorMood),
    },
    foregroundElements,
    backgroundElements,
    specialEffects: [],
    props: [],
    talent: [],
  };
}

function widen(type: ShotType): ShotType {
  if (type === 'close-up') {
    return 'medium';
  }
  if (type === 'medium') {
    return 'wide';
  }
  return type;
}

function lensForShotType(type: ShotType): string {
  switch (type) {
    case 'wide':
    case 'aerial':
      return '24mm';
    case 'medium':
    case 'two-shot':
    case 'group':
      return '50mm';
    case 'close-up':
    case 'over-shoulder':
      return '85mm';
    case 'extreme-close-up':
      return '100mm macro';
    default:
      return '35mm';
  }
}

function temperatureFromMood(mood: string): number {
  const normalized = mood.toLowerCase();
  if (normalized.includes('warm') || normalized.includes('cozy') || normalized.includes('energetic')) {
    return 5600;
  }
  if (normalized.includes('cool') || normalized.includes('calm') || normalized.includes('clinical')) {
    return 7000;
  }
  return 6500;
}

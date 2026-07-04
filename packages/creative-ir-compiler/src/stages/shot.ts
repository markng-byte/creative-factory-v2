/**
 * Shot Planner (Stage 5).
 *
 * Breaks each scene into shots. Shot count scales with dramatic weight — a climax gets more
 * coverage than a setup — and each shot is assigned a subject, foreground, and background
 * derived from the brief's visual direction.
 */

import type { CreativeBrief } from '@creative-factory/domain';
import type { SceneDraft, ShotDraft, StoryBeatKind } from '../model.js';
import type { IdGenerator } from '../support/id.js';
import { pick } from '../support/util.js';

const SHOT_COUNT: Record<StoryBeatKind, number> = {
  setup: 2,
  inciting: 2,
  rising: 3,
  climax: 3,
  resolution: 2,
  'call-to-action': 1,
};

const SHOT_ROLE: readonly string[] = ['establishing', 'detail', 'reaction', 'insert'];

export function planShots(scene: SceneDraft, brief: CreativeBrief, ids: IdGenerator): ShotDraft[] {
  const count = SHOT_COUNT[scene.beat.kind];
  const themes = brief.visualDirection.visualThemes;
  const subjectBase = brief.visualDirection.visualConcept;

  return Array.from({ length: count }, (_, index) => {
    const id = ids.generate('shot', scene.id, index);
    const role = pick(SHOT_ROLE, index, 'detail');
    const theme = pick(themes, index, subjectBase);

    return {
      id,
      sequence: index,
      description: `${scene.title} — ${role} shot conveying "${scene.emotion}"`,
      subject: subjectBase,
      foreground: theme,
      background: brief.visualDirection.colorMood,
      sceneId: scene.id,
      beatKind: scene.beat.kind,
    };
  });
}

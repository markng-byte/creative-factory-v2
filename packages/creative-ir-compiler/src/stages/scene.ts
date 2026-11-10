/**
 * Scene Planner (Stage 4).
 *
 * Expands each story beat into a scene carrying its narrative goal, business goal, audience
 * impact, emotion, and narrative text. One beat becomes one scene; the scene's timing and
 * shots are planned by later stages.
 */

import type { CreativeBrief } from '@creative-factory/domain';
import type { NarrativeBlueprint, SceneDraft, StoryBeatKind, StoryDraft } from '../model.js';
import type { IdGenerator } from '../support/id.js';
import { nonBlankOr, pick } from '../support/util.js';
import { compilerCopy, type CompilerCopy } from './copy.js';

const NARRATIVE_GOAL: Record<StoryBeatKind, string> = {
  setup: 'Orient the viewer and establish relevance',
  inciting: 'Surface the core tension the brand resolves',
  rising: 'Escalate stakes and accumulate proof',
  climax: 'Land the central message at peak emotional intensity',
  resolution: 'Reinforce the benefit and brand promise',
  'call-to-action': 'Convert attention into the desired action',
};

export function planScenes(
  story: StoryDraft,
  brief: CreativeBrief,
  narrative: NarrativeBlueprint,
  ids: IdGenerator,
  language = 'en',
): SceneDraft[] {
  const copy = compilerCopy(language);
  const businessObjectives = brief.businessObjectives.map((objective) => objective.description);
  const communicationObjectives = brief.communicationObjectives.map(
    (objective) => objective.description,
  );

  return story.beats.map((beat, index) => {
    const id = ids.generate('scene', story.id, beat.kind, index);
    const keyMessage = nonBlankOr(beat.keyMessage, narrative.keyMessages[0] ?? narrative.theme);

    return {
      id,
      title: beat.title,
      sequence: index,
      purpose: beat.intent,
      narrativeGoal: NARRATIVE_GOAL[beat.kind],
      businessGoal: pick(businessObjectives, index, brief.campaignContext.goal),
      audienceImpact: pick(
        communicationObjectives,
        index,
        `Move the audience toward ${narrative.callToAction}`,
      ),
      emotion: beat.emotion,
      narrativeText: composeNarrativeText(beat.kind, keyMessage, narrative, copy),
      beat,
    };
  });
}

function composeNarrativeText(
  kind: StoryBeatKind,
  keyMessage: string,
  narrative: NarrativeBlueprint,
  copy: CompilerCopy,
): string {
  switch (kind) {
    case 'setup':
      return copy.setup(narrative.throughline);
    case 'inciting':
      return copy.inciting(keyMessage);
    case 'rising':
      return copy.rising(keyMessage);
    case 'climax':
      return copy.climax(keyMessage);
    case 'resolution':
      return copy.resolution(narrative.theme);
    case 'call-to-action':
      return `${narrative.callToAction}.`;
    default:
      return keyMessage;
  }
}

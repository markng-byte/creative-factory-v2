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
): SceneDraft[] {
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
      narrativeText: composeNarrativeText(beat.kind, keyMessage, narrative),
      beat,
    };
  });
}

function composeNarrativeText(
  kind: StoryBeatKind,
  keyMessage: string,
  narrative: NarrativeBlueprint,
): string {
  switch (kind) {
    case 'setup':
      return `We open in the audience's world. ${narrative.throughline}`;
    case 'inciting':
      return `A tension emerges: ${keyMessage}`;
    case 'rising':
      return `The stakes rise as we prove the point — ${keyMessage}`;
    case 'climax':
      return `At peak intensity, the core message lands: ${keyMessage}`;
    case 'resolution':
      return `The tension resolves, reinforcing ${narrative.theme}.`;
    case 'call-to-action':
      return `${narrative.callToAction}.`;
    default:
      return keyMessage;
  }
}

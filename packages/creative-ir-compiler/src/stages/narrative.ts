/**
 * Narrative Engine (Stage 1).
 *
 * Derives the story arc, emotional journey, communication flow, and key messages from the
 * Creative Brief. This is a pure transformation — no I/O, no randomness — and it establishes
 * the dramatic skeleton every later stage hangs structure on.
 */

import type { CreativeBrief, Message } from '@creative-factory/domain';
import type { NarrativeBlueprint, StoryBeat, StoryBeatKind } from '../model.js';
import { nonBlankOr, pick, round } from '../support/util.js';

/** Canonical six-beat arc with relative timeline weights (sum to 1.0). */
const BEAT_TEMPLATE: ReadonlyArray<{ kind: StoryBeatKind; weight: number; goal: string }> = [
  { kind: 'setup', weight: 0.15, goal: 'Establish world, audience, and context' },
  { kind: 'inciting', weight: 0.15, goal: 'Introduce the tension or opportunity' },
  { kind: 'rising', weight: 0.2, goal: 'Build stakes and demonstrate value' },
  { kind: 'climax', weight: 0.25, goal: 'Deliver the core message at peak intensity' },
  { kind: 'resolution', weight: 0.15, goal: 'Resolve tension and reinforce benefit' },
  { kind: 'call-to-action', weight: 0.1, goal: 'Drive the desired audience action' },
];

const BEAT_TITLES: Record<StoryBeatKind, string> = {
  setup: 'Setup',
  inciting: 'Inciting Moment',
  rising: 'Rising Action',
  climax: 'Climax',
  resolution: 'Resolution',
  'call-to-action': 'Call to Action',
};

export function planNarrative(brief: CreativeBrief): NarrativeBlueprint {
  const messages = sortByPriority(brief.keyMessages);
  const messageContents = messages.map((message) => message.content);
  const framework = brief.messagingFramework;
  const emotion = brief.emotionalDirection;

  const emotionalJourney = emotion.emotionalJourney.map((beat) => ({
    phase: beat.phase,
    emotion: beat.emotion,
    intensity: beat.intensity,
    trigger: beat.trigger,
  }));

  const beats: StoryBeat[] = BEAT_TEMPLATE.map((template, index) => ({
    kind: template.kind,
    title: BEAT_TITLES[template.kind],
    intent: template.goal,
    emotion: resolveBeatEmotion(template.kind, emotionalJourney, emotion.primaryEmotion, index),
    weight: round(template.weight),
    keyMessage: pick(messageContents, index, messageContents[0] ?? framework.bigIdea),
  }));

  const communicationFlow = [...brief.communicationObjectives]
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    .map((objective) => objective.description);

  return {
    theme: nonBlankOr(framework.bigIdea, brief.campaignContext.goal),
    throughline: nonBlankOr(framework.narrativeArc, framework.bigIdea),
    moodPrimary: nonBlankOr(emotion.primaryEmotion, 'confident'),
    moodSecondary: emotion.secondaryEmotions,
    moodAvoided: emotion.avoidEmotions,
    keyMessages: messageContents.length > 0 ? messageContents : [framework.bigIdea],
    communicationFlow: communicationFlow.length > 0 ? communicationFlow : framework.storyHooks,
    emotionalJourney,
    callToAction: nonBlankOr(
      brief.desiredUserAction.primary.description,
      `${brief.desiredUserAction.primary.verb} ${brief.desiredUserAction.primary.object}`.trim(),
    ),
    beats,
  };
}

function sortByPriority(messages: readonly Message[]): Message[] {
  return [...messages].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
}

function priorityRank(priority: 'primary' | 'secondary' | 'tertiary'): number {
  switch (priority) {
    case 'primary':
      return 0;
    case 'secondary':
      return 1;
    default:
      return 2;
  }
}

function resolveBeatEmotion(
  kind: StoryBeatKind,
  journey: ReadonlyArray<{ emotion: string; intensity: number }>,
  primaryEmotion: string,
  index: number,
): string {
  if (kind === 'climax') {
    const peak = [...journey].sort((a, b) => b.intensity - a.intensity)[0];
    return peak?.emotion ?? primaryEmotion;
  }
  if (journey.length === 0) {
    return primaryEmotion;
  }
  return pick(
    journey.map((waypoint) => waypoint.emotion),
    index,
    primaryEmotion,
  );
}

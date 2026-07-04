/**
 * Story Engine (Stage 2).
 *
 * Turns the narrative blueprint into one or more `StoryDraft`s. A single creative deliverable
 * maps to a single cohesive story arc; the function returns an array so multi-story campaigns
 * can be supported without changing downstream stages.
 */

import type { CreativeBrief } from '@creative-factory/domain';
import type { NarrativeBlueprint, StoryDraft } from '../model.js';
import type { IdGenerator } from '../support/id.js';
import { nonBlankOr } from '../support/util.js';

export function planStories(
  brief: CreativeBrief,
  narrative: NarrativeBlueprint,
  ids: IdGenerator,
): StoryDraft[] {
  const title = nonBlankOr(narrative.theme, brief.campaignContext.name);
  const id = ids.generate('story', brief.id, title, 0);

  return [
    {
      id,
      title,
      description: narrative.throughline,
      sequence: 0,
      beats: narrative.beats,
    },
  ];
}

/**
 * Storyboard Engine (Stage 3).
 *
 * Groups a story's scenes into a storyboard. A single arc maps to a single storyboard; the
 * shape is kept extensible so a long arc could later be chunked into act-level storyboards.
 */

import type { SceneDraft, StoryboardDraft, StoryDraft } from '../model.js';
import type { IdGenerator } from '../support/id.js';

export function planStoryboards(
  story: StoryDraft,
  scenes: readonly SceneDraft[],
  ids: IdGenerator,
): StoryboardDraft[] {
  const id = ids.generate('storyboard', story.id, 0);
  return [
    {
      id,
      title: `${story.title} — Storyboard`,
      sequence: 0,
      scenes,
    },
  ];
}

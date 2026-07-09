/**
 * Comment anchors.
 *
 * Builds the index of every anchorable node id in a Creative IR so comments can be validated
 * structurally: a comment on scene X is rejected unless scene X exists in the document under
 * review. The index is a sorted, deduplicated string list — serializable and deterministic.
 */

import type { CreativeIR } from '@creative-factory/creative-ir';
import type { CommentAnchor } from './types.js';

export function buildAnchorIndex(creativeIR: CreativeIR): readonly string[] {
  const ids = new Set<string>();
  ids.add(String(creativeIR.id));

  for (const story of creativeIR.stories) {
    ids.add(String(story.id));
    for (const storyboard of story.storyboards) {
      ids.add(String(storyboard.id));
      for (const scene of storyboard.scenes) {
        ids.add(String(scene.id));
        for (const shot of scene.shots) {
          ids.add(String(shot.id));
        }
      }
    }
  }
  for (const request of creativeIR.assetRequests) {
    ids.add(String(request.id));
  }

  return [...ids].sort();
}

export function isAnchorValid(anchor: CommentAnchor, anchorIndex: readonly string[]): boolean {
  return anchorIndex.includes(anchor.targetId);
}

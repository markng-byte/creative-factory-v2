/**
 * Review registry.
 *
 * Map-backed storage for review cycles, matching the in-memory registry pattern of Sprints 3-5.
 * The engine treats cycles as immutable snapshots; `save` replaces the stored version.
 */

import type { ReviewCycle, ReviewCycleId } from './types.js';

export interface ReviewRegistry {
  save(cycle: ReviewCycle): void;
  getById(id: ReviewCycleId): ReviewCycle | undefined;
  listByCampaign(campaignId: string): ReviewCycle[];
  listOpen(): ReviewCycle[];
}

export class InMemoryReviewRegistry implements ReviewRegistry {
  private readonly cycles = new Map<string, ReviewCycle>();

  save(cycle: ReviewCycle): void {
    this.cycles.set(String(cycle.id), cycle);
  }

  getById(id: ReviewCycleId): ReviewCycle | undefined {
    return this.cycles.get(String(id));
  }

  listByCampaign(campaignId: string): ReviewCycle[] {
    return [...this.cycles.values()]
      .filter((cycle) => cycle.campaignId === campaignId)
      .sort(
        (a, b) => a.openedAt.localeCompare(b.openedAt) || String(a.id).localeCompare(String(b.id)),
      );
  }

  listOpen(): ReviewCycle[] {
    return [...this.cycles.values()]
      .filter((cycle) => cycle.state === 'open')
      .sort(
        (a, b) => a.openedAt.localeCompare(b.openedAt) || String(a.id).localeCompare(String(b.id)),
      );
  }
}

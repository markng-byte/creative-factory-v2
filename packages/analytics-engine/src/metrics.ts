/**
 * Metric computation.
 *
 * Folds a Creative IR (structure, asset QA status, library refs) and the event stream (generation,
 * catalog, review, QA, export, lifecycle events) into an `AnalyticsReport`. Pure and deterministic.
 */

import type { CreativeIR } from '@creative-factory/creative-ir';
import type { CreativeFactoryEventContract } from '@creative-factory/contracts';
import { ratio } from './support.js';
import type {
  ActivityMetrics,
  AnalyticsReport,
  AssetMetrics,
  LifecycleMetrics,
  QualityMetrics,
  ReuseMetrics,
  StructureMetrics,
} from './types.js';

export function computeReport(
  creativeIR: CreativeIR,
  events: readonly CreativeFactoryEventContract[],
  reportId: string,
  generatedAt: string,
): AnalyticsReport {
  const eventCounts = countByName(events);
  return {
    reportId,
    campaignId: creativeIR.campaign.id,
    creativeIRId: String(creativeIR.id),
    generatedAt,
    structure: structure(creativeIR),
    assets: assets(creativeIR),
    quality: quality(creativeIR),
    reuse: reuse(events),
    activity: activity(eventCounts),
    lifecycle: lifecycle(events),
    eventCounts,
  };
}

function structure(creativeIR: CreativeIR): StructureMetrics {
  let storyboards = 0;
  let scenes = 0;
  let shots = 0;
  for (const story of creativeIR.stories) {
    storyboards += story.storyboards.length;
    for (const storyboard of story.storyboards) {
      scenes += storyboard.scenes.length;
      for (const scene of storyboard.scenes) {
        shots += scene.shots.length;
      }
    }
  }
  return {
    stories: creativeIR.stories.length,
    storyboards,
    scenes,
    shots,
    assetRequests: creativeIR.assetRequests.length,
  };
}

function assets(creativeIR: CreativeIR): AssetMetrics {
  const byType: Record<string, number> = {};
  let generated = 0;
  let approved = 0;
  let rejected = 0;
  let pending = 0;
  for (const request of creativeIR.assetRequests) {
    byType[request.assetType] = (byType[request.assetType] ?? 0) + 1;
    if (request.deliveredAssets.length > 0) {
      generated += 1;
    }
    if (request.qaStatus === 'approved') {
      approved += 1;
    } else if (request.qaStatus === 'rejected') {
      rejected += 1;
    } else {
      pending += 1;
    }
  }
  const total = creativeIR.assetRequests.length;
  return {
    total,
    byType,
    generated,
    approved,
    rejected,
    pending,
    generationRate: ratio(generated, total),
  };
}

function quality(creativeIR: CreativeIR): QualityMetrics {
  let passed = 0;
  let failed = 0;
  for (const request of creativeIR.assetRequests) {
    if (request.qaStatus === 'approved') {
      passed += 1;
    } else if (request.qaStatus === 'rejected') {
      failed += 1;
    }
  }
  const assessed = passed + failed;
  return { assessed, passed, failed, passRate: ratio(passed, assessed) };
}

function reuse(events: readonly CreativeFactoryEventContract[]): ReuseMetrics {
  let cataloged = 0;
  let deduped = 0;
  for (const event of events) {
    if (event.name === 'asset.cataloged') {
      cataloged += 1;
      if (event.payload.deduped) {
        deduped += 1;
      }
    }
  }
  return { cataloged, deduped, dedupRate: ratio(deduped, cataloged) };
}

function activity(eventCounts: Readonly<Record<string, number>>): ActivityMetrics {
  return {
    promptsGenerated: eventCounts['prompt.generated'] ?? 0,
    assetsGenerated: eventCounts['asset.generated'] ?? 0,
    assetsCataloged: eventCounts['asset.cataloged'] ?? 0,
    exportsPublished: eventCounts['export.published'] ?? 0,
    reviewsCompleted: eventCounts['review.completed'] ?? 0,
    qaRuns: eventCounts['qa.completed'] ?? 0,
  };
}

function lifecycle(events: readonly CreativeFactoryEventContract[]): LifecycleMetrics {
  const transitions = events
    .filter((event) => event.name === 'campaign.lifecycle.transitioned')
    .map((event) => ({
      from: event.payload.from,
      to: event.payload.to,
      at: event.occurredAt,
    }))
    .sort((a, b) => a.at.localeCompare(b.at) || a.from.localeCompare(b.from));

  const reachedStates: string[] = [];
  for (const transition of transitions) {
    if (reachedStates.length === 0) {
      reachedStates.push(transition.from);
    }
    if (!reachedStates.includes(transition.to)) {
      reachedStates.push(transition.to);
    }
  }
  return {
    transitions,
    reachedStates,
    completed: reachedStates.includes('COMPLETED'),
  };
}

function countByName(events: readonly CreativeFactoryEventContract[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const event of events) {
    counts[event.name] = (counts[event.name] ?? 0) + 1;
  }
  return counts;
}

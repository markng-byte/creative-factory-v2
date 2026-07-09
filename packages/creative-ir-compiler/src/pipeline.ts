/**
 * Compilation pipeline.
 *
 * Composes the nine pure planning stages, in order, into a fully-populated `CreativeIR`. The
 * pipeline itself is a pure function of `(inputs, ctx)`: the only impurity — reading the clock —
 * happens once, up front, and is threaded through as a value. Given identical inputs and a fixed
 * clock/id-generator, it always produces a byte-identical document.
 */

import {
  createCreativeIRId,
  createSceneId,
  createShotId,
  createStoryId,
  createStoryboardId,
  type AspectRatio,
  type AudioSpecification,
  type CreativeIR,
  type Duration,
  type MotionSpecification,
  type Scene,
  type Shot,
  type Story,
  type Storyboard,
  type Transition,
  type VisualSpecification,
} from '@creative-factory/creative-ir';
import { createUserId } from '@creative-factory/domain';
import type { CompileInputs, PlanningContext } from './ports.js';
import type { AssetPlanShot } from './stages/asset.js';
import type { SceneDraft, ShotDraft, StoryBeatKind, StoryDraft } from './model.js';
import {
  buildCreativeContext,
  planAssets,
  planComposition,
  planMotion,
  planNarrative,
  planScenes,
  planShots,
  planStories,
  planStoryboards,
  planTiming,
} from './stages/index.js';
import { checksum } from './support/hash.js';
import { COMPILER_VERSION, EMITTED_SCHEMA_VERSION } from './version.js';

const INTENSITY_BY_BEAT: Record<StoryBeatKind, number> = {
  setup: 4,
  inciting: 6,
  rising: 7,
  climax: 9,
  resolution: 5,
  'call-to-action': 6,
};

interface PlannedShotBlueprint {
  readonly draft: ShotDraft;
  readonly visual: VisualSpecification;
  readonly motion: MotionSpecification;
}

interface SceneBlueprint {
  readonly scene: SceneDraft;
  readonly plannedShots: readonly PlannedShotBlueprint[];
}

interface StoryBlueprint {
  readonly story: StoryDraft;
  readonly sceneBlueprints: readonly SceneBlueprint[];
  readonly storyboardId: string;
  readonly storyboardTitle: string;
}

export function buildCreativeIR(inputs: CompileInputs, ctx: PlanningContext): CreativeIR {
  const { brief, campaign, brand } = inputs;
  const { ids, clock } = ctx;
  const createdAt = clock.now();

  const frameRate =
    campaign.duration.frameRate && campaign.duration.frameRate > 0
      ? campaign.duration.frameRate
      : 30;
  const totalSeconds = campaign.duration.minutes * 60 + campaign.duration.seconds;
  const aspectRatio: AspectRatio = campaign.aspectRatios[0] ?? '16:9';
  const language = campaign.languages[0] ?? 'en';

  // --- Phase 1: planning ---------------------------------------------------
  const narrative = planNarrative(brief);
  const stories = planStories(brief, narrative, ids);

  const storyBlueprints: StoryBlueprint[] = stories.map((story) => {
    const scenes = planScenes(story, brief, narrative, ids);
    const sceneBlueprints: SceneBlueprint[] = scenes.map((scene) => {
      const shotDrafts = planShots(scene, brief, ids);
      const plannedShots: PlannedShotBlueprint[] = shotDrafts.map((draft) => {
        const visual = planComposition(draft, brief, brand, INTENSITY_BY_BEAT[draft.beatKind]);
        const motion = planMotion(draft, visual);
        return { draft, visual, motion };
      });
      return { scene, plannedShots };
    });
    const storyboards = planStoryboards(story, scenes, ids);
    const storyboard = storyboards[0];
    return {
      story,
      sceneBlueprints,
      storyboardId: storyboard?.id ?? ids.generate('storyboard', story.id, 0),
      storyboardTitle: storyboard?.title ?? `${story.title} — Storyboard`,
    };
  });

  // --- Timing --------------------------------------------------------------
  const timing = planTiming({
    frameRate,
    totalSeconds,
    stories: storyBlueprints.map((sb) => ({
      id: sb.story.id,
      scenes: sb.sceneBlueprints.map((scb) => ({
        id: scb.scene.id,
        weight: scb.scene.beat.weight,
        shotIds: scb.plannedShots.map((ps) => ps.draft.id),
      })),
    })),
  });

  // --- Asset planning ------------------------------------------------------
  const assetShots: AssetPlanShot[] = [];
  storyBlueprints.forEach((sb, storyIdx) => {
    sb.sceneBlueprints.forEach((scb, sceneIdx) => {
      scb.plannedShots.forEach((ps, shotIdx) => {
        assetShots.push({
          shotId: ps.draft.id,
          description: ps.draft.description,
          narrativeText: scb.scene.narrativeText,
          beatKind: ps.draft.beatKind,
          isSceneOpener: shotIdx === 0,
          isStoryOpener: storyIdx === 0 && sceneIdx === 0 && shotIdx === 0,
        });
      });
    });
  });
  const assets = planAssets({ shots: assetShots, aspectRatio, createdAt, language }, ids);

  // --- Phase 2: assembly ---------------------------------------------------
  const assembledStories: Story[] = storyBlueprints.map((sb) => {
    const scenes: Scene[] = sb.sceneBlueprints.map((scb) => {
      const shots: Shot[] = scb.plannedShots.map((ps) => ({
        id: createShotId(ps.draft.id),
        sequence: ps.draft.sequence,
        description: ps.draft.description,
        duration: framesToDuration(timing.shotFrames.get(ps.draft.id) ?? 0, frameRate),
        visualSpec: ps.visual,
        motionSpec: ps.motion,
        audioElements: [],
        assetRequests: assets.shotAssetIds.get(ps.draft.id) ?? [],
      }));

      return {
        id: createSceneId(scb.scene.id),
        title: scb.scene.title,
        description: scb.scene.purpose,
        sequence: scb.scene.sequence,
        narrativeText: scb.scene.narrativeText,
        objectives: {
          purpose: scb.scene.purpose,
          narrativeGoal: scb.scene.narrativeGoal,
          businessGoal: scb.scene.businessGoal,
          audienceImpact: scb.scene.audienceImpact,
          emotion: scb.scene.emotion,
        },
        shots,
        transitions: buildTransitions(shots.length, scb.scene.beat.kind, frameRate),
        audioSpecs: buildSceneAudio(scb.scene, language),
        duration: framesToDuration(timing.sceneFrames.get(scb.scene.id) ?? 0, frameRate),
      };
    });

    const storyFrames = timing.storyFrames.get(sb.story.id) ?? 0;
    const storyboard: Storyboard = {
      id: createStoryboardId(sb.storyboardId),
      title: sb.storyboardTitle,
      sequence: 0,
      scenes,
      duration: framesToDuration(storyFrames, frameRate),
    };

    return {
      id: createStoryId(sb.story.id),
      title: sb.story.title,
      description: sb.story.description,
      sequence: sb.story.sequence,
      durationFrames: storyFrames,
      storyboards: [storyboard],
      reviewState: 'not-started',
      approvalState: 'pending',
      metadata: { beats: sb.story.beats.map((beat) => beat.kind) },
    };
  });

  const irId = createCreativeIRId(ids.generate('cir', brief.id, campaign.id));

  const revisionHistory = [
    {
      version: 1,
      timestamp: createdAt,
      actor: createUserId('creative-ir-compiler'),
      changeDescription: 'Initial deterministic compilation from Creative Brief',
      metadata: {},
    },
  ];
  const feedback = [...(inputs.reviewFeedback ?? [])].sort(
    (a, b) => a.priority - b.priority || a.reviewId.localeCompare(b.reviewId),
  );
  if (feedback.length > 0) {
    revisionHistory.push({
      version: 2,
      timestamp: createdAt,
      actor: createUserId('creative-ir-compiler'),
      changeDescription: `Recompiled with ${feedback.length} review feedback item(s): ${feedback
        .map((item) => item.reviewId)
        .join(', ')}`,
      metadata: { reviewFeedback: feedback },
    });
  }

  return {
    version: EMITTED_SCHEMA_VERSION,
    id: irId,
    createdAt,
    updatedAt: createdAt,
    revisionHistory,
    campaign,
    creativeContext: buildCreativeContext(brief, brand, narrative),
    stories: assembledStories,
    brandTokens: brand.brandTokens,
    designTokens: brand.designTokens,
    assetRequests: assets.requests,
    reviews: [],
    exports: [],
    validationStatus: {
      isValid: true,
      errors: [],
      warnings: [],
      lastValidatedAt: createdAt,
    },
    compilerMetadata: {
      compileVersion: COMPILER_VERSION,
      compileTimestamp: createdAt,
      sourceComponents: [
        {
          id: brief.id,
          type: 'creative-brief',
          version: brief.version,
          checksum: checksum(brief.id, brief.version),
        },
        {
          id: campaign.id,
          type: 'campaign',
          version: '1.0.0',
          checksum: checksum(campaign.id, campaign.name),
        },
        {
          id: brand.brandTokens.brandId,
          type: 'brand-tokens',
          version: '1.0.0',
          checksum: checksum(brand.brandTokens.brandId, brand.brandTokens.brandName),
        },
      ],
      compileRules: [
        'six-beat-narrative-arc',
        'weight-proportional-timing',
        'brand-token-driven-composition',
        'deterministic-ids',
      ],
      adapterMetadata: {},
      diagnostics: [],
    },
  };
}

// ============================================================================
// Assembly helpers
// ============================================================================

function framesToDuration(frames: number, frameRate: number): Duration {
  const framesPerMinute = frameRate * 60;
  const minutes = Math.floor(frames / framesPerMinute);
  const afterMinutes = frames - minutes * framesPerMinute;
  const seconds = Math.floor(afterMinutes / frameRate);
  const leftover = afterMinutes - seconds * frameRate;
  return { minutes, seconds, frames: leftover, frameRate };
}

function buildTransitions(
  shotCount: number,
  beatKind: StoryBeatKind,
  frameRate: number,
): Transition[] {
  if (shotCount <= 1) {
    return [];
  }
  const type = transitionTypeForBeat(beatKind);
  const duration = framesToDuration(Math.round(frameRate * 0.5), frameRate);
  return Array.from({ length: shotCount - 1 }, () => ({
    type,
    duration,
    easing: 'ease-in-out',
    description: `${type} between consecutive shots`,
  }));
}

function transitionTypeForBeat(beatKind: StoryBeatKind): Transition['type'] {
  switch (beatKind) {
    case 'resolution':
      return 'dissolve';
    case 'call-to-action':
      return 'fade';
    case 'climax':
      return 'cut';
    default:
      return 'cut';
  }
}

function buildSceneAudio(scene: SceneDraft, language: string): AudioSpecification {
  return {
    voiceover: {
      script: scene.narrativeText,
      language,
      style: 'natural, brand-aligned',
      pacing: scene.beat.kind === 'call-to-action' ? 'assertive' : 'measured',
      emotionalTone: scene.emotion,
      deliveryNotes: `Support the "${scene.emotion}" beat without over-acting`,
    },
    soundEffects: [],
    mixing: {
      masterVolume: 0,
      voiceoverLevel: 0,
      musicLevel: -12,
      effectsLevel: -9,
      ambienceLevel: -18,
      dynamicRangeCompression: true,
      normalization: true,
    },
  };
}

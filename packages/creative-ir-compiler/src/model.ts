/**
 * Internal planning blueprints.
 *
 * These types are the intermediate representation *inside* the compiler. Each stage consumes
 * the previous stage's blueprint and produces the next, entirely immutably. The final
 * assembler folds them into the canonical `CreativeIR`. They are intentionally not exported
 * from the package root — only the compiler and its stages depend on them.
 */

import type {
  MotionSpecification,
  Transition,
  VisualSpecification,
} from '@creative-factory/creative-ir';

/** Canonical dramatic beats of a story arc, in narrative order. */
export type StoryBeatKind =
  | 'setup'
  | 'inciting'
  | 'rising'
  | 'climax'
  | 'resolution'
  | 'call-to-action';

export interface StoryBeat {
  readonly kind: StoryBeatKind;
  readonly title: string;
  readonly intent: string;
  readonly emotion: string;
  /** Relative share of the timeline this beat should occupy (0..1, across a story's beats). */
  readonly weight: number;
  readonly keyMessage?: string;
}

export interface EmotionalWaypoint {
  readonly phase: string;
  readonly emotion: string;
  readonly intensity: number; // 1..10
  readonly trigger: string;
}

export interface NarrativeBlueprint {
  readonly theme: string;
  readonly throughline: string;
  readonly moodPrimary: string;
  readonly moodSecondary: readonly string[];
  readonly moodAvoided: readonly string[];
  readonly keyMessages: readonly string[];
  readonly communicationFlow: readonly string[];
  readonly emotionalJourney: readonly EmotionalWaypoint[];
  readonly callToAction: string;
  readonly beats: readonly StoryBeat[];
}

export interface StoryDraft {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly sequence: number;
  readonly beats: readonly StoryBeat[];
}

export interface SceneDraft {
  readonly id: string;
  readonly title: string;
  readonly sequence: number;
  readonly purpose: string;
  readonly narrativeGoal: string;
  readonly businessGoal: string;
  readonly audienceImpact: string;
  readonly emotion: string;
  readonly narrativeText: string;
  readonly beat: StoryBeat;
}

export interface StoryboardDraft {
  readonly id: string;
  readonly title: string;
  readonly sequence: number;
  readonly scenes: readonly SceneDraft[];
}

export interface ShotDraft {
  readonly id: string;
  readonly sequence: number;
  readonly description: string;
  readonly subject: string;
  readonly foreground: string;
  readonly background: string;
  readonly sceneId: string;
  readonly beatKind: StoryBeatKind;
}

/** A shot enriched with its fully-planned visual and motion specifications. */
export interface PlannedShot {
  readonly draft: ShotDraft;
  readonly visualSpec: VisualSpecification;
  readonly motionSpec: MotionSpecification;
  readonly transitionOut: Transition;
}

/** Frame-accurate timing produced by the timing planner, keyed by element id. */
export interface TimingPlan {
  readonly frameRate: number;
  readonly totalFrames: number;
  readonly sceneFrames: ReadonlyMap<string, number>;
  readonly shotFrames: ReadonlyMap<string, number>;
  readonly storyFrames: ReadonlyMap<string, number>;
}

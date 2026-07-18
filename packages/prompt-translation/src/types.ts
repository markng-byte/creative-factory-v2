/**
 * Prompt Translation model.
 *
 * The engine turns an approved Creative IR into a `PromptPackage`: one `PromptRequest` per
 * required asset, carrying a provider-neutral, ready-to-send prompt body and parameters for a
 * specific target kind (image / video / voiceover). Requests are the canonical input to the
 * downstream generation engines (Sprints 8–9), and the point where an actual provider is finally
 * addressed — through the dispatch seam, never inside translation.
 */

import type { ISO8601Timestamp } from '@creative-factory/domain';

export type PromptTargetKind = 'image' | 'video' | 'voiceover';

/** A single, provider-neutral prompt ready to be sent to a generation provider. */
export interface PromptRequest {
  readonly id: string;
  readonly targetKind: PromptTargetKind;
  /** Neutral target name, e.g. "image.diffusion" — a provider is bound only at dispatch time. */
  readonly target: string;
  readonly shotId?: string;
  readonly sceneId?: string;
  readonly assetRequestId?: string;
  /** The affirmative prompt text (image/video) or the script (voiceover). */
  readonly prompt: string;
  /** Things to avoid; empty for voiceover. */
  readonly negativePrompt: string;
  /** Structured, provider-neutral generation parameters. */
  readonly parameters: Readonly<Record<string, string | number | boolean>>;
  /** Brand tokens (hex, fonts) surfaced so a provider binding can enforce them. */
  readonly brandControls: Readonly<Record<string, string>>;
  /** Content fingerprint of the source Creative IR nodes this prompt derives from. */
  readonly sourceHash: string;
  readonly version: number;
}

export interface PromptPackage {
  readonly packageVersion: string;
  readonly creativeIRId: string;
  readonly schemaVersion: string;
  readonly generatedAt: ISO8601Timestamp;
  readonly engineVersion: string;
  readonly counts: Readonly<Record<PromptTargetKind, number>>;
  readonly requests: readonly PromptRequest[];
}

/** Input a target adapter receives for one asset request. */
export interface TranslationUnit {
  readonly assetRequestId: string;
  readonly assetType: string;
  readonly shotId: string;
  readonly sceneId: string;
  readonly storyId: string;
}

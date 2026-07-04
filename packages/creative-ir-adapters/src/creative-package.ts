/**
 * Creative Package.
 *
 * The canonical, reusable bundle that downstream generation engines (Prompt Translation, Image,
 * Video, QA, Export) consume. It packages every adapter output alongside the Creative IR
 * reference and derived creative metadata.
 *
 * `renderCreativePackage` is the Phase-2 entry point: run the standard adapters over a Creative IR
 * and assemble the package. It is deterministic — identical IR yields an identical package.
 */

import {
  ValidationMode,
  type AdapterOptions,
  type AdapterOutput,
  type CreativeIR,
  type CreativeIRAdapter,
} from '@creative-factory/creative-ir';
import { StandardAssetPlanAdapter } from './asset-plan.js';
import { StandardMotionSpecAdapter } from './motion-spec.js';
import { StandardQASpecAdapter } from './qa-spec.js';
import { StandardSceneSpecAdapter } from './scene-spec.js';
import { StandardShotListAdapter } from './shot-list.js';
import { StandardStoryboardHTMLAdapter } from './storyboard-html.js';
import { StandardTimelineAdapter } from './timeline.js';
import { durationToSeconds } from './support.js';
import { eachScene } from './base.js';

export const CREATIVE_PACKAGE_VERSION = '1.0.0' as const;

export interface CreativePackageArtifact {
  readonly name: string;
  readonly format: string;
  readonly mimeType: string;
  readonly size: number;
  readonly content: string;
}

export interface CreativeMetadata {
  readonly title: string;
  readonly theme: string;
  readonly callToAction: string;
  readonly totalStories: number;
  readonly totalScenes: number;
  readonly totalShots: number;
  readonly totalAssets: number;
  readonly totalDurationSeconds: number;
  readonly brand: string;
  readonly compileVersion: string;
  readonly compileTimestamp: string;
}

export interface CreativePackage {
  readonly packageVersion: string;
  readonly creativeIRId: string;
  readonly schemaVersion: string;
  readonly metadata: CreativeMetadata;
  /** Adapter name → its produced artifacts. */
  readonly artifacts: Record<string, CreativePackageArtifact[]>;
  readonly adapterWarnings: Record<string, string[]>;
}

/** All standard output adapters, in a stable order. */
export function createStandardAdapters(): CreativeIRAdapter[] {
  return [
    new StandardStoryboardHTMLAdapter(),
    new StandardSceneSpecAdapter(),
    new StandardShotListAdapter(),
    new StandardMotionSpecAdapter(),
    new StandardAssetPlanAdapter(),
    new StandardTimelineAdapter(),
    new StandardQASpecAdapter(),
  ];
}

function defaultOptions(adapter: CreativeIRAdapter): AdapterOptions {
  return {
    outputFormat: adapter.supportedOutputFormats[0] ?? 'json',
    includeMetadata: true,
    validationMode: ValidationMode.STRICT,
    parameters: {},
  };
}

/** Run a set of adapters over a Creative IR, returning their outputs keyed by adapter name. */
export async function runAdapters(
  creativeIR: CreativeIR,
  adapters: readonly CreativeIRAdapter[] = createStandardAdapters(),
): Promise<Map<string, AdapterOutput>> {
  const outputs = new Map<string, AdapterOutput>();
  for (const adapter of adapters) {
    const validation = adapter.validate(creativeIR);
    if (!validation.isValid) {
      continue;
    }
    outputs.set(adapter.name, await adapter.transform(creativeIR, defaultOptions(adapter)));
  }
  return outputs;
}

/** Assemble a Creative Package from a Creative IR and previously-produced adapter outputs. */
export function assembleCreativePackage(
  creativeIR: CreativeIR,
  outputs: Map<string, AdapterOutput>,
): CreativePackage {
  const artifacts: Record<string, CreativePackageArtifact[]> = {};
  const adapterWarnings: Record<string, string[]> = {};

  for (const [name, output] of [...outputs.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    artifacts[name] = output.artifacts.map((artifact) => ({
      name: artifact.name,
      format: artifact.format,
      mimeType: artifact.mimeType,
      size: artifact.size ?? contentLength(artifact.content),
      content:
        typeof artifact.content === 'string' ? artifact.content : artifact.content.toString('utf8'),
    }));
    if (output.warnings.length > 0) {
      adapterWarnings[name] = output.warnings;
    }
  }

  return {
    packageVersion: CREATIVE_PACKAGE_VERSION,
    creativeIRId: String(creativeIR.id),
    schemaVersion: creativeIR.version,
    metadata: buildMetadata(creativeIR),
    artifacts,
    adapterWarnings,
  };
}

/** Convenience: run the standard adapters and assemble the package in one call. */
export async function renderCreativePackage(
  creativeIR: CreativeIR,
  adapters: readonly CreativeIRAdapter[] = createStandardAdapters(),
): Promise<{ outputs: Map<string, AdapterOutput>; creativePackage: CreativePackage }> {
  const outputs = await runAdapters(creativeIR, adapters);
  return { outputs, creativePackage: assembleCreativePackage(creativeIR, outputs) };
}

function buildMetadata(creativeIR: CreativeIR): CreativeMetadata {
  let totalScenes = 0;
  let totalShots = 0;
  let totalDurationSeconds = 0;

  for (const { scene } of eachScene(creativeIR)) {
    totalScenes += 1;
    totalShots += scene.shots.length;
    totalDurationSeconds += durationToSeconds(scene.duration);
  }

  return {
    title: creativeIR.creativeContext.briefTitle,
    theme: creativeIR.creativeContext.narrativeTheme,
    callToAction: creativeIR.creativeContext.callToAction,
    totalStories: creativeIR.stories.length,
    totalScenes,
    totalShots,
    totalAssets: creativeIR.assetRequests.length,
    totalDurationSeconds: Number(totalDurationSeconds.toFixed(3)),
    brand: creativeIR.brandTokens.brandName,
    compileVersion: creativeIR.compilerMetadata.compileVersion,
    compileTimestamp: creativeIR.compilerMetadata.compileTimestamp,
  };
}

function contentLength(content: string | Buffer): number {
  return typeof content === 'string' ? Buffer.byteLength(content, 'utf8') : content.length;
}

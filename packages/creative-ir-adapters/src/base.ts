/**
 * Base adapter.
 *
 * Common scaffolding for output adapters: default input validation, deterministic metadata, and
 * artifact construction. Concrete adapters implement `build()` and declare their identity.
 *
 * Determinism: adapters never read a clock. `processedAt` is taken from the Creative IR's own
 * compile timestamp (or an explicit override in options), so identical IR yields identical output.
 */

import type {
  AdapterCapability,
  AdapterMetadata,
  AdapterOptions,
  AdapterOutput,
  AdapterValidationResult,
  CreativeIR,
  CreativeIRAdapter,
  OutputArtifact,
} from '@creative-factory/creative-ir';

export interface BuildResult {
  readonly artifacts: OutputArtifact[];
  readonly warnings: string[];
  readonly transformRules: string[];
}

export abstract class BaseAdapter implements CreativeIRAdapter {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly supportedOutputFormats: string[];
  abstract readonly capabilities: AdapterCapability[];

  protected abstract build(creativeIR: CreativeIR, options: AdapterOptions): BuildResult;

  async transform(creativeIR: CreativeIR, options: AdapterOptions): Promise<AdapterOutput> {
    const result = this.build(creativeIR, options);
    return {
      artifacts: result.artifacts,
      metadata: this.metadata(creativeIR, options, result.transformRules),
      warnings: result.warnings,
    };
  }

  validate(creativeIR: CreativeIR): AdapterValidationResult {
    const errors = [];
    if (creativeIR.stories.length === 0) {
      errors.push({
        code: 'NO_STORIES',
        message: 'Creative IR contains no stories to transform',
        severity: 'critical' as const,
      });
    }
    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  protected metadata(
    creativeIR: CreativeIR,
    options: AdapterOptions,
    transformRules: string[],
  ): AdapterMetadata {
    const override = options.parameters['processedAt'];
    const processedAt =
      typeof override === 'string' ? override : creativeIR.compilerMetadata.compileTimestamp;
    return {
      adapterName: this.name,
      adapterVersion: this.version,
      processedAt,
      transformRules,
      customizations: {},
    };
  }

  protected artifact(
    name: string,
    format: string,
    content: string,
    mimeType: string,
  ): OutputArtifact {
    return { name, format, content, mimeType, size: Buffer.byteLength(content, 'utf8') };
  }

  protected json(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }
}

type SceneOf = CreativeIR['stories'][number]['storyboards'][number]['scenes'][number];

/** Iterate every scene in document order with its owning story/storyboard indices. */
export function* eachScene(creativeIR: CreativeIR): Generator<{
  storyIndex: number;
  storyboardIndex: number;
  sceneIndex: number;
  scene: SceneOf;
}> {
  for (let storyIndex = 0; storyIndex < creativeIR.stories.length; storyIndex += 1) {
    const story = creativeIR.stories[storyIndex];
    if (!story) continue;
    for (let storyboardIndex = 0; storyboardIndex < story.storyboards.length; storyboardIndex += 1) {
      const storyboard = story.storyboards[storyboardIndex];
      if (!storyboard) continue;
      for (let sceneIndex = 0; sceneIndex < storyboard.scenes.length; sceneIndex += 1) {
        const scene = storyboard.scenes[sceneIndex];
        if (!scene) continue;
        yield { storyIndex, storyboardIndex, sceneIndex, scene };
      }
    }
  }
}

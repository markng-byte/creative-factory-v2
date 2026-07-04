/**
 * Standard Creative IR Validator
 *
 * Concrete implementation of {@link CreativeIRValidator}. Validation is layered into three
 * rule families that mirror the constants in `validation.ts`:
 *
 * - Structural: required fields, primitive/enum shapes.
 * - Semantic: referential integrity, temporal consistency, logical constraints.
 * - Compiler: path completeness, asset resolution, approval chains.
 *
 * The validator is pure and deterministic: given the same document and mode it always
 * produces the same {@link ValidationStatus}. It performs no I/O and mutates nothing.
 */

import type {
  CreativeIR,
  Scene,
  Shot,
  Story,
  Storyboard,
  ValidationError,
  ValidationStatus,
  ValidationWarning,
} from './types.js';
import { ValidationMode, type CreativeIRValidator } from './validation.js';

const SUPPORTED_ASPECT_RATIOS = new Set(['16:9', '9:16', '1:1', '4:3', '21:9']);
const CURRENT_SCHEMA_VERSION = '1.0.0';

interface MutableContext {
  readonly mode: ValidationMode;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
  readonly lastValidatedAt: string;
}

export class StandardCreativeIRValidator implements CreativeIRValidator {
  /** Injected clock keeps validation timestamps deterministic in tests. */
  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  validate(ir: CreativeIR, mode: ValidationMode = ValidationMode.STRICT): ValidationStatus {
    const ctx: MutableContext = {
      mode,
      errors: [],
      warnings: [],
      lastValidatedAt: this.now(),
    };

    this.checkStructural(ir, ctx);
    if (mode !== ValidationMode.DRAFT) {
      this.checkSemantic(ir, ctx);
    }
    if (mode === ValidationMode.STRICT) {
      this.checkCompiler(ir, ctx);
    }

    return {
      isValid: ctx.errors.length === 0,
      errors: ctx.errors,
      warnings: ctx.warnings,
      lastValidatedAt: ctx.lastValidatedAt,
    };
  }

  validateVersion(
    ir: CreativeIR,
    schemaVersion: string,
    mode: ValidationMode = ValidationMode.STRICT,
  ): ValidationStatus {
    const status = this.validate(ir, mode);
    if (ir.version !== schemaVersion) {
      return {
        ...status,
        warnings: [
          ...status.warnings,
          {
            code: 'SCHEMA_VERSION_MISMATCH',
            message: `Document version "${ir.version}" does not match requested schema "${schemaVersion}"`,
            path: 'version',
          },
        ],
      };
    }
    return status;
  }

  getSchema(): Record<string, unknown> {
    return {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'CreativeIR',
      version: CURRENT_SCHEMA_VERSION,
      type: 'object',
      required: ['version', 'id', 'campaign', 'stories', 'brandTokens', 'designTokens'],
    };
  }

  // ==========================================================================
  // Structural
  // ==========================================================================

  private checkStructural(ir: CreativeIR, ctx: MutableContext): void {
    requirePresent(ctx, ir.version, 'version', 'Creative IR must declare a schema version');
    requirePresent(ctx, ir.id, 'id', 'Creative IR must declare an id');
    requirePresent(ctx, ir.campaign, 'campaign', 'Creative IR must contain a campaign');
    requirePresent(ctx, ir.brandTokens, 'brandTokens', 'Creative IR must contain brand tokens');
    requirePresent(ctx, ir.designTokens, 'designTokens', 'Creative IR must contain design tokens');

    if (!Array.isArray(ir.stories) || ir.stories.length === 0) {
      addError(ctx, {
        code: 'STORIES_EMPTY',
        message: 'Creative IR must contain at least one story',
        path: 'stories',
        severity: 'critical',
      });
    }

    for (const [ratio] of enumerate(ir.campaign?.aspectRatios ?? [])) {
      if (!SUPPORTED_ASPECT_RATIOS.has(ratio)) {
        addError(ctx, {
          code: 'ENUM_ASPECT_RATIO',
          message: `Unsupported aspect ratio "${ratio}"`,
          path: 'campaign.aspectRatios',
          severity: 'high',
        });
      }
    }
  }

  // ==========================================================================
  // Semantic
  // ==========================================================================

  private checkSemantic(ir: CreativeIR, ctx: MutableContext): void {
    // Temporal consistency
    if (ir.createdAt && ir.updatedAt && ir.createdAt > ir.updatedAt) {
      addSemantic(ctx, {
        code: 'TEMPORAL_CONSISTENCY',
        message: 'createdAt must be less than or equal to updatedAt',
        path: 'updatedAt',
        severity: 'high',
      });
    }

    // Referential integrity for asset requests referenced by shots.
    const assetRequestIds = new Set(ir.assetRequests.map((request) => request.id as string));

    for (const [story, storyIndex] of enumerate(ir.stories)) {
      this.checkStory(story, storyIndex, assetRequestIds, ctx);
    }

    // Every declared asset request must point at a real shot.
    const shotIds = collectShotIds(ir.stories);
    for (const [request, index] of enumerate(ir.assetRequests)) {
      if (!shotIds.has(request.shotId as string)) {
        addSemantic(ctx, {
          code: 'REFERENTIAL_INTEGRITY',
          message: `Asset request "${request.id}" references unknown shot "${request.shotId}"`,
          path: `assetRequests[${index}].shotId`,
          severity: 'high',
        });
      }
    }
  }

  private checkStory(
    story: Story,
    storyIndex: number,
    assetRequestIds: Set<string>,
    ctx: MutableContext,
  ): void {
    const base = `stories[${storyIndex}]`;
    if (story.durationFrames <= 0) {
      addSemantic(ctx, {
        code: 'LOGICAL_CONSTRAINTS',
        message: `Story "${story.title}" must have a positive durationFrames`,
        path: `${base}.durationFrames`,
        severity: 'medium',
      });
    }
    if (story.storyboards.length === 0) {
      addSemantic(ctx, {
        code: 'LOGICAL_CONSTRAINTS',
        message: `Story "${story.title}" must contain at least one storyboard`,
        path: `${base}.storyboards`,
        severity: 'high',
      });
    }

    for (const [storyboard, sbIndex] of enumerate(story.storyboards)) {
      this.checkStoryboard(storyboard, `${base}.storyboards[${sbIndex}]`, assetRequestIds, ctx);
    }
  }

  private checkStoryboard(
    storyboard: Storyboard,
    base: string,
    assetRequestIds: Set<string>,
    ctx: MutableContext,
  ): void {
    if (storyboard.scenes.length === 0) {
      addSemantic(ctx, {
        code: 'LOGICAL_CONSTRAINTS',
        message: `Storyboard "${storyboard.title}" must contain at least one scene`,
        path: `${base}.scenes`,
        severity: 'high',
      });
    }
    for (const [scene, sceneIndex] of enumerate(storyboard.scenes)) {
      this.checkScene(scene, `${base}.scenes[${sceneIndex}]`, assetRequestIds, ctx);
    }
  }

  private checkScene(
    scene: Scene,
    base: string,
    assetRequestIds: Set<string>,
    ctx: MutableContext,
  ): void {
    if (scene.shots.length === 0) {
      addSemantic(ctx, {
        code: 'LOGICAL_CONSTRAINTS',
        message: `Scene "${scene.title}" must contain at least one shot`,
        path: `${base}.shots`,
        severity: 'high',
      });
    }
    if (durationToSeconds(scene.duration) <= 0) {
      addSemantic(ctx, {
        code: 'LOGICAL_CONSTRAINTS',
        message: `Scene "${scene.title}" must have a positive duration`,
        path: `${base}.duration`,
        severity: 'medium',
      });
    }
    for (const [shot, shotIndex] of enumerate(scene.shots)) {
      this.checkShot(shot, `${base}.shots[${shotIndex}]`, assetRequestIds, ctx);
    }
  }

  private checkShot(
    shot: Shot,
    base: string,
    assetRequestIds: Set<string>,
    ctx: MutableContext,
  ): void {
    if (durationToSeconds(shot.duration) <= 0) {
      addSemantic(ctx, {
        code: 'LOGICAL_CONSTRAINTS',
        message: `Shot "${shot.id}" must have a positive duration`,
        path: `${base}.duration`,
        severity: 'medium',
      });
    }
    for (const [assetId, refIndex] of enumerate(shot.assetRequests)) {
      if (!assetRequestIds.has(assetId)) {
        addSemantic(ctx, {
          code: 'REFERENTIAL_INTEGRITY',
          message: `Shot "${shot.id}" references unknown asset request "${assetId}"`,
          path: `${base}.assetRequests[${refIndex}]`,
          severity: 'high',
        });
      }
    }
  }

  // ==========================================================================
  // Compiler
  // ==========================================================================

  private checkCompiler(ir: CreativeIR, ctx: MutableContext): void {
    // Path completeness: story -> storyboard -> scene -> shot must be fully traceable.
    const hasCompletePath = ir.stories.some((story) =>
      story.storyboards.some((sb) => sb.scenes.some((scene) => scene.shots.length > 0)),
    );
    if (!hasCompletePath) {
      addWarning(ctx, {
        code: 'PATH_COMPLETENESS',
        message: 'No complete story → storyboard → scene → shot path was found',
        path: 'stories',
      });
    }

    // Asset resolution: every asset request needs a non-empty specification.
    for (const [request, index] of enumerate(ir.assetRequests)) {
      if (!request.specifications || request.specifications.description.trim().length === 0) {
        addWarning(ctx, {
          code: 'ASSET_RESOLUTION',
          message: `Asset request "${request.id}" is missing a specification description`,
          path: `assetRequests[${index}].specifications`,
        });
      }
    }
  }
}

// ============================================================================
// Helpers
// ============================================================================

function collectShotIds(stories: Story[]): Set<string> {
  const ids = new Set<string>();
  for (const story of stories) {
    for (const storyboard of story.storyboards) {
      for (const scene of storyboard.scenes) {
        for (const shot of scene.shots) {
          ids.add(shot.id as string);
        }
      }
    }
  }
  return ids;
}

function durationToSeconds(duration: { minutes: number; seconds: number }): number {
  return duration.minutes * 60 + duration.seconds;
}

/** Index helper that satisfies `noUncheckedIndexedAccess` without repeated guards. */
function* enumerate<T>(items: readonly T[]): Generator<[T, number]> {
  for (let i = 0; i < items.length; i += 1) {
    yield [items[i] as T, i];
  }
}

function requirePresent(
  ctx: MutableContext,
  value: unknown,
  path: string,
  message: string,
): void {
  if (value === undefined || value === null || value === '') {
    addError(ctx, { code: 'REQUIRED_FIELD', message, path, severity: 'critical' });
  }
}

function addError(ctx: MutableContext, error: ValidationError): void {
  ctx.errors.push(error);
}

function addWarning(ctx: MutableContext, warning: ValidationWarning): void {
  ctx.warnings.push(warning);
}

/** In PERMISSIVE mode semantic failures degrade to warnings instead of errors. */
function addSemantic(ctx: MutableContext, error: ValidationError): void {
  if (ctx.mode === ValidationMode.PERMISSIVE) {
    ctx.warnings.push({ code: error.code, message: error.message, path: error.path });
  } else {
    ctx.errors.push(error);
  }
}

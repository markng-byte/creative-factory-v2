/**
 * Creative Intermediate Representation (Creative IR) Package
 *
 * Exports all public types, interfaces, and utilities for working with Creative IR.
 *
 * Creative IR is the canonical, machine-readable representation of every creative artifact
 * produced by the Creative Factory.
 *
 * @packageDocumentation
 */

import type {
  CreativeIRId,
  StoryId,
  StoryboardId,
  SceneId,
  ShotId,
  AssetRequestId,
  ReviewId,
} from './types.js';

export const CREATIVE_IR_PACKAGE = '@creative-factory/creative-ir' as const;
export const CREATIVE_IR_VERSION = '1.0.0' as const;

// Core Types
export * from './types.js';

// Compiler Interface
export * from './compiler.js';

// Adapter Interface
export * from './adapter.js';

// Validation
export * from './validation.js';

// Validator Implementation
export * from './validator.js';

// ============================================================================
// Marker Functions for Type Branding
// ============================================================================

function brandId(id: string, label: string): string {
  const normalized = id.trim();
  if (normalized.length === 0) {
    throw new Error(`${label} cannot be empty`);
  }
  return normalized;
}

/**
 * Create a branded CreativeIR ID
 */
export function createCreativeIRId(id: string): CreativeIRId {
  return brandId(id, 'CreativeIRId') as CreativeIRId;
}

/**
 * Create a branded Story ID
 */
export function createStoryId(id: string): StoryId {
  return brandId(id, 'StoryId') as StoryId;
}

/**
 * Create a branded Storyboard ID
 */
export function createStoryboardId(id: string): StoryboardId {
  return brandId(id, 'StoryboardId') as StoryboardId;
}

/**
 * Create a branded Scene ID
 */
export function createSceneId(id: string): SceneId {
  return brandId(id, 'SceneId') as SceneId;
}

/**
 * Create a branded Shot ID
 */
export function createShotId(id: string): ShotId {
  return brandId(id, 'ShotId') as ShotId;
}

/**
 * Create a branded AssetRequest ID
 */
export function createAssetRequestId(id: string): AssetRequestId {
  return brandId(id, 'AssetRequestId') as AssetRequestId;
}

/**
 * Create a branded Review ID
 */
export function createReviewId(id: string): ReviewId {
  return brandId(id, 'ReviewId') as ReviewId;
}

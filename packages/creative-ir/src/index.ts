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

// ============================================================================
// Marker Functions for Type Branding
// ============================================================================

/**
 * Create a branded CreativeIR ID
 */
export function createCreativeIRId(id: string) {
  return id as any;
}

/**
 * Create a branded Story ID
 */
export function createStoryId(id: string) {
  return id as any;
}

/**
 * Create a branded Storyboard ID
 */
export function createStoryboardId(id: string) {
  return id as any;
}

/**
 * Create a branded Scene ID
 */
export function createSceneId(id: string) {
  return id as any;
}

/**
 * Create a branded Shot ID
 */
export function createShotId(id: string) {
  return id as any;
}

/**
 * Create a branded AssetRequest ID
 */
export function createAssetRequestId(id: string) {
  return id as any;
}

/**
 * Create a branded Review ID
 */
export function createReviewId(id: string) {
  return id as any;
}

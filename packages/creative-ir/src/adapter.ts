/**
 * Creative IR Output Adapter Interface
 *
 * Output adapters transform Creative IR into provider-specific or format-specific artifacts.
 * Examples: storyboard HTML, scene specifications, prompt packages, image generation requests, etc.
 *
 * Key Principle: Adapters NEVER modify Creative IR. They only read and transform it.
 */

import type { CreativeIR } from './types.js';
import type { ValidationMode } from './validation.js';

export interface CreativeIRAdapter {
  readonly name: string;
  readonly version: string;
  readonly supportedOutputFormats: string[];
  readonly capabilities: AdapterCapability[];

  transform(creativeIR: CreativeIR, options: AdapterOptions): Promise<AdapterOutput>;
  validate(creativeIR: CreativeIR): AdapterValidationResult;
}

export interface AdapterCapability {
  readonly feature: string;
  readonly level: 'required' | 'optional' | 'unsupported';
  readonly notes?: string;
}

export interface AdapterOptions {
  readonly outputFormat: string;
  readonly targetPlatform?: string;
  readonly includeMetadata: boolean;
  readonly validationMode: ValidationMode;
  readonly parameters: Record<string, unknown>;
}

export interface AdapterOutput {
  readonly artifacts: OutputArtifact[];
  readonly metadata: AdapterMetadata;
  readonly warnings: string[];
}

export interface OutputArtifact {
  readonly name: string;
  readonly format: string;
  readonly content: Buffer | string;
  readonly mimeType: string;
  readonly size?: number;
}

export interface AdapterMetadata {
  readonly adapterName: string;
  readonly adapterVersion: string;
  readonly processedAt: string;
  readonly transformRules: string[];
  readonly customizations: Record<string, unknown>;
}

export interface AdapterValidationResult {
  readonly isValid: boolean;
  readonly errors: AdapterValidationError[];
  readonly warnings: AdapterValidationWarning[];
}

export interface AdapterValidationError {
  readonly code: string;
  readonly message: string;
  readonly severity: 'critical' | 'high' | 'medium';
  readonly suggestion?: string;
}

export interface AdapterValidationWarning {
  readonly code: string;
  readonly message: string;
}

// ============================================================================
// Adapter Registry
// ============================================================================

export interface AdapterRegistry {
  register(adapter: CreativeIRAdapter): void;
  unregister(name: string): void;
  get(name: string): CreativeIRAdapter | undefined;
  list(): AdapterInfo[];
  listByCapability(capability: string): AdapterInfo[];
}

export interface AdapterInfo {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly capabilities: AdapterCapability[];
  readonly supportedOutputFormats: string[];
}

// ============================================================================
// Built-in Adapter Types
// ============================================================================

/**
 * Storyboard HTML Adapter
 * Transforms Creative IR into human-readable HTML storyboards
 */
export interface StoryboardHTMLAdapter extends CreativeIRAdapter {
  readonly name: 'storyboard-html';
}

/**
 * Scene Specification Adapter
 * Transforms Creative IR into scene specification documents
 */
export interface SceneSpecificationAdapter extends CreativeIRAdapter {
  readonly name: 'scene-spec';
}

/**
 * Shot List Adapter
 * Transforms Creative IR into shot list JSON
 */
export interface ShotListAdapter extends CreativeIRAdapter {
  readonly name: 'shot-list';
}

/**
 * Motion Specification Adapter
 * Transforms Creative IR into motion specification documents
 */
export interface MotionSpecAdapter extends CreativeIRAdapter {
  readonly name: 'motion-spec';
}

/**
 * Prompt Translation Adapter
 * Transforms Creative IR into provider-specific prompt packages
 * This is where provider coupling happens - NEVER in Creative IR itself
 */
export interface PromptTranslationAdapter extends CreativeIRAdapter {
  readonly name: 'prompt-translation';
}

/**
 * Image Generation Request Adapter
 * Transforms Creative IR into image generation request batches
 */
export interface ImageGenerationAdapter extends CreativeIRAdapter {
  readonly name: 'image-generation';
}

/**
 * Video Generation Request Adapter
 * Transforms Creative IR into video generation request batches
 */
export interface VideoGenerationAdapter extends CreativeIRAdapter {
  readonly name: 'video-generation';
}

/**
 * QA Specification Adapter
 * Transforms Creative IR into QA specification documents
 */
export interface QASpecificationAdapter extends CreativeIRAdapter {
  readonly name: 'qa-spec';
}

/**
 * Export Package Adapter
 * Transforms Creative IR into complete export packages
 */
export interface ExportPackageAdapter extends CreativeIRAdapter {
  readonly name: 'export-package';
}

/**
 * Creative IR Compiler Interface
 *
 * The Creative IR Compiler transforms source artifacts (Business Brief, Brand Config, Campaign Context)
 * into a machine-readable Creative IR document, which is then compiled by output adapters into
 * production artifacts.
 */

import type { CreativeIR, ValidationStatus } from './types.js';

export interface CompilerRequest {
  readonly creativeBriefId: string;
  readonly brandId: string;
  readonly campaignId: string;
  readonly reviewFeedback?: ReviewFeedback[];
  readonly adapterFilters?: string[];
  readonly validationMode: ValidationMode;
}

export interface ReviewFeedback {
  readonly reviewId: string;
  readonly applicableSince: string;
  readonly priority: number;
}

export enum ValidationMode {
  STRICT = 'strict',
  PERMISSIVE = 'permissive',
  DRAFT = 'draft',
}

export interface CompilerOutput {
  readonly creativeIR: CreativeIR;
  readonly adapterOutputs: Map<string, AdapterOutput>;
  readonly compilation: CompileReport;
}

export interface CompileReport {
  readonly success: boolean;
  readonly duration: number;
  readonly adapterResults: Record<string, AdapterCompileResult>;
  readonly warnings: string[];
  readonly errors: string[];
}

export interface AdapterCompileResult {
  readonly status: 'success' | 'partial' | 'skipped' | 'failed';
  readonly artifactCount: number;
  readonly duration: number;
  readonly errors?: string[];
}

export interface SchemaDefinition {
  readonly version: string;
  readonly schema: Record<string, unknown>;
  readonly exampleDocument?: CreativeIR;
}

export interface CreativeIRCompiler {
  compile(request: CompilerRequest): Promise<CompilerOutput>;
  validate(ir: CreativeIR, mode?: ValidationMode): ValidationStatus;
  getSchema(): SchemaDefinition;
  getAdapters(): AdapterInfo[];
}

export interface AdapterOutput {
  readonly format: string;
  readonly artifacts: OutputArtifact[];
  readonly metadata: Record<string, unknown>;
  readonly warnings: string[];
}

export interface OutputArtifact {
  readonly name: string;
  readonly format: string;
  readonly content: Buffer | string;
  readonly mimeType: string;
  readonly size: number;
}

export interface AdapterInfo {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly capabilities: AdapterCapability[];
  readonly supportedOutputFormats: string[];
}

export interface AdapterCapability {
  readonly feature: string;
  readonly level: 'required' | 'optional' | 'unsupported';
  readonly notes?: string;
}

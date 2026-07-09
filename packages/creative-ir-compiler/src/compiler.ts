/**
 * Standard Creative IR Compiler.
 *
 * Orchestrates the full compile: resolve inputs through source ports → build a Creative IR via
 * the planning pipeline → validate it → run any registered output adapters. It implements the
 * canonical {@link CreativeIRCompiler} interface from `@creative-factory/creative-ir`, and it is
 * completely provider-neutral: no AI provider is ever contacted.
 */

import {
  StandardCreativeIRValidator,
  ValidationMode,
  type AdapterInfo,
  type AdapterOptions,
  type AdapterOutput,
  type CompileReport,
  type CompilerOutput,
  type CompilerRequest,
  type CreativeIR,
  type CreativeIRAdapter,
  type CreativeIRCompiler,
  type CreativeIRValidator,
  type SchemaDefinition,
  type ValidationStatus,
  type AdapterCompileResult,
} from '@creative-factory/creative-ir';
import type {
  BrandTokensSource,
  CampaignSource,
  CompileInputs,
  CreativeBriefSource,
} from './ports.js';
import { buildCreativeIR } from './pipeline.js';
import { SystemClock, type Clock } from './support/clock.js';
import { DeterministicIdGenerator, type IdGenerator } from './support/id.js';
import { EMITTED_SCHEMA_VERSION } from './version.js';

export interface CompilerDependencies {
  readonly briefs: CreativeBriefSource;
  readonly campaigns: CampaignSource;
  readonly brands: BrandTokensSource;
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
  readonly validator?: CreativeIRValidator;
  readonly adapters?: readonly CreativeIRAdapter[];
  readonly seed?: string;
}

export class CompilationError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'CompilationError';
  }
}

export class StandardCreativeIRCompiler implements CreativeIRCompiler {
  private readonly briefs: CreativeBriefSource;
  private readonly campaigns: CampaignSource;
  private readonly brands: BrandTokensSource;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;
  private readonly validator: CreativeIRValidator;
  private readonly adapters: readonly CreativeIRAdapter[];
  private readonly seed: string;

  constructor(deps: CompilerDependencies) {
    this.briefs = deps.briefs;
    this.campaigns = deps.campaigns;
    this.brands = deps.brands;
    this.clock = deps.clock ?? new SystemClock();
    this.seed = deps.seed ?? 'creative-factory';
    this.ids = deps.ids ?? new DeterministicIdGenerator(this.seed);
    this.validator = deps.validator ?? new StandardCreativeIRValidator(() => this.clock.now());
    this.adapters = deps.adapters ?? [];
  }

  async compile(request: CompilerRequest): Promise<CompilerOutput> {
    const startedAt = Date.now();
    const inputs = await this.resolveInputs(request);

    const draft = buildCreativeIR(inputs, {
      ids: this.ids,
      clock: this.clock,
      seed: this.seed,
    });

    const validationStatus = this.validator.validate(draft, request.validationMode);
    const creativeIR: CreativeIR = { ...draft, validationStatus };

    const { adapterOutputs, adapterResults, warnings, errors } = await this.runAdapters(
      creativeIR,
      request,
    );

    const compilation: CompileReport = {
      success: validationStatus.isValid && errors.length === 0,
      duration: Date.now() - startedAt,
      adapterResults,
      warnings: [...warnings, ...validationStatus.warnings.map((w) => w.message)],
      errors: [...errors, ...validationStatus.errors.map((e) => e.message)],
    };

    return { creativeIR, adapterOutputs, compilation };
  }

  validate(ir: CreativeIR, mode: ValidationMode = ValidationMode.STRICT): ValidationStatus {
    return this.validator.validate(ir, mode);
  }

  getSchema(): SchemaDefinition {
    return {
      version: EMITTED_SCHEMA_VERSION,
      schema: this.validator.getSchema(),
    };
  }

  getAdapters(): AdapterInfo[] {
    return this.adapters.map((adapter) => ({
      name: adapter.name,
      version: adapter.version,
      description: `${adapter.name} output adapter`,
      capabilities: adapter.capabilities,
      supportedOutputFormats: adapter.supportedOutputFormats,
    }));
  }

  private async resolveInputs(request: CompilerRequest): Promise<CompileInputs> {
    const brief = await this.briefs.getById(request.creativeBriefId);
    if (!brief) {
      throw new CompilationError(
        `Creative brief "${request.creativeBriefId}" could not be resolved`,
        'BRIEF_NOT_FOUND',
      );
    }
    const campaign = await this.campaigns.getById(request.campaignId);
    if (!campaign) {
      throw new CompilationError(
        `Campaign "${request.campaignId}" could not be resolved`,
        'CAMPAIGN_NOT_FOUND',
      );
    }
    const brand = await this.brands.getById(request.brandId);
    if (!brand) {
      throw new CompilationError(
        `Brand tokens "${request.brandId}" could not be resolved`,
        'BRAND_NOT_FOUND',
      );
    }
    return { brief, campaign, brand, reviewFeedback: request.reviewFeedback };
  }

  private async runAdapters(
    creativeIR: CreativeIR,
    request: CompilerRequest,
  ): Promise<{
    adapterOutputs: Map<string, AdapterOutput>;
    adapterResults: Record<string, AdapterCompileResult>;
    warnings: string[];
    errors: string[];
  }> {
    const adapterOutputs = new Map<string, AdapterOutput>();
    const adapterResults: Record<string, AdapterCompileResult> = {};
    const warnings: string[] = [];
    const errors: string[] = [];

    const selected = request.adapterFilters
      ? this.adapters.filter((adapter) => request.adapterFilters?.includes(adapter.name))
      : this.adapters;

    for (const adapter of selected) {
      const started = Date.now();
      const pre = adapter.validate(creativeIR);
      if (!pre.isValid) {
        adapterResults[adapter.name] = {
          status: 'skipped',
          artifactCount: 0,
          duration: Date.now() - started,
          errors: pre.errors.map((error) => error.message),
        };
        warnings.push(`Adapter "${adapter.name}" skipped: input did not validate`);
        continue;
      }
      try {
        const output = await adapter.transform(creativeIR, this.optionsFor(adapter, request));
        adapterOutputs.set(adapter.name, output);
        adapterResults[adapter.name] = {
          status: 'success',
          artifactCount: output.artifacts.length,
          duration: Date.now() - started,
        };
        warnings.push(...output.warnings);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        adapterResults[adapter.name] = {
          status: 'failed',
          artifactCount: 0,
          duration: Date.now() - started,
          errors: [message],
        };
        errors.push(`Adapter "${adapter.name}" failed: ${message}`);
      }
    }

    return { adapterOutputs, adapterResults, warnings, errors };
  }

  private optionsFor(adapter: CreativeIRAdapter, request: CompilerRequest): AdapterOptions {
    return {
      outputFormat: adapter.supportedOutputFormats[0] ?? 'json',
      includeMetadata: true,
      validationMode: request.validationMode,
      parameters: {},
    };
  }
}

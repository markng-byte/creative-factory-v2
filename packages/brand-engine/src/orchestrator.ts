/**
 * Brand Engine Orchestrator
 *
 * Coordinates the full brand import, validation, and tokenization workflow.
 */

import type {
  BrandProfile,
  BrandImportResult,
  BrandValidationResult,
  BrandPackageId,
  BrandProfileId,
} from '@creative-factory/domain';

export interface BrandEngineConfig {
  readonly maxFileSize: number;
  readonly supportedFormats: string[];
  readonly validationStrict: boolean;
  readonly autoTokenize: boolean;
}

export interface BrandImportOptions {
  readonly validateOnImport: boolean;
  readonly tokenizeOnImport: boolean;
  readonly persistProfile: boolean;
}

export interface BrandEngineWorkflow {
  readonly packageId: BrandPackageId;
  readonly importResult: BrandImportResult;
  readonly validationResult?: BrandValidationResult;
  readonly profile?: BrandProfile;
  readonly status: WorkflowStatus;
  readonly errors: string[];
}

export enum WorkflowStatus {
  IMPORT_PENDING = 'import-pending',
  IMPORT_SUCCESS = 'import-success',
  IMPORT_FAILED = 'import-failed',
  VALIDATION_PENDING = 'validation-pending',
  VALIDATION_SUCCESS = 'validation-success',
  VALIDATION_FAILED = 'validation-failed',
  TOKENIZATION_PENDING = 'tokenization-pending',
  TOKENIZATION_SUCCESS = 'tokenization-success',
  TOKENIZATION_FAILED = 'tokenization-failed',
  COMPLETE = 'complete',
}

export interface BrandEngineOrchestrator {
  /**
   * Import a brand package from various formats
   */
  importBrand(
    input: BrandPackageInput,
    options?: Partial<BrandImportOptions>,
  ): Promise<BrandImportResult>;

  /**
   * Validate an imported brand package
   */
  validateBrand(packageId: BrandPackageId): Promise<BrandValidationResult>;

  /**
   * Generate tokens from a validated brand profile
   */
  tokenizeBrand(packageId: BrandPackageId): Promise<BrandProfile>;

  /**
   * Full workflow: import + validate + tokenize
   */
  processBrandPackage(
    input: BrandPackageInput,
    options?: Partial<BrandImportOptions>,
  ): Promise<BrandEngineWorkflow>;

  /**
   * Get a brand profile by ID
   */
  getBrandProfile(profileId: BrandProfileId): Promise<BrandProfile | null>;

  /**
   * List all available brand profiles
   */
  listBrandProfiles(): Promise<BrandProfile[]>;

  /**
   * Delete a brand profile
   */
  deleteBrandProfile(profileId: BrandProfileId): Promise<boolean>;

  /**
   * Export brand profile in specific format
   */
  exportBrandProfile(profileId: BrandProfileId, format: ExportFormat): Promise<string>;
}

export interface BrandPackageInput {
  readonly name: string;
  readonly description: string;
  readonly format: string;
  readonly content: string | Buffer;
  readonly metadata?: Record<string, unknown>;
}

export enum ExportFormat {
  JSON = 'json',
  YAML = 'yaml',
  TYPESCRIPT = 'typescript',
  FIGMA_TOKENS = 'figma-tokens',
}

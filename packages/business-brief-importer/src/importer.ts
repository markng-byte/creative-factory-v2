import type { BusinessBriefInput } from '@creative-factory/domain';

/**
 * Business Brief Import Result
 */
export interface BusinessBriefImportResult {
  readonly success: boolean;
  readonly briefId?: string;
  readonly brief?: BusinessBriefInput;
  readonly errors: ImportError[];
  readonly warnings: ImportWarning[];
  readonly metadata: ImportMetadata;
}

export interface ImportError {
  readonly field?: string;
  readonly message: string;
  readonly severity: 'critical' | 'high' | 'medium';
  readonly suggestion?: string;
}

export interface ImportWarning {
  readonly field?: string;
  readonly message: string;
}

export interface ImportMetadata {
  readonly importedAt: string;
  readonly importer: string;
  readonly importTime: number;
  readonly fieldsProcessed: number;
}

/**
 * Business Brief Importer Interface
 * Plugins implement this to support different input formats
 */
export interface BusinessBriefImporter {
  readonly format: string;
  import(
    id: string,
    content: string | object,
    metadata?: Record<string, unknown>,
  ): Promise<BusinessBriefImportResult>;
}

/**
 * Validation rule for business brief fields
 */
export interface ValidationRule {
  readonly field: string;
  readonly type: 'required' | 'format' | 'range' | 'enum' | 'custom';
  readonly description: string;
  validate(value: unknown): { valid: boolean; error?: string };
}

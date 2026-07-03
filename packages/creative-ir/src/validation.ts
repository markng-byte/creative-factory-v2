/**
 * Creative IR Validation
 *
 * Provides validation for Creative IR documents against the schema.
 */

import type { CreativeIR, ValidationStatus, ValidationError, ValidationWarning } from './types.js';

export enum ValidationMode {
  /**
   * STRICT: All validation rules enforced
   * - Required fields must be present
   * - Types must match exactly
   * - Semantic constraints enforced
   * - Referential integrity checked
   */
  STRICT = 'strict',

  /**
   * PERMISSIVE: Warnings only for non-critical issues
   * - Required fields enforced
   * - Types enforced
   * - Semantic constraints produce warnings, not errors
   */
  PERMISSIVE = 'permissive',

  /**
   * DRAFT: Minimal validation (development only)
   * - Basic type checking
   * - No semantic validation
   * - Useful for in-progress documents
   */
  DRAFT = 'draft',
}

export interface CreativeIRValidator {
  /**
   * Validate a Creative IR document
   */
  validate(ir: CreativeIR, mode?: ValidationMode): ValidationStatus;

  /**
   * Get the JSON schema for validation
   */
  getSchema(): Record<string, unknown>;

  /**
   * Validate against a specific version of the schema
   */
  validateVersion(ir: CreativeIR, schemaVersion: string, mode?: ValidationMode): ValidationStatus;
}

export interface ValidationContext {
  readonly mode: ValidationMode;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
}

// ============================================================================
// Validation Rules
// ============================================================================

export const STRUCTURAL_VALIDATION_RULES = {
  /**
   * All fields must have correct types
   */
  TYPE_CHECKING: 'type-checking',

  /**
   * All required fields must be present
   */
  REQUIRED_FIELDS: 'required-fields',

  /**
   * Enum values must match predefined sets
   */
  ENUM_VALIDATION: 'enum-validation',
};

export const SEMANTIC_VALIDATION_RULES = {
  /**
   * All referenced IDs must resolve to existing entities
   */
  REFERENTIAL_INTEGRITY: 'referential-integrity',

  /**
   * Temporal consistency: createdAt ≤ updatedAt
   */
  TEMPORAL_CONSISTENCY: 'temporal-consistency',

  /**
   * Logical constraints:
   * - Shot count > 0
   * - Duration > 0
   * - AspectRatios supported
   */
  LOGICAL_CONSTRAINTS: 'logical-constraints',

  /**
   * Visual elements match brand guidelines
   */
  BRAND_COMPLIANCE: 'brand-compliance',
};

export const COMPILER_VALIDATION_RULES = {
  /**
   * All story/storyboard/scene/shot paths must be traceable
   */
  PATH_COMPLETENESS: 'path-completeness',

  /**
   * All asset requests must have clear specifications
   */
  ASSET_RESOLUTION: 'asset-resolution',

  /**
   * All necessary approvals must be present for export
   */
  APPROVAL_CHAIN: 'approval-chain',
};

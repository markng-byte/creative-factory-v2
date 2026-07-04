/**
 * Brand Validator
 *
 * Validates brand packages and profiles against rules.
 */

import type {
  BrandPackage,
  BrandProfile,
  BrandValidationResult,
  BrandValidationError,
  BrandValidationWarning,
} from '@creative-factory/domain';

export interface BrandValidator {
  validatePackage(pkg: BrandPackage): BrandValidationResult;
  validateProfile(profile: BrandProfile): BrandValidationResult;
}

export interface ValidationRule {
  readonly name: string;
  readonly description: string;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  validate(subject: BrandPackage | BrandProfile): ValidationIssue[];
}

export interface ValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  readonly path?: string;
  readonly suggestion?: string;
}

export class StandardBrandValidator implements BrandValidator {
  private rules: ValidationRule[] = [];

  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  validatePackage(pkg: BrandPackage): BrandValidationResult {
    const allIssues: ValidationIssue[] = [];

    for (const rule of this.rules) {
      const issues = rule.validate(pkg);
      allIssues.push(...issues);
    }

    const errors = allIssues
      .filter((i) => i.severity !== 'low')
      .map(
        (i): BrandValidationError => ({
          code: i.code,
          message: i.message,
          severity: i.severity as 'critical' | 'high' | 'medium',
          path: i.path,
          suggestion: i.suggestion,
        }),
      );

    const warnings = allIssues
      .filter((i) => i.severity === 'low')
      .map(
        (i): BrandValidationWarning => ({
          code: i.code,
          message: i.message,
          path: i.path,
        }),
      );

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        validatedAt: new Date().toISOString(),
        validator: 'standard-brand-validator',
        validationTime: 0,
        rulesChecked: this.rules.length,
        rulesPasssed: this.rules.length - errors.length,
      },
    };
  }

  validateProfile(profile: BrandProfile): BrandValidationResult {
    const errors: BrandValidationError[] = [];
    const warnings: BrandValidationWarning[] = [];

    // Required fields
    if (!profile.name) {
      errors.push({
        code: 'MISSING_NAME',
        message: 'Brand profile must have a name',
        severity: 'critical',
      });
    }

    if (!profile.colorPalette?.primaryColors?.length) {
      errors.push({
        code: 'MISSING_COLORS',
        message: 'Brand must define primary colors',
        severity: 'high',
      });
    }

    if (!profile.typography?.families?.length) {
      warnings.push({
        code: 'MISSING_TYPOGRAPHY',
        message: 'Brand should define typography system',
      });
    }

    // Validate color accessibility
    if (profile.colorPalette?.primaryColors) {
      for (const color of profile.colorPalette.primaryColors) {
        if (color.accessibility?.wcagAACompliant === false) {
          warnings.push({
            code: 'COLOR_ACCESSIBILITY',
            message: `Color ${color.name} does not meet WCAG AA standards`,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        validatedAt: new Date().toISOString(),
        validator: 'standard-brand-validator',
        validationTime: 0,
        rulesChecked: 5,
        rulesPasssed: 5 - errors.length,
      },
    };
  }
}

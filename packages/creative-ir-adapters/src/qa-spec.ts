/**
 * QA Specification Adapter.
 *
 * Emits a QA checklist derived from the Creative IR: brand-compliance checks (from brand tokens
 * and prohibited elements), accessibility/constraint checks (from creative context), and
 * structural completeness checks. Downstream QA engines execute these; this adapter only
 * declares them.
 */

import type { AdapterCapability, AdapterOptions, CreativeIR } from '@creative-factory/creative-ir';
import { BaseAdapter, eachScene, type BuildResult } from './base.js';

interface QACheck {
  readonly id: string;
  readonly category: 'brand' | 'accessibility' | 'structural' | 'constraint';
  readonly target: string;
  readonly assertion: string;
  readonly severity: 'critical' | 'high' | 'medium';
}

export class StandardQASpecAdapter extends BaseAdapter {
  readonly name = 'qa-spec' as const;
  readonly version = '1.0.0';
  readonly supportedOutputFormats = ['json'];
  readonly capabilities: AdapterCapability[] = [
    { feature: 'brand-compliance-checks', level: 'required' },
    { feature: 'accessibility-checks', level: 'optional' },
  ];

  protected build(creativeIR: CreativeIR, _options: AdapterOptions): BuildResult {
    const checks: QACheck[] = [];

    // Brand compliance: prohibited elements must not appear.
    for (const prohibited of creativeIR.brandTokens.prohibitedElements) {
      checks.push({
        id: `brand-prohibited-${slug(prohibited.description)}`,
        category: 'brand',
        target: 'all-shots',
        assertion: `Must not contain: ${prohibited.description}`,
        severity: 'high',
      });
    }

    // Brand compliance: primary palette must be present.
    checks.push({
      id: 'brand-palette-present',
      category: 'brand',
      target: 'color-grading',
      assertion: `Uses brand palette (${creativeIR.brandTokens.primaryColors
        .map((color) => color.hex)
        .join(', ')})`,
      severity: 'medium',
    });

    // Constraint checks lifted from the creative context.
    for (const constraint of creativeIR.creativeContext.constraints) {
      checks.push({
        id: `constraint-${slug(constraint.description)}`,
        category: constraint.type === 'technical' ? 'accessibility' : 'constraint',
        target: 'deliverable',
        assertion: constraint.description,
        severity: constraint.impact === 'blocking' ? 'critical' : 'medium',
      });
    }

    // Structural completeness: every shot must have at least one asset request.
    for (const { scene } of eachScene(creativeIR)) {
      for (const shot of scene.shots) {
        if (shot.assetRequests.length === 0) {
          checks.push({
            id: `structural-shot-assets-${shot.id}`,
            category: 'structural',
            target: shot.id,
            assertion: 'Shot must resolve at least one asset request',
            severity: 'high',
          });
        }
      }
    }

    const content = this.json({
      creativeIRId: creativeIR.id,
      checkCount: checks.length,
      checks,
    });

    return {
      artifacts: [this.artifact('qa-spec.json', 'json', content, 'application/json')],
      warnings: [],
      transformRules: ['brand-compliance', 'constraint-lift', 'structural-completeness'],
    };
  }
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

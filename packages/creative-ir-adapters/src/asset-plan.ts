/**
 * Asset Plan Adapter.
 *
 * Emits the consolidated asset plan: every asset the downstream generation engines must produce,
 * grouped by type, with per-shot traceability. No asset is generated here.
 */

import type {
  AdapterCapability,
  AdapterOptions,
  AssetRequest,
  CreativeIR,
} from '@creative-factory/creative-ir';
import { BaseAdapter, type BuildResult } from './base.js';

export class StandardAssetPlanAdapter extends BaseAdapter {
  readonly name = 'asset-plan' as const;
  readonly version = '1.0.0';
  readonly supportedOutputFormats = ['json'];
  readonly capabilities: AdapterCapability[] = [
    { feature: 'asset-inventory', level: 'required' },
    { feature: 'group-by-type', level: 'optional' },
  ];

  protected build(creativeIR: CreativeIR, _options: AdapterOptions): BuildResult {
    const byType = new Map<string, AssetRequest[]>();
    for (const request of creativeIR.assetRequests) {
      const bucket = byType.get(request.assetType) ?? [];
      bucket.push(request);
      byType.set(request.assetType, bucket);
    }

    const groups = [...byType.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([assetType, requests]) => ({
        assetType,
        count: requests.length,
        requests: requests.map((request) => ({
          assetRequestId: request.id,
          shotId: request.shotId,
          priority: request.priority,
          description: request.specifications.description,
          dimensions: request.specifications.dimensions,
          format: request.specifications.format,
          quality: request.specifications.quality,
          qaStatus: request.qaStatus,
        })),
      }));

    const content = this.json({
      creativeIRId: creativeIR.id,
      totalAssets: creativeIR.assetRequests.length,
      groups,
    });

    return {
      artifacts: [this.artifact('asset-plan.json', 'json', content, 'application/json')],
      warnings:
        creativeIR.assetRequests.length === 0 ? ['Creative IR declares no asset requests'] : [],
      transformRules: ['group-by-type', 'stable-type-ordering'],
    };
  }
}

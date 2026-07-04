/**
 * JSON Brand Importer
 *
 * Imports brand packages from JSON format.
 */

import type { BrandPackage, BrandPackageId, BrandComponent } from '@creative-factory/domain';
import { BrandSourceFormat } from '@creative-factory/domain';
import type { BrandImporter } from './importer.js';

export class JSONBrandImporter implements BrandImporter {
  readonly name = 'json-importer';
  readonly version = '1.0.0';
  readonly supportedFormats = ['json', 'application/json'];
  readonly description = 'Imports brand packages from JSON format';

  canHandle(format: string, content: string | Buffer): boolean {
    if (!this.supportedFormats.includes(format.toLowerCase())) {
      return false;
    }
    try {
      const str = typeof content === 'string' ? content : content.toString();
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  async import(
    id: BrandPackageId,
    name: string,
    content: string | Buffer,
    metadata?: Record<string, unknown>,
  ): Promise<BrandPackage> {
    try {
      const str = typeof content === 'string' ? content : content.toString();
      const data = JSON.parse(str);

      return {
        id,
        name,
        version: data.version || '1.0.0',
        description: data.description || '',
        sourceFormat: BrandSourceFormat.JSON,
        metadata: { ...metadata, ...data.metadata },
        components: (data.components as BrandComponent[]) || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to import JSON brand package: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

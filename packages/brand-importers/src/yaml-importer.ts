/**
 * YAML Brand Importer
 *
 * Imports brand packages from YAML format.
 */

import { load as parseYAML } from 'js-yaml';
import type { BrandPackage, BrandPackageId, BrandComponent } from '@creative-factory/domain';
import { BrandSourceFormat } from '@creative-factory/domain';
import type { BrandImporter } from './importer.js';

export class YAMLBrandImporter implements BrandImporter {
  readonly name = 'yaml-importer';
  readonly version = '1.0.0';
  readonly supportedFormats = ['yaml', 'yml', 'application/yaml', 'application/x-yaml'];
  readonly description = 'Imports brand packages from YAML format';

  canHandle(format: string, content: string | Buffer): boolean {
    if (!this.supportedFormats.includes(format.toLowerCase())) {
      return false;
    }
    try {
      const str = typeof content === 'string' ? content : content.toString();
      parseYAML(str);
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
      const data = parseYAML(str) as Record<string, unknown>;

      return {
        id,
        name,
        version: (data.version as string) || '1.0.0',
        description: (data.description as string) || '',
        sourceFormat: BrandSourceFormat.YAML,
        metadata: { ...metadata, ...(data.metadata as Record<string, unknown>) },
        components: (data.components as BrandComponent[]) || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to import YAML brand package: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

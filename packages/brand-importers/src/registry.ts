/**
 * Importer Registry Implementation
 *
 * Manages available brand importers.
 */

import type { BrandImporter, ImporterRegistry, ImporterInfo } from './importer.js';

export class StandardImporterRegistry implements ImporterRegistry {
  private readonly importers: Map<string, BrandImporter> = new Map();

  register(importer: BrandImporter): void {
    this.importers.set(importer.name, importer);
  }

  unregister(name: string): void {
    this.importers.delete(name);
  }

  get(name: string): BrandImporter | undefined {
    return this.importers.get(name);
  }

  findByFormat(format: string, content: string | Buffer): BrandImporter | undefined {
    for (const importer of this.importers.values()) {
      if (importer.canHandle(format, content)) {
        return importer;
      }
    }
    return undefined;
  }

  list(): ImporterInfo[] {
    return Array.from(this.importers.values()).map((importer) => ({
      name: importer.name,
      version: importer.version,
      supportedFormats: importer.supportedFormats,
      description: importer.description,
    }));
  }
}

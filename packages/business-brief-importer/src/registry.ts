import type { BusinessBriefImporter } from './importer.js';

/**
 * Business Brief Importer Registry
 * Manages pluggable importers for different business brief formats
 */
export interface IBusinessBriefImporterRegistry {
  register(importer: BusinessBriefImporter): void;
  unregister(format: string): void;
  get(format: string): BusinessBriefImporter | undefined;
  getAll(): BusinessBriefImporter[];
  supports(format: string): boolean;
}

export class StandardBusinessBriefImporterRegistry implements IBusinessBriefImporterRegistry {
  private importers = new Map<string, BusinessBriefImporter>();

  register(importer: BusinessBriefImporter): void {
    if (this.importers.has(importer.format)) {
      throw new Error(`Importer for format '${importer.format}' is already registered`);
    }
    this.importers.set(importer.format, importer);
  }

  unregister(format: string): void {
    this.importers.delete(format);
  }

  get(format: string): BusinessBriefImporter | undefined {
    return this.importers.get(format);
  }

  getAll(): BusinessBriefImporter[] {
    return Array.from(this.importers.values());
  }

  supports(format: string): boolean {
    return this.importers.has(format);
  }
}

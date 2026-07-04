/**
 * Brand Importer Interface and Registry
 *
 * Defines the pluggable architecture for brand package importers.
 */

import type { BrandPackage, BrandPackageId } from '@creative-factory/domain';

export interface BrandImporter {
  readonly name: string;
  readonly version: string;
  readonly supportedFormats: string[];
  readonly description: string;

  canHandle(format: string, content: string | Buffer): boolean;
  import(
    id: BrandPackageId,
    name: string,
    content: string | Buffer,
    metadata?: Record<string, unknown>,
  ): Promise<BrandPackage>;
}

export interface ImporterOptions {
  readonly strict: boolean;
  readonly timeout: number;
  readonly maxSize: number;
}

export interface ImporterRegistry {
  register(importer: BrandImporter): void;
  unregister(name: string): void;
  get(name: string): BrandImporter | undefined;
  findByFormat(format: string, content: string | Buffer): BrandImporter | undefined;
  list(): ImporterInfo[];
}

export interface ImporterInfo {
  readonly name: string;
  readonly version: string;
  readonly supportedFormats: string[];
  readonly description: string;
}

export enum BrandFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  YAML = 'yaml',
  PDF = 'pdf',
  FIGMA = 'figma',
  CUSTOM = 'custom',
}

/**
 * Brand Importers Package
 *
 * Pluggable importers for brand packages in various formats.
 */

export const BRAND_IMPORTERS_PACKAGE = '@creative-factory/brand-importers' as const;
export const BRAND_IMPORTERS_VERSION = '1.0.0' as const;

export * from './importer.js';
export * from './registry.js';
export * from './json-importer.js';
export * from './yaml-importer.js';
export * from './markdown-importer.js';

// Built-in importers
export function getDefaultImporters() {
  const { JSONBrandImporter } = require('./json-importer.js');
  const { YAMLBrandImporter } = require('./yaml-importer.js');
  const { MarkdownBrandImporter } = require('./markdown-importer.js');

  return [new JSONBrandImporter(), new YAMLBrandImporter(), new MarkdownBrandImporter()];
}

import { describe, it, expect } from 'vitest';

import { BRAND_IMPORTERS_PACKAGE, BRAND_IMPORTERS_VERSION } from '../index.js';
import { StandardImporterRegistry } from '../registry.js';
import { JSONBrandImporter } from '../json-importer.js';

describe('Brand Importers Package', () => {
  it('should export package constants', () => {
    expect(BRAND_IMPORTERS_PACKAGE).toBe('@creative-factory/brand-importers');
    expect(BRAND_IMPORTERS_VERSION).toBe('1.0.0');
  });

  it('should support JSON import', async () => {
    const importer = new JSONBrandImporter();
    expect(importer.name).toBe('json-importer');
    expect(importer.supportedFormats).toContain('json');

    const jsonContent = JSON.stringify({
      version: '1.0.0',
      description: 'Test brand',
      components: [],
    });

    expect(importer.canHandle('json', jsonContent)).toBe(true);
  });

  it('should maintain importer registry', () => {
    const registry = new StandardImporterRegistry();
    const importer = new JSONBrandImporter();

    registry.register(importer);
    expect(registry.get('json-importer')).toBe(importer);
    expect(registry.list()).toHaveLength(1);

    registry.unregister('json-importer');
    expect(registry.get('json-importer')).toBeUndefined();
  });
});

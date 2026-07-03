import { describe, it, expect } from 'vitest';
import { JSONBusinessBriefImporter } from './json-importer.js';
import { YAMLBusinessBriefImporter } from './yaml-importer.js';
import { StandardBusinessBriefImporterRegistry } from './registry.js';

describe('Business Brief Importers', () => {
  describe('JSONBusinessBriefImporter', () => {
    it('should import valid JSON business brief', async () => {
      const importer = new JSONBusinessBriefImporter();

      const content = {
        id: 'brief-1',
        campaignGoal: 'Increase brand awareness',
        industry: 'Technology',
        valueProposition: 'Best in class product',
        targetAudience: { age: '25-45' },
      };

      const result = await importer.import('brief-1', content);

      expect(result.success).toBe(true);
      expect(result.brief).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid JSON string', async () => {
      const importer = new JSONBusinessBriefImporter();
      const result = await importer.import('brief-1', 'invalid json {');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject missing required fields', async () => {
      const importer = new JSONBusinessBriefImporter();

      const content = {
        id: 'brief-1',
        // missing campaignGoal, industry, valueProposition
      };

      const result = await importer.import('brief-1', content);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('YAMLBusinessBriefImporter', () => {
    it('should import valid YAML business brief', async () => {
      const importer = new YAMLBusinessBriefImporter();

      const content = `
id: brief-1
campaignGoal: Increase brand awareness
industry: Technology
valueProposition: Best in class product
targetAudience:
  age: 25-45
`;

      const result = await importer.import('brief-1', content);

      expect(result.success).toBe(true);
      expect(result.brief).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid YAML', async () => {
      const importer = new YAMLBusinessBriefImporter();
      const content = 'invalid: yaml: content:';

      const result = await importer.import('brief-1', content);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('StandardBusinessBriefImporterRegistry', () => {
    it('should register and retrieve importers', () => {
      const registry = new StandardBusinessBriefImporterRegistry();
      const jsonImporter = new JSONBusinessBriefImporter();

      registry.register(jsonImporter);

      expect(registry.supports('json')).toBe(true);
      expect(registry.get('json')).toBe(jsonImporter);
    });

    it('should throw on duplicate registration', () => {
      const registry = new StandardBusinessBriefImporterRegistry();
      const importer = new JSONBusinessBriefImporter();

      registry.register(importer);

      expect(() => registry.register(importer)).toThrow();
    });

    it('should list all registered importers', () => {
      const registry = new StandardBusinessBriefImporterRegistry();
      const jsonImporter = new JSONBusinessBriefImporter();
      const yamlImporter = new YAMLBusinessBriefImporter();

      registry.register(jsonImporter);
      registry.register(yamlImporter);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
    });

    it('should unregister importers', () => {
      const registry = new StandardBusinessBriefImporterRegistry();
      const importer = new JSONBusinessBriefImporter();

      registry.register(importer);
      expect(registry.supports('json')).toBe(true);

      registry.unregister('json');
      expect(registry.supports('json')).toBe(false);
    });
  });
});

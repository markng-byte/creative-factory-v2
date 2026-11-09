/**
 * File-system brand source.
 *
 * Reads brand plugins from `plugins/brands/<slug>/brand.json` (each a BrandTokensBundle) and serves
 * them by `brandTokens.brandId`. Read-only. Folders starting with `_` (templates) are skipped.
 * A malformed plugin fails loudly at load time rather than producing a half-branded campaign.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BrandTokensBundle, BrandTokensSource } from '../ports.js';

export class BrandPluginError extends Error {
  constructor(
    readonly plugin: string,
    readonly reason: string,
  ) {
    super(`Brand plugin "${plugin}" is invalid: ${reason}`);
    this.name = 'BrandPluginError';
  }
}

const ARRAYS = [
  'primaryColors',
  'secondaryColors',
  'accentColors',
  'typography',
  'logoVariations',
  'imageryGuidelines',
  'prohibitedElements',
] as const;

function validate(plugin: string, value: unknown): BrandTokensBundle {
  const bundle = value as Partial<BrandTokensBundle> | null;
  const tokens = bundle?.brandTokens as unknown as Record<string, unknown> | undefined;
  if (!tokens || typeof tokens !== 'object')
    throw new BrandPluginError(plugin, 'missing brandTokens');
  if (typeof tokens['brandId'] !== 'string' || tokens['brandId'] === '')
    throw new BrandPluginError(plugin, 'missing brandTokens.brandId');
  if (typeof tokens['brandName'] !== 'string')
    throw new BrandPluginError(plugin, 'missing brandTokens.brandName');
  for (const key of ARRAYS) {
    if (!Array.isArray(tokens[key]))
      throw new BrandPluginError(plugin, `brandTokens.${key} must be an array`);
  }
  for (const color of [
    ...(tokens['primaryColors'] as { hex?: unknown }[]),
    ...(tokens['accentColors'] as { hex?: unknown }[]),
  ]) {
    if (typeof color.hex !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color.hex))
      throw new BrandPluginError(plugin, 'colour hex must be #RRGGBB');
  }
  if (!bundle?.designTokens || typeof bundle.designTokens !== 'object')
    throw new BrandPluginError(plugin, 'missing designTokens');
  return bundle as BrandTokensBundle;
}

export class FileSystemBrandTokensSource implements BrandTokensSource {
  private cache: Promise<Map<string, BrandTokensBundle>> | undefined;

  constructor(private readonly pluginsDir: string) {}

  /** Load every plugin once; throws BrandPluginError on the first malformed one. */
  load(): Promise<Map<string, BrandTokensBundle>> {
    this.cache ??= (async () => {
      const out = new Map<string, BrandTokensBundle>();
      const entries = await readdir(this.pluginsDir, { withFileTypes: true });
      for (const entry of entries
        .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
        .sort((a, b) => a.name.localeCompare(b.name))) {
        let raw: string;
        try {
          raw = await readFile(join(this.pluginsDir, entry.name, 'brand.json'), 'utf8');
        } catch {
          continue; // a folder without brand.json is not a brand plugin
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          throw new BrandPluginError(entry.name, 'brand.json is not valid JSON');
        }
        const bundle = validate(entry.name, parsed);
        if (out.has(bundle.brandTokens.brandId))
          throw new BrandPluginError(entry.name, `duplicate brandId ${bundle.brandTokens.brandId}`);
        out.set(bundle.brandTokens.brandId, bundle);
      }
      return out;
    })();
    return this.cache;
  }

  async getById(brandId: string): Promise<BrandTokensBundle | undefined> {
    return (await this.load()).get(brandId);
  }
}

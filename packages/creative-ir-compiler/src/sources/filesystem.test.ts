import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ValidationMode } from '@creative-factory/creative-ir';
import { StandardCreativeIRCompiler } from '../compiler.js';
import { FixedClock } from '../support/clock.js';
import { DeterministicIdGenerator } from '../support/id.js';
import { exampleCampaign, exampleCreativeBrief } from '../examples.js';
import { InMemoryCampaignSource, InMemoryCreativeBriefSource } from './in-memory.js';
import { BrandPluginError, FileSystemBrandTokensSource } from './filesystem.js';

const PLUGINS = resolve(__dirname, '../../../../plugins/brands');

describe('FileSystemBrandTokensSource', () => {
  it('loads the One IBC plugin from plugins/brands and skips _template', async () => {
    const source = new FileSystemBrandTokensSource(PLUGINS);
    const brands = await source.load();
    expect([...brands.keys()]).toEqual(['brand-one-ibc']);
    const oneIbc = await source.getById('brand-one-ibc');
    expect(oneIbc?.brandTokens.primaryColors[0]?.hex).toBe('#F0F0F2');
    expect(oneIbc?.brandTokens.accentColors[0]?.hex).toBe('#8B0000');
    expect(oneIbc?.brandTokens.voiceAndTone.doNotUse).toContain('tax haven');
    expect(await source.getById('brand-missing')).toBeUndefined();
  });

  it('compiles a Creative IR with the One IBC brand', async () => {
    const campaign = exampleCampaign();
    const brief = { ...exampleCreativeBrief(), brandProfileId: 'brand-one-ibc' };
    const compiler = new StandardCreativeIRCompiler({
      briefs: new InMemoryCreativeBriefSource([brief]),
      campaigns: new InMemoryCampaignSource([campaign]),
      brands: new FileSystemBrandTokensSource(PLUGINS),
      clock: new FixedClock('2026-11-09T00:00:00.000Z'),
      ids: new DeterministicIdGenerator('one-ibc-test'),
    });
    const { creativeIR } = await compiler.compile({
      creativeBriefId: brief.id,
      brandId: 'brand-one-ibc',
      campaignId: campaign.id,
      validationMode: ValidationMode.STRICT,
    });
    expect(creativeIR.brandTokens.brandId).toBe('brand-one-ibc');
  });

  it('fails loudly on a malformed plugin', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'brands-'));
    await mkdir(join(dir, 'broken'));
    await writeFile(
      join(dir, 'broken', 'brand.json'),
      JSON.stringify({ brandTokens: { brandId: 'x', brandName: 'X' } }),
    );
    await expect(new FileSystemBrandTokensSource(dir).load()).rejects.toBeInstanceOf(
      BrandPluginError,
    );
  });
});

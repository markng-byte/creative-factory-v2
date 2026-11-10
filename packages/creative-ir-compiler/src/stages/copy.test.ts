import { describe, expect, it } from 'vitest';
import { ValidationMode } from '@creative-factory/creative-ir';
import { StandardCreativeIRCompiler } from '../compiler.js';
import { exampleBrandBundle, exampleCampaign, exampleCreativeBrief } from '../examples.js';
import {
  InMemoryBrandTokensSource,
  InMemoryCampaignSource,
  InMemoryCreativeBriefSource,
} from '../sources/in-memory.js';
import { FixedClock } from '../support/clock.js';
import { DeterministicIdGenerator } from '../support/id.js';
import { compilerCopy } from './copy.js';

async function storyboard(languages: string[]) {
  const brand = exampleBrandBundle();
  const compiler = new StandardCreativeIRCompiler({
    briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: new InMemoryCampaignSource([{ ...exampleCampaign(), languages }]),
    brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    clock: new FixedClock('2026-07-01T00:00:00.000Z'),
    ids: new DeterministicIdGenerator('test-seed'),
  });
  const { creativeIR } = await compiler.compile({
    creativeBriefId: 'brief-northwind-001',
    brandId: 'brand-northwind',
    campaignId: 'campaign-northwind-q3',
    validationMode: ValidationMode.STRICT,
  });
  return creativeIR.stories[0]!.storyboards[0]!;
}

describe('compiler copy follows the campaign language', () => {
  it('writes beat titles and connective phrases in Vietnamese for a vi campaign; brief content is untouched', async () => {
    const board = await storyboard(['vi']);
    const text = board.scenes.map((s) => `${s.title}: ${s.narrativeText}`);
    expect(board.scenes.map((s) => s.title)).toEqual([
      'Mở đầu',
      'Vấn đề',
      'Chứng minh',
      'Thông điệp chính',
      'Kết',
      'Kêu gọi',
    ]);
    expect(text.join(' ')).not.toMatch(
      /We open|A tension emerges|stakes rise|peak intensity|tension resolves/,
    );
    expect(text[3]).toBe(
      'Thông điệp chính: Điều quan trọng nhất: See the whole story your data is telling',
    );
    expect(text[5]).toBe('Kêu gọi: Start a free Northwind Insight trial.');
  });

  it('keeps English for an en campaign and for unknown languages', async () => {
    const en = await storyboard(['en']);
    expect(en.scenes[0]!.title).toBe('Setup');
    expect(en.scenes[0]!.narrativeText.startsWith("We open in the audience's world.")).toBe(true);
    expect(compilerCopy('fr')).toBe(compilerCopy('en'));
    expect(compilerCopy('vi-VN')).toBe(compilerCopy('vi'));
  });
});

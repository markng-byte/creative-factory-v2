import { describe, expect, it } from 'vitest';
import { ValidationMode } from '@creative-factory/creative-ir';
import { StandardCreativeIRCompiler } from '../compiler.js';
import { FixedClock } from '../support/clock.js';
import { DeterministicIdGenerator } from '../support/id.js';
import { exampleBrandBundle, exampleCampaign, exampleCreativeBrief } from '../examples.js';
import {
  GoogleSheetsBrandTokensSource,
  GoogleSheetsCampaignSource,
  GoogleSheetsCreativeBriefSource,
  SheetSourceError,
  parseCsv,
  sheetCsvUrl,
  type FetchLike,
} from './google-sheets.js';

const cell = (s: string) => `"${s.replace(/"/g, '""')}"`;
const csv = (rows: [string, unknown][]) =>
  ['id,json', ...rows.map(([id, v]) => `${cell(id)},${cell(JSON.stringify(v))}`)].join('\r\n');

function fakeSheets(tabs: Record<string, string>): { fetch: FetchLike; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    fetch: async (url) => {
      calls.push(url);
      const gid = new URL(url).searchParams.get('gid') ?? '';
      const body = tabs[gid];
      return {
        ok: body !== undefined,
        status: body === undefined ? 404 : 200,
        text: async () => body ?? '',
      };
    },
  };
}

describe('Google Sheets sources', () => {
  it('parses RFC 4180 CSV with quotes, doubled quotes and newlines in cells', () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi""\nthere"\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"\nthere'],
    ]);
    expect(sheetCsvUrl({ sheetId: 'S1', gid: '7' })).toBe(
      'https://docs.google.com/spreadsheets/d/S1/export?format=csv&gid=7',
    );
  });

  it('feeds the compiler from three sheet tabs, loading each tab once', async () => {
    const brief = exampleCreativeBrief();
    const campaign = exampleCampaign();
    const brand = exampleBrandBundle();
    const sheets = fakeSheets({
      '1': csv([[brief.id, brief]]),
      '2': csv([[campaign.id, campaign]]),
      '3': csv([[brand.brandTokens.brandId, brand]]),
    });
    const briefs = new GoogleSheetsCreativeBriefSource({ sheetId: 'S', gid: '1' }, sheets.fetch);
    const compiler = new StandardCreativeIRCompiler({
      briefs,
      campaigns: new GoogleSheetsCampaignSource({ sheetId: 'S', gid: '2' }, sheets.fetch),
      brands: new GoogleSheetsBrandTokensSource({ sheetId: 'S', gid: '3' }, sheets.fetch),
      clock: new FixedClock('2026-11-09T00:00:00.000Z'),
      ids: new DeterministicIdGenerator('sheets-test'),
    });
    const { creativeIR } = await compiler.compile({
      creativeBriefId: brief.id,
      brandId: brand.brandTokens.brandId,
      campaignId: campaign.id,
      validationMode: ValidationMode.STRICT,
    });
    expect(creativeIR.campaign.id).toBe(campaign.id);
    await briefs.getById(brief.id);
    expect(sheets.calls.filter((u) => u.endsWith('gid=1'))).toHaveLength(1);
  });

  it('fails loudly on a bad header, bad JSON, an id that does not match the JSON, or HTTP errors', async () => {
    const brief = exampleCreativeBrief();
    const tab = (body: string) =>
      new GoogleSheetsCreativeBriefSource(
        { sheetId: 'S', gid: '1' },
        fakeSheets({ '1': body }).fetch,
      );
    await expect(tab('name,value\nx,y').getById('x')).rejects.toMatchObject({
      code: 'SHEET_BAD_HEADER',
    });
    await expect(tab('id,json\nb1,{not json').getById('b1')).rejects.toMatchObject({
      code: 'SHEET_BAD_JSON',
    });
    await expect(tab(csv([['other-id', brief]])).getById('other-id')).rejects.toMatchObject({
      code: 'SHEET_ID_MISMATCH',
    });
    const missing = new GoogleSheetsCreativeBriefSource(
      { sheetId: 'S', gid: '9' },
      fakeSheets({}).fetch,
    );
    await expect(missing.getById('x')).rejects.toBeInstanceOf(SheetSourceError);
  });
});

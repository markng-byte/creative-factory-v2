import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { exampleCreativeBrief } from '@creative-factory/creative-ir-compiler';
import { createCreativeFactoryMcpServer } from './server.js';
import { buildSources } from './sources.js';
import { ONE_IBC_IDS } from './one-ibc.js';
import type { StoredRun } from './server.js';

const BRANDS_DIR = fileURLToPath(new URL('../../../plugins/brands', import.meta.url));

describe('buildSources (environment wiring)', () => {
  it('falls back to the worked example when nothing is configured', async () => {
    const s = buildSources({ CF_SHEET_ID: ' ', CF_BRANDS_DIR: '' });
    expect(await s.briefs.getById(s.defaults.briefId)).toBeDefined();
    expect(await s.brands.getById(s.defaults.brandId)).toBeDefined();
  });

  it('reads the One IBC brand plugin from CF_BRANDS_DIR and compiles with it', async () => {
    const s = buildSources({ CF_BRANDS_DIR: BRANDS_DIR, CF_DEFAULT_BRAND_ID: 'brand-one-ibc' });
    expect((await s.brands.getById('brand-one-ibc'))?.brandTokens.brandName).toBeTruthy();
    const server = createCreativeFactoryMcpServer(s);
    const [a, b] = InMemoryTransport.createLinkedPair();
    await server.connect(a);
    const client = new Client({ name: 't', version: '0' });
    await client.connect(b);
    const r = await client.callTool({
      name: 'compile_creative_ir',
      arguments: { hook_id: 'H1', hook_text: 'x' },
    });
    expect(r.isError).not.toBe(true);
  });

  it('CF_PROFILE=one-ibc: One IBC brand (spec section 7), provisional brief, WhatsApp CTA without a phone number', async () => {
    const s = buildSources({ CF_PROFILE: 'one-ibc' });
    expect(s.defaults).toEqual({
      briefId: ONE_IBC_IDS.briefId,
      campaignId: ONE_IBC_IDS.campaignId,
      brandId: ONE_IBC_IDS.brandId,
    });
    const brand = (await s.brands.getById('brand-one-ibc'))!.brandTokens;
    expect(brand.primaryColors[0]!.hex).toBe('#F0F0F2');
    expect(brand.accentColors[0]!.hex).toBe('#8B0000');
    const brief = (await s.briefs.getById(ONE_IBC_IDS.briefId))!;
    expect(brief.desiredUserAction.primary.description).toBe('Nhắn One IBC qua WhatsApp');
    expect(JSON.stringify([brief.desiredUserAction, brief.emotionalDirection])).not.toMatch(
      /\d{6,}|\+\d/,
    );
    expect(JSON.stringify(brief.toneOfVoice)).toContain('Tạm');
    expect(brief.creativeConstraints.map((c) => c.description).join(' | ')).toContain(
      'Hook + câu 1 dưới 125 ký tự; Headline tối đa 40; Description tối đa 30',
    );
    const store = new Map<string, StoredRun>();
    const server = createCreativeFactoryMcpServer({ ...s, store });
    const [a, b] = InMemoryTransport.createLinkedPair();
    await server.connect(a);
    const client = new Client({ name: 't', version: '0' });
    await client.connect(b);
    const r = await client.callTool({
      name: 'compile_creative_ir',
      arguments: { hook_id: 'HK-01', hook_text: 'Mở công ty Hong Kong trong 7 ngày làm việc' },
    });
    expect(r.isError).not.toBe(true);
    const text = JSON.stringify(r.content);
    expect(text).toContain('Nhắn One IBC qua WhatsApp');
    expect(text).not.toContain('Northwind');
    expect(text).toContain('Kêu gọi: Nhắn One IBC qua WhatsApp');
    expect(text).not.toContain('We open');
    const ir = [...store.values()][0]!.ir;
    expect(JSON.stringify(ir)).toContain('#8B0000');
  });

  it('reads briefs from the Google Sheet tab named by CF_SHEET_ID and CF_BRIEFS_GID', async () => {
    const brief = exampleCreativeBrief();
    const urls: string[] = [];
    const csv = `id,json\n${brief.id},"${JSON.stringify(brief).replace(/"/g, '""')}"\n`;
    const s = buildSources({ CF_SHEET_ID: 'sheet-1', CF_BRIEFS_GID: '42' }, async (url) => {
      urls.push(url);
      return new Response(csv);
    });
    expect((await s.briefs.getById(brief.id))?.id).toBe(brief.id);
    expect(urls).toEqual([
      'https://docs.google.com/spreadsheets/d/sheet-1/export?format=csv&gid=42',
    ]);
  });
});

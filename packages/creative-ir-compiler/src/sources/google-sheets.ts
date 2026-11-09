/**
 * Google Sheets sources.
 *
 * Read-only adapters for the compiler's source ports, replacing the in-memory sources in
 * production. Each sheet tab holds one entity per row in two columns: `id` and `json` (the full
 * CreativeBrief, Campaign or BrandTokensBundle as JSON). Briefs and campaigns are deeply nested,
 * so a JSON cell keeps the sheet editable without a lossy flattening.
 *
 * The adapter reads the tab's CSV export
 * (https://docs.google.com/spreadsheets/d/<sheetId>/export?format=csv&gid=<gid>) through an
 * injected fetch, so tests run offline and a private sheet can be read through an authenticating
 * proxy. Rows are loaded once and cached; call `refresh()` to reload.
 */

import type { CreativeBrief } from '@creative-factory/domain';
import type { Campaign } from '@creative-factory/creative-ir';
import type {
  BrandTokensBundle,
  BrandTokensSource,
  CampaignSource,
  CreativeBriefSource,
} from '../ports.js';

export type FetchLike = (
  url: string,
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export interface SheetTab {
  readonly sheetId: string;
  readonly gid: string;
}

export class SheetSourceError extends Error {
  constructor(
    readonly code:
      | 'SHEET_FETCH_FAILED'
      | 'SHEET_BAD_HEADER'
      | 'SHEET_BAD_JSON'
      | 'SHEET_ID_MISMATCH',
    detail: string,
  ) {
    super(`${code}: ${detail}`);
    this.name = 'SheetSourceError';
  }
}

export function sheetCsvUrl(tab: SheetTab): string {
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(tab.sheetId)}/export?format=csv&gid=${encodeURIComponent(tab.gid)}`;
}

/** RFC 4180 CSV: quoted cells, doubled quotes, commas and newlines inside quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

class SheetJsonTable<T> {
  private cache: Promise<Map<string, T>> | undefined;

  constructor(
    private readonly tab: SheetTab,
    private readonly fetchImpl: FetchLike,
    private readonly idOf: (value: T) => string,
  ) {}

  refresh(): void {
    this.cache = undefined;
  }

  load(): Promise<Map<string, T>> {
    this.cache ??= (async () => {
      const url = sheetCsvUrl(this.tab);
      const res = await this.fetchImpl(url);
      if (!res.ok)
        throw new SheetSourceError(
          'SHEET_FETCH_FAILED',
          `HTTP ${res.status} for gid ${this.tab.gid}`,
        );
      const [header, ...rows] = parseCsv(await res.text());
      const idCol = header?.findIndex((h) => h.trim().toLowerCase() === 'id') ?? -1;
      const jsonCol = header?.findIndex((h) => h.trim().toLowerCase() === 'json') ?? -1;
      if (idCol < 0 || jsonCol < 0)
        throw new SheetSourceError('SHEET_BAD_HEADER', 'need columns "id" and "json"');
      const out = new Map<string, T>();
      rows.forEach((r, i) => {
        const id = (r[idCol] ?? '').trim();
        if (!id) return;
        let value: T;
        try {
          value = JSON.parse(r[jsonCol] ?? '') as T;
        } catch {
          throw new SheetSourceError('SHEET_BAD_JSON', `row ${i + 2}`);
        }
        if (this.idOf(value) !== id)
          throw new SheetSourceError('SHEET_ID_MISMATCH', `row ${i + 2}: id ${id}`);
        out.set(id, value);
      });
      return out;
    })();
    return this.cache;
  }
}

const defaultFetch: FetchLike = (url) => fetch(url);

export class GoogleSheetsCreativeBriefSource implements CreativeBriefSource {
  private readonly table: SheetJsonTable<CreativeBrief>;
  constructor(tab: SheetTab, fetchImpl: FetchLike = defaultFetch) {
    this.table = new SheetJsonTable(tab, fetchImpl, (b) => b.id);
  }
  refresh(): void {
    this.table.refresh();
  }
  async getById(id: string): Promise<CreativeBrief | undefined> {
    return (await this.table.load()).get(id);
  }
}

export class GoogleSheetsCampaignSource implements CampaignSource {
  private readonly table: SheetJsonTable<Campaign>;
  constructor(tab: SheetTab, fetchImpl: FetchLike = defaultFetch) {
    this.table = new SheetJsonTable(tab, fetchImpl, (c) => c.id);
  }
  refresh(): void {
    this.table.refresh();
  }
  async getById(id: string): Promise<Campaign | undefined> {
    return (await this.table.load()).get(id);
  }
}

export class GoogleSheetsBrandTokensSource implements BrandTokensSource {
  private readonly table: SheetJsonTable<BrandTokensBundle>;
  constructor(tab: SheetTab, fetchImpl: FetchLike = defaultFetch) {
    this.table = new SheetJsonTable(tab, fetchImpl, (b) => b.brandTokens.brandId);
  }
  refresh(): void {
    this.table.refresh();
  }
  async getById(brandId: string): Promise<BrandTokensBundle | undefined> {
    return (await this.table.load()).get(brandId);
  }
}

/**
 * Source wiring for the HTTP entry point, chosen by environment variables (one port, one adapter each):
 *   CF_BRANDS_DIR        brand plugins folder (plugins/brands) -> FileSystemBrandTokensSource
 *   CF_SHEET_ID          Google Sheet holding briefs, campaigns and (optionally) brands, one tab each:
 *   CF_BRIEFS_GID, CF_CAMPAIGNS_GID, CF_BRANDS_GID   tab ids (gid) of that sheet
 *   CF_DEFAULT_BRIEF_ID, CF_DEFAULT_CAMPAIGN_ID, CF_DEFAULT_BRAND_ID
 *   CF_PROFILE=one-ibc   One IBC defaults: the brand plugin plugins/brands/one-ibc (spec section 7 colours and
 *                        copy limits) plus a provisional One IBC brief and campaign (see one-ibc.ts)
 * Anything not configured falls back to the worked example, so the server always starts.
 * CF_BRANDS_DIR wins over CF_BRANDS_GID when both are set.
 */
import {
  FileSystemBrandTokensSource,
  GoogleSheetsBrandTokensSource,
  GoogleSheetsCampaignSource,
  GoogleSheetsCreativeBriefSource,
  InMemoryBrandTokensSource,
  InMemoryCampaignSource,
  InMemoryCreativeBriefSource,
  exampleBrandBundle,
  exampleCampaign,
  exampleCreativeBrief,
  type FetchLike,
} from '@creative-factory/creative-ir-compiler';
import type { CreativeFactoryMcpDeps } from './server.js';
import { ONE_IBC_IDS, oneIbcBrief, oneIbcCampaign } from './one-ibc.js';

/** The repo's brand plugins folder (packages/mcp-server/{src,dist} -> plugins/brands). */
export const REPO_BRANDS_DIR = new URL('../../../plugins/brands/', import.meta.url).pathname;

type Env = Record<string, string | undefined>;
const set = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);

export function buildSources(
  env: Env,
  fetchImpl?: FetchLike,
): Pick<CreativeFactoryMcpDeps, 'briefs' | 'campaigns' | 'brands' | 'defaults'> {
  const brand = exampleBrandBundle();
  const sheetId = set(env['CF_SHEET_ID']);
  const tab = (gid: string | undefined) =>
    sheetId && set(gid) ? { sheetId, gid: set(gid)! } : undefined;
  const briefsTab = tab(env['CF_BRIEFS_GID']);
  const campaignsTab = tab(env['CF_CAMPAIGNS_GID']);
  const brandsTab = tab(env['CF_BRANDS_GID']);
  const oneIbc = set(env['CF_PROFILE']) === 'one-ibc';
  const brandsDir =
    set(env['CF_BRANDS_DIR']) ?? (oneIbc && !brandsTab ? REPO_BRANDS_DIR : undefined);
  return {
    briefs: briefsTab
      ? new GoogleSheetsCreativeBriefSource(briefsTab, fetchImpl)
      : new InMemoryCreativeBriefSource([exampleCreativeBrief(), oneIbcBrief()]),
    campaigns: campaignsTab
      ? new GoogleSheetsCampaignSource(campaignsTab, fetchImpl)
      : new InMemoryCampaignSource([exampleCampaign(), oneIbcCampaign()]),
    brands: brandsDir
      ? new FileSystemBrandTokensSource(brandsDir)
      : brandsTab
        ? new GoogleSheetsBrandTokensSource(brandsTab, fetchImpl)
        : new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    defaults: {
      briefId:
        set(env['CF_DEFAULT_BRIEF_ID']) ??
        (oneIbc ? ONE_IBC_IDS.briefId : exampleCreativeBrief().id),
      campaignId:
        set(env['CF_DEFAULT_CAMPAIGN_ID']) ??
        (oneIbc ? ONE_IBC_IDS.campaignId : exampleCampaign().id),
      brandId:
        set(env['CF_DEFAULT_BRAND_ID']) ??
        (oneIbc ? ONE_IBC_IDS.brandId : brand.brandTokens.brandId),
    },
  };
}

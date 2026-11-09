/**
 * Source wiring for the HTTP entry point, chosen by environment variables (one port, one adapter each):
 *   CF_BRANDS_DIR        brand plugins folder (plugins/brands) -> FileSystemBrandTokensSource
 *   CF_SHEET_ID          Google Sheet holding briefs, campaigns and (optionally) brands, one tab each:
 *   CF_BRIEFS_GID, CF_CAMPAIGNS_GID, CF_BRANDS_GID   tab ids (gid) of that sheet
 *   CF_DEFAULT_BRIEF_ID, CF_DEFAULT_CAMPAIGN_ID, CF_DEFAULT_BRAND_ID
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
  const brandsDir = set(env['CF_BRANDS_DIR']);
  return {
    briefs: briefsTab
      ? new GoogleSheetsCreativeBriefSource(briefsTab, fetchImpl)
      : new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: campaignsTab
      ? new GoogleSheetsCampaignSource(campaignsTab, fetchImpl)
      : new InMemoryCampaignSource([exampleCampaign()]),
    brands: brandsDir
      ? new FileSystemBrandTokensSource(brandsDir)
      : brandsTab
        ? new GoogleSheetsBrandTokensSource(brandsTab, fetchImpl)
        : new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    defaults: {
      briefId: set(env['CF_DEFAULT_BRIEF_ID']) ?? exampleCreativeBrief().id,
      campaignId: set(env['CF_DEFAULT_CAMPAIGN_ID']) ?? exampleCampaign().id,
      brandId: set(env['CF_DEFAULT_BRAND_ID']) ?? brand.brandTokens.brandId,
    },
  };
}

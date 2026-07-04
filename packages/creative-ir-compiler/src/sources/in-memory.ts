/**
 * In-memory source-port implementations.
 *
 * Map-backed adapters for the compiler's source ports. They are the default wiring for tests,
 * examples, and local development, and demonstrate the ports contract without any database.
 */

import type { CreativeBrief } from '@creative-factory/domain';
import type { Campaign } from '@creative-factory/creative-ir';
import type {
  BrandTokensBundle,
  BrandTokensSource,
  CampaignSource,
  CreativeBriefSource,
} from '../ports.js';

export class InMemoryCreativeBriefSource implements CreativeBriefSource {
  private readonly store = new Map<string, CreativeBrief>();

  constructor(briefs: readonly CreativeBrief[] = []) {
    for (const brief of briefs) {
      this.store.set(brief.id, brief);
    }
  }

  async getById(id: string): Promise<CreativeBrief | undefined> {
    return this.store.get(id);
  }
}

export class InMemoryCampaignSource implements CampaignSource {
  private readonly store = new Map<string, Campaign>();

  constructor(campaigns: readonly Campaign[] = []) {
    for (const campaign of campaigns) {
      this.store.set(campaign.id, campaign);
    }
  }

  async getById(id: string): Promise<Campaign | undefined> {
    return this.store.get(id);
  }
}

export class InMemoryBrandTokensSource implements BrandTokensSource {
  private readonly store = new Map<string, BrandTokensBundle>();

  constructor(bundles: ReadonlyMap<string, BrandTokensBundle> = new Map()) {
    for (const [brandId, bundle] of bundles) {
      this.store.set(brandId, bundle);
    }
  }

  async getById(brandId: string): Promise<BrandTokensBundle | undefined> {
    return this.store.get(brandId);
  }
}

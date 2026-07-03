import type { CampaignPackage } from '@creative-factory/domain';

/**
 * Campaign Registry
 * Stores and retrieves campaign packages with versioning and metadata
 */
export interface ICampaignRegistry {
  store(campaign: CampaignPackage): Promise<void>;
  get(campaignId: string): Promise<CampaignPackage | undefined>;
  list(): Promise<CampaignPackage[]>;
  delete(campaignId: string): Promise<boolean>;
  exists(campaignId: string): Promise<boolean>;
  search(predicate: (campaign: CampaignPackage) => boolean): Promise<CampaignPackage[]>;
}

/**
 * Memory-based Campaign Registry
 * Suitable for development and testing
 */
export class MemoryCampaignRegistry implements ICampaignRegistry {
  private campaigns = new Map<string, CampaignPackage>();

  async store(campaign: CampaignPackage): Promise<void> {
    this.campaigns.set(campaign.campaignId, campaign);
  }

  async get(campaignId: string): Promise<CampaignPackage | undefined> {
    return this.campaigns.get(campaignId);
  }

  async list(): Promise<CampaignPackage[]> {
    return Array.from(this.campaigns.values());
  }

  async delete(campaignId: string): Promise<boolean> {
    return this.campaigns.delete(campaignId);
  }

  async exists(campaignId: string): Promise<boolean> {
    return this.campaigns.has(campaignId);
  }

  async search(predicate: (campaign: CampaignPackage) => boolean): Promise<CampaignPackage[]> {
    const results: CampaignPackage[] = [];
    for (const campaign of this.campaigns.values()) {
      if (predicate(campaign)) {
        results.push(campaign);
      }
    }
    return results;
  }
}

/**
 * Campaign Registry with Versioning
 * Tracks campaign versions and enables rollback
 */
export interface ICampaignRegistryWithVersioning extends ICampaignRegistry {
  getVersion(campaignId: string, versionNumber: number): Promise<CampaignPackage | undefined>;
  listVersions(campaignId: string): Promise<CampaignPackage[]>;
  rollback(campaignId: string, toVersionNumber: number): Promise<CampaignPackage | undefined>;
}

export class VersionedCampaignRegistry extends MemoryCampaignRegistry implements ICampaignRegistryWithVersioning {
  private versions = new Map<string, CampaignPackage[]>();

  override async store(campaign: CampaignPackage): Promise<void> {
    await super.store(campaign);

    // Track version history
    if (!this.versions.has(campaign.campaignId)) {
      this.versions.set(campaign.campaignId, []);
    }

    const versionHistory = this.versions.get(campaign.campaignId)!;
    versionHistory.push(campaign);
  }

  async getVersion(campaignId: string, versionNumber: number): Promise<CampaignPackage | undefined> {
    const versions = this.versions.get(campaignId);
    if (!versions || versionNumber < 1 || versionNumber > versions.length) {
      return undefined;
    }

    return versions[versionNumber - 1];
  }

  async listVersions(campaignId: string): Promise<CampaignPackage[]> {
    return this.versions.get(campaignId) || [];
  }

  async rollback(campaignId: string, toVersionNumber: number): Promise<CampaignPackage | undefined> {
    const versions = this.versions.get(campaignId);

    if (!versions || toVersionNumber < 1 || toVersionNumber > versions.length) {
      return undefined;
    }

    const targetVersion = versions[toVersionNumber - 1];
    await super.store(targetVersion);

    return targetVersion;
  }
}

/**
 * Brand Registry
 *
 * Stores and retrieves brand profiles.
 */

import type { BrandProfile, BrandProfileId, BrandId } from '@creative-factory/domain';

export interface BrandRegistry {
  /**
   * Store a brand profile
   */
  store(profile: BrandProfile): Promise<void>;

  /**
   * Retrieve a brand profile by ID
   */
  get(profileId: BrandProfileId): Promise<BrandProfile | null>;

  /**
   * Retrieve all profiles for a brand
   */
  getByBrandId(brandId: BrandId): Promise<BrandProfile[]>;

  /**
   * List all profiles
   */
  list(): Promise<BrandProfile[]>;

  /**
   * Delete a profile
   */
  delete(profileId: BrandProfileId): Promise<boolean>;

  /**
   * Check if profile exists
   */
  exists(profileId: BrandProfileId): Promise<boolean>;

  /**
   * Get profile metadata
   */
  getMetadata(profileId: BrandProfileId): Promise<ProfileMetadata | null>;
}

export interface ProfileMetadata {
  readonly profileId: BrandProfileId;
  readonly brandId: BrandId;
  readonly name: string;
  readonly version: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly status: string;
}

export class MemoryBrandRegistry implements BrandRegistry {
  private profiles: Map<string, BrandProfile> = new Map();

  async store(profile: BrandProfile): Promise<void> {
    this.profiles.set(profile.id, profile);
  }

  async get(profileId: BrandProfileId): Promise<BrandProfile | null> {
    return this.profiles.get(profileId) || null;
  }

  async getByBrandId(brandId: BrandId): Promise<BrandProfile[]> {
    return Array.from(this.profiles.values()).filter((p) => p.brandId === brandId);
  }

  async list(): Promise<BrandProfile[]> {
    return Array.from(this.profiles.values());
  }

  async delete(profileId: BrandProfileId): Promise<boolean> {
    return this.profiles.delete(profileId);
  }

  async exists(profileId: BrandProfileId): Promise<boolean> {
    return this.profiles.has(profileId);
  }

  async getMetadata(profileId: BrandProfileId): Promise<ProfileMetadata | null> {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;

    return {
      profileId,
      brandId: profile.brandId,
      name: profile.name,
      version: profile.version,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      status: profile.status,
    };
  }
}

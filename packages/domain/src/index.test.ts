import { describe, expect, it } from 'vitest';
import {
  createAspectRatio,
  createBrandId,
  createCampaignId,
  createContentHash,
  createOrganizationId,
  type Campaign,
} from './index.js';

describe('domain identity', () => {
  it('normalizes branded IDs and rejects empty values', () => {
    expect(createCampaignId(' campaign-1 ')).toBe('campaign-1');
    expect(() => createBrandId('   ')).toThrow('BrandId cannot be empty');
  });
});

describe('domain value objects', () => {
  it('accepts valid sha256 content hashes', () => {
    const hash = createContentHash('A'.repeat(64));
    expect(hash).toEqual({ algorithm: 'sha256', value: 'a'.repeat(64) });
  });

  it('rejects invalid aspect ratios', () => {
    expect(() => createAspectRatio(16, 9)).not.toThrow();
    expect(() => createAspectRatio(0, 9)).toThrow('AspectRatio dimensions');
  });
});

describe('campaign aggregate shape', () => {
  it('captures tenant, brand, and lifecycle boundaries', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const campaign: Campaign = {
      id: createCampaignId('campaign-1'),
      organizationId: createOrganizationId('org-1'),
      brandId: createBrandId('brand-1'),
      name: 'Launch Video',
      lifecycleState: 'DRAFT',
      createdAt: now,
      updatedAt: now,
    };

    expect(campaign.lifecycleState).toBe('DRAFT');
    expect(campaign.organizationId).toBe('org-1');
  });
});

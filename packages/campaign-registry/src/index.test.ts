import { describe, it, expect } from 'vitest';
import { MemoryCampaignRegistry, VersionedCampaignRegistry } from './registry.js';
import type { CampaignPackage } from '@creative-factory/domain';

const mockCampaign: CampaignPackage = {
  id: 'pkg-1' as any,
  campaignId: 'campaign-1',
  version: '1.0.0',
  status: 'draft',
  businessBrief: {
    id: 'brief-1',
    campaignGoal: 'Test campaign',
    industry: 'Tech',
    valueProposition: 'Great value',
    targetAudience: {},
    market: {},
    productsServices: [],
    competitivePositioning: '',
    campaignType: 'brand_awareness',
    communicationChannels: [],
    languages: [],
    regions: [],
    timeline: {},
    assetRequirements: [],
    businessConstraints: [],
    complianceRequirements: [],
    successMetrics: [],
  },
  creativeBrief: {
    id: 'cbrief-1' as any,
    campaignId: 'campaign-1',
    briefNumber: 1,
    version: '1.0.0',
    status: 'draft',
    campaignName: 'Test Campaign',
    campaignDuration: '1 month',
    businessContext: { company: 'Test Co', industry: 'Tech', product: 'Product', valueProposition: 'Value', marketPosition: 'Position' },
    objectives: [],
    targetAudience: { primarySegment: 'test', secondarySegments: [], keyPersonas: [], psychographics: [], mediaChannels: [] },
    keyMessages: [],
    toneAndVoice: [],
    emotionalDirection: 'positive',
    visualDirection: 'modern',
    desiredUserAction: [],
    successMetrics: [],
    deliverables: [],
    constraints: [],
    brandReferences: [],
    priorityMatrix: { criticalElements: [], importantElements: [], niceToHave: [] },
    metadata: { sourceObjectives: [], audienceModelVersion: '1.0', messagingFrameworkVersion: '1.0', channelStrategyVersion: '1.0', reviewCycles: 0, notes: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  validationResult: { valid: true, errors: [], warnings: [], metadata: { validatedAt: new Date().toISOString(), validator: 'test', validationTime: 100, rulesChecked: 5, rulesPassed: 5 } },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('CampaignRegistry', () => {
  describe('MemoryCampaignRegistry', () => {
    it('should store and retrieve campaigns', async () => {
      const registry = new MemoryCampaignRegistry();

      await registry.store(mockCampaign);

      const retrieved = await registry.get('campaign-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.campaignId).toBe('campaign-1');
    });

    it('should list all campaigns', async () => {
      const registry = new MemoryCampaignRegistry();

      await registry.store(mockCampaign);

      const campaigns = await registry.list();
      expect(campaigns).toHaveLength(1);
    });

    it('should check if campaign exists', async () => {
      const registry = new MemoryCampaignRegistry();

      await registry.store(mockCampaign);

      expect(await registry.exists('campaign-1')).toBe(true);
      expect(await registry.exists('nonexistent')).toBe(false);
    });

    it('should delete campaigns', async () => {
      const registry = new MemoryCampaignRegistry();

      await registry.store(mockCampaign);
      const deleted = await registry.delete('campaign-1');

      expect(deleted).toBe(true);
      expect(await registry.exists('campaign-1')).toBe(false);
    });

    it('should search campaigns by predicate', async () => {
      const registry = new MemoryCampaignRegistry();

      await registry.store(mockCampaign);

      const results = await registry.search((c) => c.status === 'draft');
      expect(results).toHaveLength(1);
    });
  });

  describe('VersionedCampaignRegistry', () => {
    it('should track campaign versions', async () => {
      const registry = new VersionedCampaignRegistry();

      const v1 = { ...mockCampaign, version: '1.0.0' };
      const v2 = { ...mockCampaign, version: '2.0.0' };

      await registry.store(v1);
      await registry.store(v2);

      const versions = await registry.listVersions('campaign-1');
      expect(versions).toHaveLength(2);
    });

    it('should retrieve specific version', async () => {
      const registry = new VersionedCampaignRegistry();

      const v1 = { ...mockCampaign, version: '1.0.0' };
      const v2 = { ...mockCampaign, version: '2.0.0' };

      await registry.store(v1);
      await registry.store(v2);

      const version1 = await registry.getVersion('campaign-1', 1);
      expect(version1?.version).toBe('1.0.0');
    });

    it('should rollback to previous version', async () => {
      const registry = new VersionedCampaignRegistry();

      const v1 = { ...mockCampaign, version: '1.0.0', status: 'draft' as const };
      const v2 = { ...mockCampaign, version: '2.0.0', status: 'approved' as const };

      await registry.store(v1);
      await registry.store(v2);

      const rolledBack = await registry.rollback('campaign-1', 1);
      expect(rolledBack?.status).toBe('draft');
    });
  });
});

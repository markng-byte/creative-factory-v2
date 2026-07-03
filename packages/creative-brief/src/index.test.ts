import { describe, it, expect } from 'vitest';
import { StandardCreativeBriefBuilder } from './creative-brief-builder.js';
import type { BusinessBriefInput } from '@creative-factory/domain';

describe('CreativeBriefBuilder', () => {
  const mockBrief: BusinessBriefInput = {
    id: 'brief-1',
    campaignGoal: 'Increase market awareness',
    industry: 'SaaS',
    valueProposition: 'Increase productivity by 40%',
    competitivePositioning: 'Easiest to use in the market',
    targetAudience: { description: 'Operations managers' },
    communicationChannels: ['social_media_linkedin', 'email'],
    customerPersonas: [],
    market: { primaryMarket: 'North America' },
    productsServices: [
      {
        id: 'prod-1',
        name: 'Platform',
        description: 'Main product',
        category: 'Software',
        features: ['Dashboard', 'Reports'],
        benefits: ['Time savings', 'Better visibility'],
      },
    ],
    campaignType: 'brand_awareness',
    languages: ['en'],
    regions: ['US'],
    timeline: { startDate: '2026-07-01', milestones: [] },
    assetRequirements: [
      {
        assetType: 'video',
        quantity: 3,
        specifications: { format: ['mp4'] },
        priority: 'required',
      },
    ],
    businessConstraints: ['Must comply with GDPR'],
    complianceRequirements: [],
    successMetrics: [
      {
        name: 'Brand awareness',
        description: 'Increase brand recall',
        priority: 'primary',
      },
    ],
  };

  it('should build creative brief from business brief', async () => {
    const builder = new StandardCreativeBriefBuilder();
    const brief = await builder.build('campaign-1', mockBrief);

    expect(brief).toBeDefined();
    expect(brief.campaignId).toBe('campaign-1');
    expect(brief.version).toBe('1.0.0');
    expect(brief.status).toBe('draft');
  });

  it('should include campaign context', async () => {
    const builder = new StandardCreativeBriefBuilder();
    const brief = await builder.build('campaign-1', mockBrief);

    expect(brief.campaignContext).toBeDefined();
    expect(brief.campaignContext.name).toBe(mockBrief.id);
    expect(brief.campaignContext.goal).toBe(mockBrief.campaignGoal);
  });

  it('should include target audience model', async () => {
    const builder = new StandardCreativeBriefBuilder();
    const brief = await builder.build('campaign-1', mockBrief);

    expect(brief.targetAudience).toBeDefined();
    expect(brief.targetAudience.primarySegment).toBeDefined();
  });

  it('should include messaging framework', async () => {
    const builder = new StandardCreativeBriefBuilder();
    const brief = await builder.build('campaign-1', mockBrief);

    expect(brief.messagingFramework).toBeDefined();
    expect(brief.messagingFramework.messagingPillars.length).toBeGreaterThan(0);
  });

  it('should include emotional direction', async () => {
    const builder = new StandardCreativeBriefBuilder();
    const brief = await builder.build('campaign-1', mockBrief);

    expect(brief.emotionalDirection).toBeDefined();
    expect(brief.emotionalDirection.primaryEmotion).toBeDefined();
  });

  it('should include channel strategy', async () => {
    const builder = new StandardCreativeBriefBuilder();
    const brief = await builder.build('campaign-1', mockBrief);

    expect(brief.channelStrategy).toBeDefined();
    expect(brief.channelStrategy.channels.length).toBeGreaterThan(0);
  });

  it('should include priority matrix', async () => {
    const builder = new StandardCreativeBriefBuilder();
    const brief = await builder.build('campaign-1', mockBrief);

    expect(brief.priorityMatrix).toBeDefined();
    expect(brief.priorityMatrix.mustHave.length).toBeGreaterThan(0);
  });
});

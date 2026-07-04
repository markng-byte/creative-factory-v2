import { describe, it, expect } from 'vitest';
import { StandardAudienceModelGenerator } from './audience-generator.js';
import type { BusinessBriefInput } from '@creative-factory/domain';
import { CampaignType, CommunicationChannel } from '@creative-factory/domain';

describe('AudienceModelGenerator', () => {
  const mockBusinessBrief: BusinessBriefInput = {
    id: 'brief-1',
    campaignGoal: 'Increase awareness',
    industry: 'Technology',
    valueProposition: 'Best in class',
    targetAudience: {
      description: 'Tech-savvy professionals aged 25-45',
      psychographics: {
        painPoints: ['Time management', 'Productivity'],
      },
    },
    communicationChannels: [
      CommunicationChannel.SOCIAL_MEDIA_TWITTER,
      CommunicationChannel.SOCIAL_MEDIA_LINKEDIN,
    ],
    customerPersonas: [
      {
        id: 'persona-1' as any,
        name: 'Tech Manager',
        description: 'Senior tech manager',
        archetype: 'Pioneer',
        demographics: { ageRange: { min: 30, max: 40 } },
        psychographics: { values: ['Innovation', 'Efficiency'] },
        behaviors: { buyingBehavior: ['Research driven'] },
        goals: ['Reduce costs'],
        frustrations: ['Complex tools'],
        preferredChannels: [CommunicationChannel.SOCIAL_MEDIA_LINKEDIN],
      },
    ],
    market: {
      primaryMarket: 'Global',
      competitiveLandscape: { directCompetitors: [], differentiators: [] },
    },
    productsServices: [],
    competitivePositioning: '',
    campaignType: CampaignType.BRAND_AWARENESS,
    languages: ['en'],
    regions: ['US'],
    timeline: { startDate: '2026-07-01', milestones: [] },
    assetRequirements: [],
    businessConstraints: [],
    complianceRequirements: [],
    successMetrics: [],
  };

  it('should generate audience model from business brief', async () => {
    const generator = new StandardAudienceModelGenerator();
    const model = await generator.generate('campaign-1', mockBusinessBrief);

    expect(model).toBeDefined();
    expect(model.campaignId).toBe('campaign-1');
    expect(model.version).toBe('1.0.0');
    expect(model.primarySegment).toBeDefined();
    expect(model.personas).toHaveLength(1);
    expect(model.psychographicMap).toBeDefined();
    expect(model.journeyMap).toBeDefined();
  });

  it('should process personas from business brief', async () => {
    const generator = new StandardAudienceModelGenerator();
    const model = await generator.generate('campaign-1', mockBusinessBrief);

    expect(model.personas).toHaveLength(1);
    expect(model.personas[0]?.name).toBe('Tech Manager');
    expect(model.personas[0]?.likelyConversionPath).toBeDefined();
  });

  it('should generate sentiment profile', async () => {
    const generator = new StandardAudienceModelGenerator();
    const model = await generator.generate('campaign-1', mockBusinessBrief);

    expect(model.sentiment).toBeDefined();
    expect(model.sentiment.brandPerception).toBeDefined();
    expect(model.sentiment.brandPerception.confidence).toBeGreaterThan(0);
  });

  it('should extract media consumption patterns', async () => {
    const generator = new StandardAudienceModelGenerator();
    const model = await generator.generate('campaign-1', mockBusinessBrief);

    expect(model.mediaConsumptionMap).toBeDefined();
    expect(model.mediaConsumptionMap.channels).toHaveLength(2);
    expect(model.mediaConsumptionMap.formats.length).toBeGreaterThan(0);
  });
});

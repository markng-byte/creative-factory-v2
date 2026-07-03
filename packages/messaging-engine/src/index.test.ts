import { describe, it, expect } from 'vitest';
import { StandardMessagingFrameworkGenerator } from './messaging-generator.js';
import type { BusinessBriefInput } from '@creative-factory/domain';

describe('MessagingFrameworkGenerator', () => {
  const mockBrief: BusinessBriefInput = {
    id: 'brief-1',
    campaignGoal: 'Drive product sales',
    industry: 'Technology',
    valueProposition: 'Enterprise-grade reliability',
    competitivePositioning: 'Most secure solution',
    targetAudience: { description: 'Enterprise CTO' },
    communicationChannels: ['social_media_linkedin', 'email'],
    customerPersonas: [],
    market: {},
    productsServices: [],
    campaignType: 'product_launch',
    languages: ['en'],
    regions: ['US'],
    timeline: {},
    assetRequirements: [],
    businessConstraints: [],
    complianceRequirements: [],
    successMetrics: [],
  };

  it('should generate messaging framework from business brief', async () => {
    const generator = new StandardMessagingFrameworkGenerator();
    const framework = await generator.generate('campaign-1', mockBrief);

    expect(framework).toBeDefined();
    expect(framework.campaignId).toBe('campaign-1');
    expect(framework.coreMessage).toBeDefined();
    expect(framework.messagingPillars.length).toBeGreaterThan(0);
  });

  it('should generate core message from value proposition', async () => {
    const generator = new StandardMessagingFrameworkGenerator();
    const framework = await generator.generate('campaign-1', mockBrief);

    expect(framework.coreMessage.headline).toContain(mockBrief.valueProposition);
    expect(framework.coreMessage.benefit).toBe(mockBrief.valueProposition);
  });

  it('should generate supporting messages', async () => {
    const generator = new StandardMessagingFrameworkGenerator();
    const framework = await generator.generate('campaign-1', mockBrief);

    expect(framework.supportingMessages.length).toBeGreaterThan(0);
    expect(framework.supportingMessages[0].description).toBeDefined();
  });

  it('should generate tone and voice based on industry', async () => {
    const generator = new StandardMessagingFrameworkGenerator();
    const framework = await generator.generate('campaign-1', mockBrief);

    expect(framework.toneAndVoice.personality).toContain('innovative');
    expect(framework.toneAndVoice.avoidTone.length).toBeGreaterThan(0);
  });

  it('should generate channel-specific messaging', async () => {
    const generator = new StandardMessagingFrameworkGenerator();
    const framework = await generator.generate('campaign-1', mockBrief);

    expect(framework.channelVariations.length).toBe(2);
    expect(framework.channelVariations[0].channel).toBe('social_media_linkedin');
  });

  it('should generate calls to action', async () => {
    const generator = new StandardMessagingFrameworkGenerator();
    const framework = await generator.generate('campaign-1', mockBrief);

    expect(framework.callsToAction.length).toBeGreaterThan(0);
    expect(framework.callsToAction[0].primary).toBeDefined();
  });
});

import { describe, it, expect } from 'vitest';
import { StandardCampaignEngineOrchestrator } from './orchestrator.js';
import type { BusinessBriefInput } from '@creative-factory/domain';
import { CampaignType, CommunicationChannel } from '@creative-factory/domain';

describe('CampaignEngineOrchestrator', () => {
  const mockBrief: BusinessBriefInput = {
    id: 'brief-1',
    campaignGoal: 'Launch new product',
    industry: 'SaaS',
    valueProposition: 'Automate workflows',
    competitivePositioning: 'Most intuitive UI',
    targetAudience: { description: 'Operations managers in mid-market' },
    communicationChannels: [CommunicationChannel.SOCIAL_MEDIA_LINKEDIN],
    customerPersonas: [],
    market: {
      primaryMarket: 'North America',
      competitiveLandscape: {
        directCompetitors: [],
        differentiators: [],
      },
    },
    productsServices: [],
    campaignType: CampaignType.PRODUCT_LAUNCH,
    languages: ['en'],
    regions: ['US'],
    timeline: { startDate: '2026-07-01', milestones: [] },
    assetRequirements: [],
    businessConstraints: [],
    complianceRequirements: [],
    successMetrics: [
      { name: 'Website traffic', description: 'Increase traffic by 50%', priority: 'primary' },
    ],
  };

  it('should create campaign from JSON business brief', async () => {
    const orchestrator = new StandardCampaignEngineOrchestrator();

    const pkg = await orchestrator.createCampaign('campaign-1', mockBrief, 'json');

    expect(pkg).toBeDefined();
    expect(pkg.campaignId).toBe('campaign-1');
    expect(pkg.creativeBrief).toBeDefined();
    expect(pkg.validationResult.valid).toBe(true);
  });

  it('should create campaign from YAML business brief', async () => {
    const orchestrator = new StandardCampaignEngineOrchestrator();

    const yamlContent = `
id: brief-2
campaignGoal: Increase brand awareness
industry: Technology
valueProposition: Industry-leading solution
targetAudience:
  description: Tech executives
communicationChannels: []
`;

    const pkg = await orchestrator.createCampaign('campaign-2', yamlContent, 'yaml');

    expect(pkg).toBeDefined();
    expect(pkg.campaignId).toBe('campaign-2');
    expect(pkg.creativeBrief).toBeDefined();
  });

  it('should retrieve stored campaign', async () => {
    const orchestrator = new StandardCampaignEngineOrchestrator();

    await orchestrator.createCampaign('campaign-1', mockBrief, 'json');

    const pkg = await orchestrator.getCampaign('campaign-1');

    expect(pkg).toBeDefined();
    expect(pkg?.campaignId).toBe('campaign-1');
  });

  it('should list all campaigns', async () => {
    const orchestrator = new StandardCampaignEngineOrchestrator();

    await orchestrator.createCampaign('campaign-1', mockBrief, 'json');
    await orchestrator.createCampaign('campaign-2', mockBrief, 'json');

    const campaigns = await orchestrator.listCampaigns();

    expect(campaigns.length).toBeGreaterThanOrEqual(2);
  });

  it('should delete campaign', async () => {
    const orchestrator = new StandardCampaignEngineOrchestrator();

    await orchestrator.createCampaign('campaign-1', mockBrief, 'json');

    const deleted = await orchestrator.deleteCampaign('campaign-1');

    expect(deleted).toBe(true);

    const pkg = await orchestrator.getCampaign('campaign-1');
    expect(pkg).toBeUndefined();
  });

  it('should reject unsupported import format', async () => {
    const orchestrator = new StandardCampaignEngineOrchestrator();

    await expect(
      orchestrator.createCampaign('campaign-1', mockBrief, 'unsupported'),
    ).rejects.toThrow('Unsupported import format');
  });

  it('should include creative brief in campaign package', async () => {
    const orchestrator = new StandardCampaignEngineOrchestrator();

    const pkg = await orchestrator.createCampaign('campaign-1', mockBrief, 'json');

    expect(pkg.creativeBrief).toBeDefined();
    expect(pkg.creativeBrief.campaignContext).toBeDefined();
    expect(pkg.creativeBrief.targetAudience).toBeDefined();
    expect(pkg.creativeBrief.messagingFramework).toBeDefined();
  });

  it('should validate campaign before storing', async () => {
    const orchestrator = new StandardCampaignEngineOrchestrator();

    const incompleteBrief = {
      id: 'brief-incomplete',
      campaignGoal: '',
      industry: '',
      valueProposition: '',
      targetAudience: { description: 'Some audience' },
      communicationChannels: [],
      customerPersonas: [],
      market: {
        primaryMarket: 'Some market',
        competitiveLandscape: {
          directCompetitors: [],
          differentiators: [],
        },
      },
      productsServices: [],
      competitivePositioning: '',
      campaignType: CampaignType.BRAND_AWARENESS,
      languages: [],
      regions: [],
      timeline: { startDate: '2026-07-01', milestones: [] },
      assetRequirements: [],
      businessConstraints: [],
      complianceRequirements: [],
      successMetrics: [],
    };

    await expect(
      orchestrator.createCampaign('campaign-invalid', incompleteBrief, 'json'),
    ).rejects.toThrow();
  });
});

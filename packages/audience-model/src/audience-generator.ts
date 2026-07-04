import type { BusinessBriefInput, CustomerPersona } from '@creative-factory/domain';
import type {
  AudienceModel,
  AudienceModelStatus,
  ProcessedSegment,
  ProcessedPersona,
  CommunicationStrategy,
} from './types.js';

/**
 * Audience Model Generator
 * Transforms business brief audience inputs into processed audience models
 */
export interface IAudienceModelGenerator {
  generate(campaignId: string, businessBrief: BusinessBriefInput): Promise<AudienceModel>;
}

export class StandardAudienceModelGenerator implements IAudienceModelGenerator {
  async generate(campaignId: string, businessBrief: BusinessBriefInput): Promise<AudienceModel> {
    const id = `aud-${campaignId}-${Date.now()}` as unknown as AudienceModel['id'];

    const primarySegment = this.processSegment(
      businessBrief.targetAudience?.description || 'Primary Audience',
      businessBrief,
    );

    const secondarySegments: ProcessedSegment[] = [];

    const personas = this.processPersonas(businessBrief.customerPersonas || []);

    const psychographicMap = this.generatePsychographicMap(businessBrief);

    const journeyMap = this.generateJourneyMap(businessBrief);

    const mediaConsumptionMap = this.generateMediaConsumptionMap(businessBrief);

    const sentiment = this.generateSentimentProfile(businessBrief);

    return {
      id,
      campaignId,
      version: '1.0.0',
      status: 'draft' as AudienceModelStatus,
      primarySegment,
      secondarySegments,
      personas,
      psychographicMap,
      journeyMap,
      mediaConsumptionMap,
      sentiment,
      metadata: {
        sourceData: ['business_brief'],
        validationDate: new Date().toISOString(),
        dataFreshness: 'CURRENT' as const,
        notes: 'Generated from business brief',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private processSegment(name: string, businessBrief: BusinessBriefInput): ProcessedSegment {
    const characteristics = this.extractCharacteristics(businessBrief);

    return {
      id: `seg-${Date.now()}`,
      name,
      size: {
        estimatedReach: 100000,
        confidence: 0.7,
        dataSource: 'business_brief',
      },
      characteristics,
      communicationStrategy: this.generateCommunicationStrategy(businessBrief),
    };
  }

  private extractCharacteristics(
    businessBrief: BusinessBriefInput,
  ): Array<{ dimension: string; value: string; weight: number }> {
    const characteristics = [];

    if (businessBrief.targetAudience?.description) {
      characteristics.push({
        dimension: 'audience_description',
        value: businessBrief.targetAudience.description,
        weight: 1,
      });
    }

    if (businessBrief.industry) {
      characteristics.push({
        dimension: 'industry_relevance',
        value: businessBrief.industry,
        weight: 0.8,
      });
    }

    return characteristics;
  }

  private generateCommunicationStrategy(businessBrief: BusinessBriefInput): CommunicationStrategy {
    return {
      tone: businessBrief.metadata?.preferredTone
        ? [businessBrief.metadata.preferredTone as string]
        : ['professional'],
      messageThemes: businessBrief.metadata?.messageThemes
        ? (businessBrief.metadata.messageThemes as string[])
        : [],
      channels: businessBrief.communicationChannels || [],
      contentTypes: ['video', 'image', 'text'],
      callToActionStyle: 'direct',
    };
  }

  private processPersonas(personas: CustomerPersona[]): ProcessedPersona[] {
    return personas.map((persona) => ({
      id: persona.id,
      name: persona.name,
      archetype: persona.archetype,
      segmentMapping: 'primary',
      likelyConversionPath: {
        stage: 'awareness',
        triggers: persona.frustrations || [],
        barriers: [],
        incentives: persona.goals || [],
      },
      communicationPreferences: [
        {
          channel: persona.preferredChannels?.[0] || 'social_media',
          frequency: 'weekly',
          timePreference: 'evening',
          contentFormat: 'video',
        },
      ],
      painPointsRanked: (persona.frustrations || []).map((fp, idx) => ({
        value: fp,
        rank: idx + 1,
        intensity: 0.8,
      })),
      goalsRanked: (persona.goals || []).map((goal, idx) => ({
        value: goal,
        rank: idx + 1,
        intensity: 0.9,
      })),
    }));
  }

  private generatePsychographicMap(businessBrief: BusinessBriefInput) {
    return {
      valuesClusters: [
        {
          name: 'Core Values',
          values: businessBrief.metadata?.coreValues
            ? (businessBrief.metadata.coreValues as string[])
            : [],
          prevalence: 0.8,
        },
      ],
      lifestyleSegments: [
        {
          name: 'Primary Lifestyle',
          characteristics: businessBrief.metadata?.lifestyle
            ? [businessBrief.metadata.lifestyle as string]
            : [],
          activities: [],
          prevalence: 0.7,
        },
      ],
      personalityDimensions: [
        {
          dimension: 'Professionalism',
          low: 'casual',
          high: 'formal',
          distribution: 'skewed_high',
        },
      ],
    };
  }

  private generateJourneyMap(businessBrief: BusinessBriefInput) {
    return {
      stages: [
        {
          name: 'Awareness',
          duration: '1-2 weeks',
          goals: ['Discover product', 'Understand value proposition'],
          painPoints: businessBrief.targetAudience?.psychographics?.painPoints || [],
          successMetrics: ['Impressions', 'Reach'],
        },
      ],
      touchpoints: [
        {
          stage: 'Awareness',
          channel: businessBrief.communicationChannels?.[0] || 'social_media',
          type: 'discovery',
          impact: 'HIGH' as const,
          optimization: 'Increase frequency',
        },
      ],
      emotionalArc: [
        {
          stage: 'Awareness',
          emotion: 'curiosity',
          intensity: 0.6,
        },
      ],
    };
  }

  private generateMediaConsumptionMap(businessBrief: BusinessBriefInput) {
    const channels = businessBrief.communicationChannels || [];

    return {
      channels: channels.map((channel) => ({
        channel,
        penetration: 0.7,
        frequency: 'daily',
        engagement: 'MEDIUM' as const,
      })),
      formats: [
        {
          format: 'short_form_video',
          preference: 0.9,
          engagement: 'HIGH' as const,
        },
        {
          format: 'long_form_video',
          preference: 0.7,
          engagement: 'MEDIUM' as const,
        },
      ],
      timingPatterns: [
        {
          timeOfDay: 'evening',
          dayOfWeek: 'weekday',
          season: 'year_round',
          intensity: 0.8,
        },
      ],
    };
  }

  private generateSentimentProfile(_businessBrief: BusinessBriefInput) {
    return {
      brandPerception: {
        positive: 0.6,
        neutral: 0.3,
        negative: 0.1,
        confidence: 0.7,
      },
      categoryPerception: {
        positive: 0.5,
        neutral: 0.4,
        negative: 0.1,
        confidence: 0.6,
      },
      competitorPerception: [],
    };
  }
}

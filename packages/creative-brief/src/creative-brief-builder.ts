import type {
  CreativeBrief,
  CreativeBriefStatus,
  BusinessBriefInput,
  BrandProfile,
  Message,
  MessageId,
  MessagingPillar,
  TargetAudience,
  AudienceSegment,
  AudienceSegmentId,
  ToneOfVoice,
  CreativeConstraint,
  ChannelPlan,
} from '@creative-factory/domain';
import { MessageType, CreativeConstraintType, ChannelRole } from '@creative-factory/domain';
import type { AudienceModel } from '@creative-factory/audience-model';
import { StandardAudienceModelGenerator } from '@creative-factory/audience-model';
import { StandardMessagingFrameworkGenerator } from '@creative-factory/messaging-engine';

/**
 * Creative Brief Builder
 * Orchestrates the generation of creative briefs from business inputs
 */
export interface ICreativeBriefBuilder {
  build(
    campaignId: string,
    businessBrief: BusinessBriefInput,
    brandProfile?: BrandProfile,
  ): Promise<CreativeBrief>;
}

export class StandardCreativeBriefBuilder implements ICreativeBriefBuilder {
  private audienceGenerator = new StandardAudienceModelGenerator();
  private messagingGenerator = new StandardMessagingFrameworkGenerator();

  async build(
    campaignId: string,
    businessBrief: BusinessBriefInput,
    brandProfile?: BrandProfile,
  ): Promise<CreativeBrief> {
    // Generate supporting models
    const audienceModel = await this.audienceGenerator.generate(campaignId, businessBrief);
    const messagingFramework = await this.messagingGenerator.generate(
      campaignId,
      businessBrief,
      audienceModel,
    );

    const keyMessages: Message[] = messagingFramework.messagingPillars.map((pillar, idx) => ({
      id: `msg-${campaignId}-${idx}` as MessageId,
      type: MessageType.CORE_MESSAGE,
      content: pillar.keyMessage,
      supportingPoints: pillar.supportPoints,
      priority: 'primary',
    }));

    // Build creative brief
    const brief: CreativeBrief = {
      id: `brief-${campaignId}-${Date.now()}` as unknown as CreativeBrief['id'],
      campaignId,
      brandProfileId: brandProfile?.id,
      version: '1.0.0',
      status: 'draft' as CreativeBriefStatus,

      // Campaign Context
      campaignContext: {
        name: businessBrief.id,
        type: businessBrief.campaignType,
        goal: businessBrief.campaignGoal,
        background: businessBrief.industry,
        competitiveContext: businessBrief.competitivePositioning,
        marketOpportunity: (businessBrief.market?.primaryMarket as string) || '',
        timeline: businessBrief.timeline,
        budget: businessBrief.budget,
      },

      // Objectives
      businessObjectives: [
        {
          id: 'obj-1',
          description: businessBrief.campaignGoal,
          metric: 'campaign_success',
          priority: 'primary',
        },
      ],
      communicationObjectives: [
        {
          id: 'comm-obj-1',
          description: `Communicate ${businessBrief.valueProposition} to target audience`,
          intendedEffect: 'awareness',
          priority: 'primary',
        },
      ],

      // Audience
      targetAudience: this.buildTargetAudience(campaignId, audienceModel, businessBrief),

      // Messaging
      keyMessages: keyMessages,
      messagingFramework: {
        bigIdea: messagingFramework.coreMessage.headline,
        messagingPillars: messagingFramework.messagingPillars.map((pillar, idx) => ({
          id: pillar.id,
          title: pillar.title,
          description: pillar.keyMessage,
          messages: [keyMessages[idx]!],
          supportingEvidence: pillar.supportPoints,
        })) satisfies MessagingPillar[],
        storyHooks: ['Customer success story', 'Industry impact', 'Innovation advantage'],
        consistencyGuidelines: [
          'Always emphasize value',
          'Use industry terminology',
          'Focus on outcomes',
        ],
      },

      // Creative Direction
      toneOfVoice: {
        personality: messagingFramework.toneAndVoice.personality,
        traits: messagingFramework.toneAndVoice.vocabulary,
        doExamples: [],
        dontExamples: messagingFramework.toneAndVoice.avoidTone,
        voiceAttributes: [],
      } satisfies ToneOfVoice,
      emotionalDirection: {
        primaryEmotion: 'confidence',
        secondaryEmotions: ['trust', 'excitement'],
        emotionalJourney: [
          {
            phase: 'awareness',
            emotion: 'curiosity',
            intensity: 6,
            trigger: 'Initial discovery',
          },
        ],
        avoidEmotions: ['fear', 'confusion'],
      },
      visualDirection: {
        visualConcept: `Professional ${businessBrief.industry} aesthetic`,
        visualThemes: ['Modern', 'Clean', 'Professional'],
        colorMood: 'Corporate with accent colors',
        aestheticStyle: 'Minimalist professional',
        visualReferences: [],
        prohibitedVisuals: ['Cliché stock photos', 'Outdated design trends'],
      },

      // Action & Metrics
      desiredUserAction: {
        primary: {
          description: businessBrief.campaignGoal,
          verb: 'engage',
          object: 'content',
          measurement: 'click_through_rate',
        },
        conversionFunnel: [],
      },
      successMetrics: (businessBrief.successMetrics || []).map((metric, idx) => ({
        id: `metric-${idx}`,
        category: 'business',
        name: metric.name,
        description: metric.description,
        target: metric.target,
        unit: metric.unit,
        measurementMethod: metric.measurementMethod,
        priority: metric.priority,
      })),

      // Deliverables
      deliverables: (businessBrief.assetRequirements || []).map((req, idx) => ({
        id: `deliv-${idx}`,
        name: `${req.assetType} Asset`,
        type: req.assetType,
        quantity: req.quantity,
        specifications: req.specifications,
        channels: businessBrief.communicationChannels || [],
        priority: 'required',
      })),

      // Constraints
      creativeConstraints: (businessBrief.businessConstraints || []).map(
        (constraint): CreativeConstraint => ({
          type: CreativeConstraintType.CREATIVE,
          description: constraint,
          rationale: 'Business requirement',
          impact: 'advisory',
        }),
      ),

      // Channel Strategy
      channelStrategy: {
        channels: (businessBrief.communicationChannels || []).map(
          (channel): ChannelPlan => ({
            channel,
            role: ChannelRole.PRIMARY,
            objectives: [businessBrief.campaignGoal],
            assetTypes: businessBrief.assetRequirements?.map((r) => r.assetType) || [],
            contentStrategy: 'Engage and convert',
            timing: 'Ongoing',
            kpis: ['CTR', 'Engagement', 'Conversions'],
          }),
        ),
        crossChannelSynergy: 'Unified brand message across all touchpoints',
      },

      // References
      brandReferences: brandProfile
        ? [
            {
              element: 'logo',
              requirement: 'Use primary logo on all assets',
              source: brandProfile.id,
            },
            {
              element: 'colors',
              requirement: `Use brand palette: ${brandProfile.colorPalette.primaryColors[0]?.hex || '#000000'}`,
              source: brandProfile.id,
            },
          ]
        : [],
      inspirationReferences: businessBrief.creativeReferences || [],

      // Priority Matrix
      priorityMatrix: {
        mustHave: ['Brand consistency', 'Message clarity', 'Call to action'],
        shouldHave: ['Visual innovation', 'Emotional engagement'],
        couldHave: ['Advanced animations', 'Interactive elements'],
        wontHave: [],
        tradeoffs: [],
      },

      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return brief;
  }

  private buildTargetAudience(
    campaignId: string,
    audienceModel: AudienceModel,
    businessBrief: BusinessBriefInput,
  ): TargetAudience {
    const primarySegment: AudienceSegment = {
      id: `seg-${campaignId}` as AudienceSegmentId,
      name: audienceModel.primarySegment.name,
      description: businessBrief.targetAudience.description,
      size: audienceModel.primarySegment.size.estimatedReach,
      demographics: businessBrief.targetAudience.demographics ?? {},
      psychographics: businessBrief.targetAudience.psychographics ?? {},
      behaviors: businessBrief.targetAudience.behaviors ?? {},
      mediaHabits: [],
      purchaseDrivers: [],
      barriers: [],
    };

    return {
      primarySegment,
      secondarySegments: [],
      personas: businessBrief.customerPersonas ?? [],
      insights: audienceModel.sentiment
        ? [
            {
              insight: `Brand perception: ${Math.round(audienceModel.sentiment.brandPerception.positive * 100)}% positive`,
              implication: 'Strong brand foundation to build on',
              relevance: 'high',
            },
          ]
        : [],
    };
  }
}

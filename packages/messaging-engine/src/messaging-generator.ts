import type {
  MessagingFramework,
  MessagingFrameworkStatus,
  CoreMessage,
  SupportingMessage,
  ToneAndVoice,
  MessagingPillar,
  CallToAction,
  BusinessBriefInput,
  AudienceModel,
} from '@creative-factory/domain';

/**
 * Messaging Framework Generator
 * Creates messaging strategies from business briefs and audience models
 */
export interface IMessagingFrameworkGenerator {
  generate(
    campaignId: string,
    businessBrief: BusinessBriefInput,
    audienceModel?: AudienceModel,
  ): Promise<MessagingFramework>;
}

export class StandardMessagingFrameworkGenerator implements IMessagingFrameworkGenerator {
  async generate(
    campaignId: string,
    businessBrief: BusinessBriefInput,
    _audienceModel?: AudienceModel,
  ): Promise<MessagingFramework> {
    const coreMessage = this.generateCoreMessage(businessBrief);
    const supportingMessages = this.generateSupportingMessages(businessBrief);
    const toneAndVoice = this.generateToneAndVoice(businessBrief);
    const pillars = this.generateMessagingPillars(businessBrief);
    const callsToAction = this.generateCallsToAction(businessBrief);

    return {
      id: `msg-${campaignId}-${Date.now()}` as unknown as MessagingFramework['id'],
      campaignId,
      version: '1.0.0',
      status: 'draft' as MessagingFrameworkStatus,
      coreMessage,
      supportingMessages,
      toneAndVoice,
      messagingPillars: pillars,
      channelVariations: this.generateChannelVariations(coreMessage, businessBrief),
      callsToAction,
      metadata: {
        researchBased: true,
        notes: 'Generated from business brief and audience insights',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private generateCoreMessage(businessBrief: BusinessBriefInput): CoreMessage {
    return {
      headline: `${businessBrief.valueProposition} for ${businessBrief.industry}`,
      subheadline: businessBrief.campaignGoal,
      benefit: businessBrief.valueProposition,
      proof: 'Market-leading solution trusted by industry leaders',
    };
  }

  private generateSupportingMessages(businessBrief: BusinessBriefInput): SupportingMessage[] {
    const messages: SupportingMessage[] = [];

    if (businessBrief.valueProposition) {
      messages.push({
        id: 'msg-value-1',
        title: 'Core Value',
        description: businessBrief.valueProposition,
        evidencePoints: ['Product quality', 'Customer satisfaction'],
        targetSegment: 'primary',
      });
    }

    if (businessBrief.competitivePositioning) {
      messages.push({
        id: 'msg-competitive-1',
        title: 'Competitive Advantage',
        description: businessBrief.competitivePositioning,
        evidencePoints: ['Innovation', 'Reliability'],
        targetSegment: 'primary',
      });
    }

    messages.push({
      id: 'msg-benefit-1',
      title: 'Key Benefit',
      description: 'Transform your business outcomes',
      evidencePoints: ['Proven results', 'Industry recognition'],
      targetSegment: 'primary',
    });

    return messages;
  }

  private generateToneAndVoice(businessBrief: BusinessBriefInput): ToneAndVoice {
    const industry = businessBrief.industry?.toLowerCase() || 'general';

    const toneMap: Record<string, string[]> = {
      technology: ['innovative', 'forward-thinking', 'confident'],
      finance: ['professional', 'trustworthy', 'authoritative'],
      healthcare: ['empathetic', 'knowledgeable', 'reassuring'],
      retail: ['friendly', 'engaging', 'approachable'],
      default: ['professional', 'clear', 'compelling'],
    };

    const selectedTone = toneMap[industry] || toneMap.default;

    return {
      personality: selectedTone,
      vocabulary: ['clear', 'direct', 'benefit-focused'],
      grammarStyle: 'conversational-professional',
      emotionalTone: ['confident', 'motivating'],
      avoidTone: ['condescending', 'unclear', 'overly technical'],
    };
  }

  private generateMessagingPillars(businessBrief: BusinessBriefInput): MessagingPillar[] {
    return [
      {
        id: 'pillar-1',
        title: 'Value Proposition',
        keyMessage: businessBrief.valueProposition,
        supportPoints: [
          'Solves key customer pain points',
          'Delivers measurable results',
          'Backed by proven methodology',
        ],
        segmentFocus: 'primary',
      },
      {
        id: 'pillar-2',
        title: 'Competitive Advantage',
        keyMessage: businessBrief.competitivePositioning || 'Market-leading solution',
        supportPoints: [
          'Unique approach',
          'Superior quality',
          'Exceptional support',
        ],
        segmentFocus: 'primary',
      },
      {
        id: 'pillar-3',
        title: 'Business Impact',
        keyMessage: businessBrief.campaignGoal,
        supportPoints: [
          'Drives growth',
          'Reduces costs',
          'Improves efficiency',
        ],
        segmentFocus: 'primary',
      },
    ];
  }

  private generateChannelVariations(
    coreMessage: CoreMessage,
    businessBrief: BusinessBriefInput,
  ) {
    const channels = businessBrief.communicationChannels || [];

    return channels.map((channel) => ({
      channel,
      headline: this.adaptHeadlineForChannel(coreMessage.headline, channel),
      bodyMessage: this.adaptBodyForChannel(coreMessage.benefit, channel),
      callToAction: 'Learn More',
      specifics: this.getChannelSpecifics(channel),
    }));
  }

  private adaptHeadlineForChannel(headline: string, channel: string): string {
    if (channel.includes('twitter') || channel.includes('tiktok')) {
      return headline.length > 140 ? headline.substring(0, 137) + '...' : headline;
    }

    if (channel.includes('linkedin')) {
      return headline;
    }

    if (channel.includes('instagram')) {
      return headline.substring(0, 75);
    }

    return headline;
  }

  private adaptBodyForChannel(body: string, channel: string): string {
    if (channel.includes('email')) {
      return `Hi there,\n\n${body}\n\nBest regards`;
    }

    if (channel.includes('sms')) {
      return body.substring(0, 160);
    }

    return body;
  }

  private getChannelSpecifics(channel: string) {
    const specifics: Record<string, Record<string, unknown>> = {
      social_media_twitter: {
        characterLimit: 280,
        hashtags: 2,
        mentions: 1,
      },
      social_media_instagram: {
        imageRequired: true,
        captionLength: 2200,
        hashtags: 30,
      },
      social_media_linkedin: {
        documentSupported: true,
        videoSupported: true,
        engagementFocus: 'professional',
      },
      email: {
        subjectLineLength: 50,
        previewTextLength: 100,
        ctaButtons: 2,
      },
    };

    return specifics[channel] || {};
  }

  private generateCallsToAction(businessBrief: BusinessBriefInput): CallToAction[] {
    const goal = businessBrief.campaignGoal?.toLowerCase() || '';

    let primaryCTA = 'Learn More';
    if (goal.includes('purchase') || goal.includes('buy')) {
      primaryCTA = 'Shop Now';
    } else if (goal.includes('sign') || goal.includes('register')) {
      primaryCTA = 'Sign Up';
    } else if (goal.includes('download')) {
      primaryCTA = 'Download Now';
    } else if (goal.includes('contact')) {
      primaryCTA = 'Contact Us';
    }

    return [
      {
        id: 'cta-1',
        primary: primaryCTA,
        secondary: 'Explore More',
        urgency: 'FLEXIBLE' as const,
        channelVariations: {
          email: primaryCTA,
          social_media: primaryCTA,
          web: primaryCTA,
        },
      },
    ];
  }
}

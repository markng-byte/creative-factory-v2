/**
 * Worked example inputs.
 *
 * A complete, realistic Creative Brief / Campaign / Brand Tokens set for the fictional brand
 * "Northwind Analytics". Used by the test suite and by the docs example generator so that the
 * committed example Creative IR and Creative Package always reflect real compiler output.
 */

import {
  CampaignType,
  ChannelRole,
  CommunicationChannel,
  CreativeBriefStatus,
  CreativeConstraintType,
  Gender,
  MessageType,
  type CreativeBrief,
} from '@creative-factory/domain';
import {
  createUserId,
  type CreativeBriefId,
  type AudienceSegmentId,
  type MessageId,
} from '@creative-factory/domain';
import type { Campaign } from '@creative-factory/creative-ir';
import type { BrandTokensBundle } from './ports.js';

function asId<T>(value: string): T {
  return value as unknown as T;
}

export function exampleCreativeBrief(): CreativeBrief {
  return {
    id: asId<CreativeBriefId>('brief-northwind-001'),
    campaignId: 'campaign-northwind-q3',
    brandProfileId: 'brand-northwind',
    version: '1.0.0',
    status: CreativeBriefStatus.APPROVED,
    campaignContext: {
      name: 'Northwind Analytics — See the Whole Story',
      type: CampaignType.PRODUCT_LAUNCH,
      goal: 'Launch the Northwind Insight dashboard to mid-market data teams',
      background:
        'Data teams drown in disconnected dashboards and lose the narrative in the noise.',
      competitiveContext: 'Incumbents optimize for breadth of charts, not clarity of story.',
      marketOpportunity: 'Mid-market teams want decision-ready insight, not more tooling.',
      timeline: {
        startDate: '2026-07-01',
        endDate: '2026-09-30',
        milestones: [
          { name: 'Teaser', date: '2026-07-15', deliverables: ['Hero film'] },
          { name: 'Launch', date: '2026-08-01', deliverables: ['Full campaign'] },
        ],
        urgency: 'high',
      },
    },
    businessObjectives: [
      {
        id: 'obj-1',
        description: 'Drive 5,000 qualified trial signups in the launch quarter',
        metric: 'trial_signups',
        target: 5000,
        priority: 'primary',
      },
      {
        id: 'obj-2',
        description: 'Establish Northwind as the clarity-first analytics brand',
        metric: 'brand_lift',
        priority: 'secondary',
      },
    ],
    communicationObjectives: [
      {
        id: 'comm-1',
        description: 'Make data teams feel the pain of fragmented dashboards',
        intendedEffect: 'awareness',
        priority: 'primary',
      },
      {
        id: 'comm-2',
        description: 'Show how one narrative view changes decisions',
        intendedEffect: 'consideration',
        priority: 'secondary',
      },
    ],
    targetAudience: {
      primarySegment: {
        id: asId<AudienceSegmentId>('seg-data-leads'),
        name: 'Mid-market data leads',
        description: 'Analytics managers accountable for decisions, not just dashboards',
        demographics: {
          ageRange: { min: 28, max: 45 },
          gender: [Gender.FEMALE, Gender.MALE, Gender.NON_BINARY],
        },
        psychographics: {
          values: ['clarity', 'impact', 'craft'],
          painPoints: ['dashboard sprawl', 'no single narrative'],
        },
        behaviors: { mediaConsumption: ['LinkedIn', 'YouTube', 'newsletters'] },
        mediaHabits: [
          { channel: CommunicationChannel.SOCIAL_MEDIA_LINKEDIN, frequency: 'daily' },
          { channel: CommunicationChannel.SOCIAL_MEDIA_YOUTUBE, frequency: 'weekly' },
        ],
        purchaseDrivers: ['time-to-insight', 'trust'],
        barriers: ['migration cost', 'change fatigue'],
      },
      personas: [],
      insights: [
        {
          insight: 'Teams equate more charts with more rigor, but decisions stall',
          implication: 'Sell clarity, not coverage',
          relevance: 'high',
        },
      ],
    },
    keyMessages: [
      {
        id: asId<MessageId>('msg-core'),
        type: MessageType.CORE_MESSAGE,
        content: 'See the whole story your data is telling',
        priority: 'primary',
      },
      {
        id: asId<MessageId>('msg-value'),
        type: MessageType.VALUE_PROPOSITION,
        content: 'One narrative view replaces a wall of dashboards',
        priority: 'secondary',
      },
      {
        id: asId<MessageId>('msg-proof'),
        type: MessageType.PROOF_POINT,
        content: 'Decisions land 3x faster with a single source of narrative truth',
        priority: 'tertiary',
      },
    ],
    messagingFramework: {
      bigIdea: 'See the Whole Story',
      messagingPillars: [
        {
          id: 'pillar-clarity',
          title: 'Clarity over coverage',
          description: 'Insight beats instrumentation',
          messages: [],
        },
      ],
      narrativeArc: 'From noise and fragmentation to a single, confident narrative view',
      storyHooks: ['What is your data actually trying to say?'],
      consistencyGuidelines: ['Always lead with the decision, not the dashboard'],
    },
    toneOfVoice: {
      personality: ['confident', 'clear', 'human'],
      traits: ['precise', 'warm'],
      doExamples: ['Lead with the decision'],
      dontExamples: ['Never bury the point in jargon'],
      voiceAttributes: [
        { spectrum: 'Formal to Casual', position: 3, description: 'Approachable expert' },
      ],
    },
    emotionalDirection: {
      primaryEmotion: 'confident',
      secondaryEmotions: ['relieved', 'inspired'],
      emotionalJourney: [
        { phase: 'open', emotion: 'overwhelmed', intensity: 6, trigger: 'dashboard sprawl' },
        { phase: 'turn', emotion: 'curious', intensity: 7, trigger: 'a single narrative view' },
        {
          phase: 'peak',
          emotion: 'confident',
          intensity: 9,
          trigger: 'the decision becomes obvious',
        },
        { phase: 'close', emotion: 'inspired', intensity: 7, trigger: 'call to try Northwind' },
      ],
      avoidEmotions: ['anxious', 'condescending'],
    },
    visualDirection: {
      visualConcept: 'A calm, luminous narrative view emerging from visual noise',
      visualThemes: ['signal-from-noise', 'luminous data', 'human focus'],
      colorMood: 'cool, calm, luminous',
      aestheticStyle: 'clean editorial with soft depth',
      visualReferences: [
        {
          id: 'ref-1',
          title: 'Editorial data storytelling',
          source: 'Northwind moodboard',
          description: 'Calm negative space, one hero insight per frame',
          reasonForInclusion: 'Sets the clarity-first tone',
        },
      ],
      prohibitedVisuals: ['cluttered dashboards', 'stock handshakes'],
    },
    desiredUserAction: {
      primary: {
        description: 'Start a free Northwind Insight trial',
        verb: 'Start',
        object: 'a free trial',
        measurement: 'trial_signups',
      },
      conversionFunnel: [
        { stage: 'awareness', action: 'watch the film' },
        { stage: 'consideration', action: 'visit the product page' },
        { stage: 'intent', action: 'start a trial' },
      ],
    },
    successMetrics: [
      {
        id: 'metric-1',
        category: 'business',
        name: 'Trial signups',
        description: 'Qualified trials started',
        target: 5000,
        priority: 'primary',
      },
    ],
    deliverables: [],
    creativeConstraints: [
      {
        type: CreativeConstraintType.BRAND,
        description: 'Never show competitor dashboards',
        rationale: 'Stay positive and clarity-focused',
        impact: 'blocking',
      },
      {
        type: CreativeConstraintType.ACCESSIBILITY,
        description: 'Captions required on all video',
        rationale: 'WCAG 2.1 AA',
        impact: 'warning',
      },
    ],
    channelStrategy: {
      channels: [
        {
          channel: CommunicationChannel.SOCIAL_MEDIA_YOUTUBE,
          role: ChannelRole.PRIMARY,
          objectives: ['awareness'],
          assetTypes: [],
          contentStrategy: 'Hero film first',
          timing: 'launch week',
          kpis: ['view-through rate'],
        },
      ],
      crossChannelSynergy: 'Hero film seeds all cutdowns',
    },
    brandReferences: [{ element: 'colors', requirement: 'Use Northwind primary palette' }],
    inspirationReferences: [],
    priorityMatrix: {
      mustHave: ['hero film'],
      shouldHave: ['social cutdowns'],
      couldHave: ['motion GIFs'],
      wontHave: ['print'],
      tradeoffs: [],
    },
    createdAt: '2026-06-20T12:00:00.000Z',
    updatedAt: '2026-06-25T12:00:00.000Z',
  };
}

export function exampleCampaign(): Campaign {
  return {
    id: 'campaign-northwind-q3',
    name: 'Northwind Insight Launch',
    description: 'Q3 product launch for the Northwind Insight dashboard',
    objective: 'Drive qualified trials through clarity-first storytelling',
    targetAudience: {
      demographics: [{ age: { min: 28, max: 45 } }],
      psychographics: ['clarity', 'impact'],
      mediaPreferences: ['LinkedIn', 'YouTube'],
      geographies: ['US', 'GB', 'DE'],
    },
    duration: { minutes: 0, seconds: 30, frames: 0, frameRate: 30 },
    aspectRatios: ['16:9', '9:16'],
    languages: ['en'],
    marketRegions: ['US', 'GB', 'DE'],
    lifecycleState: 'STORYBOARD_DRAFT',
    approvalState: 'approved',
    createdBy: createUserId('planner-1'),
    updatedBy: createUserId('planner-1'),
  };
}

export function exampleBrandBundle(): BrandTokensBundle {
  return {
    brandTokens: {
      brandId: 'brand-northwind',
      brandName: 'Northwind Analytics',
      primaryColors: [
        {
          name: 'Northwind Ink',
          hex: '#0B2E4F',
          rgb: { r: 11, g: 46, b: 79 },
          hsl: { h: 208, s: 76, l: 18 },
          usage: 'Primary brand color',
          context: ['backgrounds', 'headlines'],
        },
      ],
      secondaryColors: [
        {
          name: 'Signal Teal',
          hex: '#1FB6A6',
          rgb: { r: 31, g: 182, b: 166 },
          hsl: { h: 174, s: 71, l: 42 },
          usage: 'Secondary accents',
          context: ['charts'],
        },
      ],
      accentColors: [
        {
          name: 'Insight Amber',
          hex: '#F5A623',
          rgb: { r: 245, g: 166, b: 35 },
          hsl: { h: 38, s: 91, l: 55 },
          usage: 'Highlight the one insight that matters',
          context: ['call-to-action'],
        },
      ],
      typography: [
        {
          name: 'Display',
          fontFamily: 'Söhne',
          fontWeight: 600,
          fontSize: 48,
          lineHeight: 1.1,
          letterSpacing: -0.5,
          usage: 'Headlines',
        },
        {
          name: 'Body',
          fontFamily: 'Inter',
          fontWeight: 400,
          fontSize: 18,
          lineHeight: 1.5,
          letterSpacing: 0,
          usage: 'Body copy',
        },
      ],
      logoVariations: [
        {
          type: 'primary',
          description: 'Full wordmark',
          minimumSize: 24,
          clearanceRules: 'Maintain clear space equal to the height of the N',
          usageContext: ['end card'],
        },
      ],
      imageryGuidelines: [
        {
          category: 'data',
          description: 'Luminous, calm, one hero insight per frame',
          visualCharacteristics: ['negative space', 'soft depth'],
          prohibited: ['cluttered dashboards'],
        },
      ],
      voiceAndTone: {
        personality: ['confident', 'clear', 'human'],
        toneInContext: { launch: 'assured and warm' },
        doNotUse: ['jargon', 'hype'],
      },
      prohibitedElements: [
        { type: 'imagery', description: 'Competitor dashboards', reason: 'Stay positive' },
      ],
      brandPersonality: {
        primaryTraits: ['clear', 'confident'],
        secondaryTraits: ['human', 'precise'],
        communicationStyle: 'Lead with the decision',
        valuePropositions: ['Clarity over coverage'],
      },
    },
    designTokens: {
      spacing: [
        { name: 'sm', value: 8, unit: 'px' },
        { name: 'md', value: 16, unit: 'px' },
        { name: 'lg', value: 32, unit: 'px' },
      ],
      sizing: [{ name: 'hero', width: 1920, height: 1080, unit: 'px' }],
      shadows: [
        { name: 'soft', color: 'rgba(11,46,79,0.16)', offsetX: 0, offsetY: 8, blur: 24, spread: 0 },
      ],
      borders: [{ name: 'hairline', width: 1, style: 'solid', color: '#0B2E4F', radius: 8 }],
      animations: [{ name: 'reveal', duration: 600, easing: 'ease-out', delay: 0 }],
      breakpoints: [{ name: 'desktop', minWidth: 1024 }],
    },
  };
}

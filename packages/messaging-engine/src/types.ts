/**
 * Messaging Engine Types
 *
 * Working representation produced by the messaging framework generator. This is
 * an intermediate engine output, distinct from the domain's Creative Brief
 * `MessagingFramework` contract - `@creative-factory/creative-brief` maps
 * between the two when assembling the final Creative Brief.
 */

export type MessagingModelId = string & { readonly __brand: 'MessagingModelId' };

export type MessagingModelStatus = 'draft' | 'validated' | 'archived';
export type CTAUrgency = 'FLEXIBLE' | 'MODERATE' | 'HIGH';

export interface CoreMessage {
  readonly headline: string;
  readonly subheadline: string;
  readonly benefit: string;
  readonly proof: string;
}

export interface SupportingMessage {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly evidencePoints: string[];
  readonly targetSegment: string;
}

export interface ToneAndVoice {
  readonly personality: string[];
  readonly vocabulary: string[];
  readonly grammarStyle: string;
  readonly emotionalTone: string[];
  readonly avoidTone: string[];
}

export interface MessagingPillar {
  readonly id: string;
  readonly title: string;
  readonly keyMessage: string;
  readonly supportPoints: string[];
  readonly segmentFocus: string;
}

export interface ChannelVariation {
  readonly channel: string;
  readonly headline: string;
  readonly bodyMessage: string;
  readonly callToAction: string;
  readonly specifics: Record<string, unknown>;
}

export interface CallToAction {
  readonly id: string;
  readonly primary: string;
  readonly secondary: string;
  readonly urgency: CTAUrgency;
  readonly channelVariations: Record<string, string>;
}

export interface MessagingModel {
  readonly id: MessagingModelId;
  readonly campaignId: string;
  readonly version: string;
  readonly status: MessagingModelStatus;
  readonly coreMessage: CoreMessage;
  readonly supportingMessages: SupportingMessage[];
  readonly toneAndVoice: ToneAndVoice;
  readonly messagingPillars: MessagingPillar[];
  readonly channelVariations: ChannelVariation[];
  readonly callsToAction: CallToAction[];
  readonly metadata: {
    readonly researchBased: boolean;
    readonly notes: string;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
}

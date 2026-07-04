import type { CommunicationChannel } from '@creative-factory/domain';

/**
 * Audience Model Types
 *
 * Working representation produced by the audience model generator. This is an
 * intermediate engine output, distinct from the domain's Creative Brief
 * `TargetAudience` contract - `@creative-factory/creative-brief` maps between
 * the two when assembling the final Creative Brief.
 */

export type AudienceModelId = string & { readonly __brand: 'AudienceModelId' };

export type AudienceModelStatus = 'draft' | 'validated' | 'archived';
export type DataFreshness = 'CURRENT' | 'STALE' | 'UNKNOWN';
export type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AudienceModel {
  readonly id: AudienceModelId;
  readonly campaignId: string;
  readonly version: string;
  readonly status: AudienceModelStatus;
  readonly primarySegment: ProcessedSegment;
  readonly secondarySegments: ProcessedSegment[];
  readonly personas: ProcessedPersona[];
  readonly psychographicMap: PsychographicMap;
  readonly journeyMap: JourneyMap;
  readonly mediaConsumptionMap: MediaConsumptionMap;
  readonly sentiment: SentimentProfile;
  readonly metadata: {
    readonly sourceData: string[];
    readonly validationDate: string;
    readonly dataFreshness: DataFreshness;
    readonly notes: string;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SegmentCharacteristic {
  readonly dimension: string;
  readonly value: string;
  readonly weight: number;
}

export interface ProcessedSegment {
  readonly id: string;
  readonly name: string;
  readonly size: {
    readonly estimatedReach: number;
    readonly confidence: number;
    readonly dataSource: string;
  };
  readonly characteristics: SegmentCharacteristic[];
  readonly communicationStrategy: CommunicationStrategy;
}

export interface CommunicationStrategy {
  readonly tone: string[];
  readonly messageThemes: string[];
  readonly channels: CommunicationChannel[];
  readonly contentTypes: string[];
  readonly callToActionStyle: string;
}

export interface ConversionPath {
  readonly stage: string;
  readonly triggers: string[];
  readonly barriers: string[];
  readonly incentives: string[];
}

export interface CommunicationPreference {
  readonly channel: string;
  readonly frequency: string;
  readonly timePreference: string;
  readonly contentFormat: string;
}

export interface RankedItem {
  readonly value: string;
  readonly rank: number;
  readonly intensity: number;
}

export interface ProcessedPersona {
  readonly id: string;
  readonly name: string;
  readonly archetype: string;
  readonly segmentMapping: string;
  readonly likelyConversionPath: ConversionPath;
  readonly communicationPreferences: CommunicationPreference[];
  readonly painPointsRanked: RankedItem[];
  readonly goalsRanked: RankedItem[];
}

export interface ValuesCluster {
  readonly name: string;
  readonly values: string[];
  readonly prevalence: number;
}

export interface LifestyleSegment {
  readonly name: string;
  readonly characteristics: string[];
  readonly activities: string[];
  readonly prevalence: number;
}

export interface PersonalityDimension {
  readonly dimension: string;
  readonly low: string;
  readonly high: string;
  readonly distribution: string;
}

export interface PsychographicMap {
  readonly valuesClusters: ValuesCluster[];
  readonly lifestyleSegments: LifestyleSegment[];
  readonly personalityDimensions: PersonalityDimension[];
}

export interface JourneyStage {
  readonly name: string;
  readonly duration: string;
  readonly goals: string[];
  readonly painPoints: string[];
  readonly successMetrics: string[];
}

export interface Touchpoint {
  readonly stage: string;
  readonly channel: string;
  readonly type: string;
  readonly impact: ImpactLevel;
  readonly optimization: string;
}

export interface EmotionalArcPoint {
  readonly stage: string;
  readonly emotion: string;
  readonly intensity: number;
}

export interface JourneyMap {
  readonly stages: JourneyStage[];
  readonly touchpoints: Touchpoint[];
  readonly emotionalArc: EmotionalArcPoint[];
}

export interface MediaChannelConsumption {
  readonly channel: string;
  readonly penetration: number;
  readonly frequency: string;
  readonly engagement: ImpactLevel | 'MEDIUM';
}

export interface FormatPreference {
  readonly format: string;
  readonly preference: number;
  readonly engagement: ImpactLevel;
}

export interface TimingPattern {
  readonly timeOfDay: string;
  readonly dayOfWeek: string;
  readonly season: string;
  readonly intensity: number;
}

export interface MediaConsumptionMap {
  readonly channels: MediaChannelConsumption[];
  readonly formats: FormatPreference[];
  readonly timingPatterns: TimingPattern[];
}

export interface PerceptionBreakdown {
  readonly positive: number;
  readonly neutral: number;
  readonly negative: number;
  readonly confidence: number;
}

export interface SentimentProfile {
  readonly brandPerception: PerceptionBreakdown;
  readonly categoryPerception: PerceptionBreakdown;
  readonly competitorPerception: Array<{
    readonly competitor: string;
    readonly perception: PerceptionBreakdown;
  }>;
}

/**
 * Campaign Engine Core Types
 *
 * Defines the type system for campaign management, business briefs, creative briefs,
 * audience modeling, messaging, and channel strategy.
 */

// ============================================================================
// Campaign Identifiers
// ============================================================================

export type CampaignPackageId = string & { readonly __brand: 'CampaignPackageId' };
export type CreativeBriefId = string & { readonly __brand: 'CreativeBriefId' };
export type AudienceSegmentId = string & { readonly __brand: 'AudienceSegmentId' };
export type PersonaId = string & { readonly __brand: 'PersonaId' };
export type MessageId = string & { readonly __brand: 'MessageId' };
export type ChannelId = string & { readonly __brand: 'ChannelId' };

// ============================================================================
// Business Brief (Input)
// ============================================================================

/**
 * Business Brief is the raw input from marketing teams.
 * It contains business objectives, audience, and campaign requirements.
 */
export interface BusinessBriefInput {
  readonly id: string;
  readonly campaignGoal: string;
  readonly brandProfileId?: string;  // Link to Brand Profile
  readonly targetAudience: TargetAudienceInput;
  readonly customerPersonas?: CustomerPersona[];
  readonly market: MarketContext;
  readonly industry: string;
  readonly productsServices: ProductService[];
  readonly valueProposition: string;
  readonly competitivePositioning: string;
  readonly campaignType: CampaignType;
  readonly communicationChannels: CommunicationChannel[];
  readonly languages: string[];      // ISO 639-1 codes
  readonly regions: string[];        // ISO 3166-1 alpha-2 codes
  readonly budget?: BudgetConstraints;
  readonly timeline: TimelineConstraints;
  readonly assetRequirements: AssetRequirement[];
  readonly existingAssets?: ExistingAsset[];
  readonly creativeReferences?: CreativeReference[];
  readonly businessConstraints: string[];
  readonly complianceRequirements: ComplianceRequirement[];
  readonly successMetrics: SuccessMetric[];
  readonly metadata?: Record<string, unknown>;
}

export enum CampaignType {
  BRAND_AWARENESS = 'brand_awareness',
  PRODUCT_LAUNCH = 'product_launch',
  LEAD_GENERATION = 'lead_generation',
  CUSTOMER_ACQUISITION = 'customer_acquisition',
  CUSTOMER_RETENTION = 'customer_retention',
  SEASONAL_PROMOTION = 'seasonal_promotion',
  EVENT_PROMOTION = 'event_promotion',
  CONTENT_MARKETING = 'content_marketing',
  THOUGHT_LEADERSHIP = 'thought_leadership',
  CRISIS_COMMUNICATION = 'crisis_communication',
  CUSTOM = 'custom',
}

export enum CommunicationChannel {
  SOCIAL_MEDIA_FACEBOOK = 'social_media_facebook',
  SOCIAL_MEDIA_INSTAGRAM = 'social_media_instagram',
  SOCIAL_MEDIA_TWITTER = 'social_media_twitter',
  SOCIAL_MEDIA_LINKEDIN = 'social_media_linkedin',
  SOCIAL_MEDIA_TIKTOK = 'social_media_tiktok',
  SOCIAL_MEDIA_YOUTUBE = 'social_media_youtube',
  EMAIL = 'email',
  DISPLAY_ADS = 'display_ads',
  VIDEO_ADS = 'video_ads',
  SEARCH_ADS = 'search_ads',
  TV = 'tv',
  RADIO = 'radio',
  PRINT = 'print',
  OUT_OF_HOME = 'out_of_home',
  WEBSITE = 'website',
  LANDING_PAGE = 'landing_page',
  BLOG = 'blog',
  PODCAST = 'podcast',
  WEBINAR = 'webinar',
  CUSTOM = 'custom',
}

// ============================================================================
// Target Audience & Personas
// ============================================================================

export interface TargetAudienceInput {
  readonly description: string;
  readonly demographics?: Demographics;
  readonly psychographics?: Psychographics;
  readonly behaviors?: Behaviors;
  readonly geographics?: Geographics;
  readonly segmentCriteria?: string[];
}

export interface Demographics {
  readonly ageRange?: AgeRange;
  readonly gender?: Gender[];
  readonly incomeRange?: IncomeRange;
  readonly education?: EducationLevel[];
  readonly occupation?: string[];
  readonly maritalStatus?: MaritalStatus[];
  readonly householdSize?: number;
  readonly ethnicBackground?: string[];
}

export interface AgeRange {
  readonly min: number;
  readonly max: number;
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
  OTHER = 'other',
}

export interface IncomeRange {
  readonly min: number;
  readonly max: number;
  readonly currency: string;
}

export enum EducationLevel {
  HIGH_SCHOOL = 'high_school',
  SOME_COLLEGE = 'some_college',
  BACHELORS = 'bachelors',
  MASTERS = 'masters',
  DOCTORATE = 'doctorate',
  PROFESSIONAL = 'professional',
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  PARTNERED = 'partnered',
}

export interface Psychographics {
  readonly values?: string[];
  readonly interests?: string[];
  readonly lifestyle?: string[];
  readonly personality?: string[];
  readonly attitudes?: string[];
  readonly motivations?: string[];
  readonly painPoints?: string[];
}

export interface Behaviors {
  readonly buyingBehavior?: string[];
  readonly mediaConsumption?: string[];
  readonly brandAffinity?: string[];
  readonly productUsage?: string[];
  readonly onlineActivity?: string[];
  readonly purchaseFrequency?: string;
}

export interface Geographics {
  readonly countries?: string[];
  readonly regions?: string[];
  readonly cities?: string[];
  readonly climate?: string[];
  readonly urbanization?: ('urban' | 'suburban' | 'rural')[];
}

export interface CustomerPersona {
  readonly id: PersonaId;
  readonly name: string;
  readonly description: string;
  readonly archetype: string;
  readonly demographics: Demographics;
  readonly psychographics: Psychographics;
  readonly behaviors: Behaviors;
  readonly goals: string[];
  readonly frustrations: string[];
  readonly preferredChannels: CommunicationChannel[];
  readonly quotableInsights?: string[];
  readonly imageUrl?: string;
}

// ============================================================================
// Market & Product Context
// ============================================================================

export interface MarketContext {
  readonly primaryMarket: string;
  readonly secondaryMarkets?: string[];
  readonly marketSize?: string;
  readonly marketTrends?: string[];
  readonly competitiveLandscape: CompetitiveLandscape;
  readonly regulatoryEnvironment?: string[];
}

export interface CompetitiveLandscape {
  readonly directCompetitors: Competitor[];
  readonly indirectCompetitors?: Competitor[];
  readonly marketLeaders?: string[];
  readonly differentiators: string[];
}

export interface Competitor {
  readonly name: string;
  readonly strengths: string[];
  readonly weaknesses: string[];
  readonly positioning: string;
  readonly keyMessages?: string[];
}

export interface ProductService {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly features: string[];
  readonly benefits: string[];
  readonly pricePoint?: string;
  readonly availability?: string;
}

// ============================================================================
// Campaign Constraints & Requirements
// ============================================================================

export interface BudgetConstraints {
  readonly total: number;
  readonly currency: string;
  readonly breakdown?: BudgetBreakdown[];
  readonly flexibility?: 'fixed' | 'flexible' | 'range';
}

export interface BudgetBreakdown {
  readonly category: string;
  readonly amount: number;
  readonly percentage?: number;
}

export interface TimelineConstraints {
  readonly startDate: string;     // ISO 8601
  readonly endDate?: string;      // ISO 8601
  readonly milestones: Milestone[];
  readonly urgency?: 'low' | 'medium' | 'high' | 'critical';
}

export interface Milestone {
  readonly name: string;
  readonly date: string;          // ISO 8601
  readonly deliverables: string[];
  readonly dependencies?: string[];
}

export interface AssetRequirement {
  readonly assetType: AssetType;
  readonly quantity: number;
  readonly specifications: AssetSpecification;
  readonly priority: 'required' | 'preferred' | 'optional';
}

export enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  COPY = 'copy',
  GRAPHIC = 'graphic',
  ANIMATION = 'animation',
  DOCUMENT = 'document',
  PRESENTATION = 'presentation',
  LANDING_PAGE = 'landing_page',
  EMAIL_TEMPLATE = 'email_template',
  SOCIAL_POST = 'social_post',
  AD_CREATIVE = 'ad_creative',
  CUSTOM = 'custom',
}

export interface AssetSpecification {
  readonly format?: string[];
  readonly dimensions?: Dimensions;
  readonly duration?: number;       // seconds for video/audio
  readonly aspectRatio?: string[];
  readonly fileSize?: FileSizeConstraint;
  readonly quality?: QualityLevel;
  readonly accessibility?: AccessibilityRequirement[];
  readonly localization?: boolean;
  readonly variations?: number;
}

export interface Dimensions {
  readonly width?: number;
  readonly height?: number;
  readonly unit?: 'px' | 'in' | 'cm' | 'mm';
}

export interface FileSizeConstraint {
  readonly max: number;
  readonly unit: 'KB' | 'MB' | 'GB';
}

export enum QualityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
  PRINT_QUALITY = 'print_quality',
}

export interface AccessibilityRequirement {
  readonly standard: 'WCAG_2_1_A' | 'WCAG_2_1_AA' | 'WCAG_2_1_AAA' | 'ADA' | 'SECTION_508';
  readonly requirements: string[];
}

export interface ExistingAsset {
  readonly id: string;
  readonly name: string;
  readonly type: AssetType;
  readonly url: string;
  readonly description?: string;
  readonly usageRights?: string;
  readonly restrictions?: string[];
}

export interface CreativeReference {
  readonly id: string;
  readonly title: string;
  readonly source: string;
  readonly url?: string;
  readonly description: string;
  readonly reasonForInclusion: string;
  readonly whatToAvoid?: string;
}

export interface ComplianceRequirement {
  readonly regulation: string;
  readonly jurisdiction: string;
  readonly requirements: string[];
  readonly severity: 'mandatory' | 'recommended' | 'advisory';
  readonly documentationUrl?: string;
}

export interface SuccessMetric {
  readonly name: string;
  readonly description: string;
  readonly target?: number;
  readonly unit?: string;
  readonly measurementMethod?: string;
  readonly priority: 'primary' | 'secondary' | 'tertiary';
}

// ============================================================================
// Creative Brief (Output)
// ============================================================================

/**
 * Creative Brief is the structured output that feeds into Creative IR.
 * It is generated automatically from Business Brief + Brand Profile.
 */
export interface CreativeBrief {
  readonly id: CreativeBriefId;
  readonly campaignId: string;
  readonly brandProfileId?: string;
  readonly version: string;
  readonly status: CreativeBriefStatus;
  
  // Campaign Context
  readonly campaignContext: CampaignContext;
  
  // Objectives
  readonly businessObjectives: BusinessObjective[];
  readonly communicationObjectives: CommunicationObjective[];
  
  // Audience
  readonly targetAudience: TargetAudience;
  
  // Messaging
  readonly keyMessages: Message[];
  readonly messagingFramework: MessagingFramework;
  
  // Creative Direction
  readonly toneOfVoice: ToneOfVoice;
  readonly emotionalDirection: EmotionalDirection;
  readonly visualDirection: VisualDirection;
  
  // Action & Metrics
  readonly desiredUserAction: DesiredAction;
  readonly successMetrics: BriefSuccessMetric[];
  
  // Deliverables
  readonly deliverables: Deliverable[];
  
  // Constraints
  readonly creativeConstraints: CreativeConstraint[];
  readonly channelStrategy: ChannelStrategy;
  
  // References
  readonly brandReferences: BrandReference[];
  readonly inspirationReferences: CreativeReference[];
  
  // Priority Matrix
  readonly priorityMatrix: PriorityMatrix;
  
  // Metadata
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly approvedBy?: string;
  readonly approvalDate?: string;
}

export enum CreativeBriefStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export interface CampaignContext {
  readonly name: string;
  readonly type: CampaignType;
  readonly goal: string;
  readonly background: string;
  readonly competitiveContext: string;
  readonly marketOpportunity: string;
  readonly timeline: TimelineConstraints;
  readonly budget?: BudgetConstraints;
}

export interface BusinessObjective {
  readonly id: string;
  readonly description: string;
  readonly metric: string;
  readonly target?: number;
  readonly priority: 'primary' | 'secondary' | 'tertiary';
}

export interface CommunicationObjective {
  readonly id: string;
  readonly description: string;
  readonly intendedEffect: 'awareness' | 'consideration' | 'conversion' | 'loyalty' | 'advocacy';
  readonly targetAudienceSegment?: string;
  readonly priority: 'primary' | 'secondary' | 'tertiary';
}

export interface TargetAudience {
  readonly primarySegment: AudienceSegment;
  readonly secondarySegments?: AudienceSegment[];
  readonly personas: CustomerPersona[];
  readonly insights: AudienceInsight[];
}

export interface AudienceSegment {
  readonly id: AudienceSegmentId;
  readonly name: string;
  readonly description: string;
  readonly size?: number;
  readonly demographics: Demographics;
  readonly psychographics: Psychographics;
  readonly behaviors: Behaviors;
  readonly mediaHabits: MediaHabit[];
  readonly purchaseDrivers: string[];
  readonly barriers: string[];
}

export interface AudienceInsight {
  readonly insight: string;
  readonly source?: string;
  readonly implication: string;
  readonly relevance: 'high' | 'medium' | 'low';
}

export interface MediaHabit {
  readonly channel: CommunicationChannel;
  readonly frequency: 'daily' | 'weekly' | 'monthly' | 'occasionally' | 'rarely';
  readonly preferredTime?: string;
  readonly engagement?: 'high' | 'medium' | 'low';
}

export interface Message {
  readonly id: MessageId;
  readonly type: MessageType;
  readonly content: string;
  readonly supportingPoints?: string[];
  readonly targetSegment?: AudienceSegmentId;
  readonly channel?: CommunicationChannel[];
  readonly priority: 'primary' | 'secondary' | 'tertiary';
}

export enum MessageType {
  CORE_MESSAGE = 'core_message',
  BRAND_PROMISE = 'brand_promise',
  VALUE_PROPOSITION = 'value_proposition',
  PROOF_POINT = 'proof_point',
  CALL_TO_ACTION = 'call_to_action',
  SUPPORTING_MESSAGE = 'supporting_message',
  BENEFIT_STATEMENT = 'benefit_statement',
  DIFFERENTIATOR = 'differentiator',
}

export interface MessagingFramework {
  readonly bigIdea: string;
  readonly messagingPillars: MessagingPillar[];
  readonly narrativeArc?: string;
  readonly storyHooks: string[];
  readonly consistencyGuidelines: string[];
}

export interface MessagingPillar {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly messages: Message[];
  readonly supportingEvidence?: string[];
}

export interface ToneOfVoice {
  readonly personality: string[];
  readonly traits: string[];
  readonly doExamples: string[];
  readonly dontExamples: string[];
  readonly voiceAttributes: VoiceAttribute[];
}

export interface VoiceAttribute {
  readonly spectrum: string;      // e.g., "Formal to Casual"
  readonly position: number;      // 1-5 scale
  readonly description: string;
}

export interface EmotionalDirection {
  readonly primaryEmotion: string;
  readonly secondaryEmotions: string[];
  readonly emotionalJourney: EmotionalBeat[];
  readonly avoidEmotions: string[];
}

export interface EmotionalBeat {
  readonly phase: string;
  readonly emotion: string;
  readonly intensity: number;     // 1-10 scale
  readonly trigger: string;
}

export interface VisualDirection {
  readonly visualConcept: string;
  readonly visualThemes: string[];
  readonly colorMood: string;
  readonly aestheticStyle: string;
  readonly visualReferences: CreativeReference[];
  readonly prohibitedVisuals: string[];
}

export interface DesiredAction {
  readonly primary: Action;
  readonly secondary?: Action[];
  readonly conversionFunnel: FunnelStage[];
}

export interface Action {
  readonly description: string;
  readonly verb: string;
  readonly object: string;
  readonly context?: string;
  readonly measurement?: string;
}

export interface FunnelStage {
  readonly stage: 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase' | 'loyalty';
  readonly action: string;
  readonly metric?: string;
}

export interface BriefSuccessMetric {
  readonly id: string;
  readonly category: 'business' | 'communication' | 'creative' | 'operational';
  readonly name: string;
  readonly description: string;
  readonly target?: number;
  readonly unit?: string;
  readonly measurementMethod?: string;
  readonly priority: 'primary' | 'secondary' | 'tertiary';
}

export interface Deliverable {
  readonly id: string;
  readonly name: string;
  readonly type: AssetType;
  readonly quantity: number;
  readonly specifications: AssetSpecification;
  readonly channels: CommunicationChannel[];
  readonly dueDate?: string;
  readonly priority: 'required' | 'preferred' | 'optional';
}

export interface CreativeConstraint {
  readonly type: CreativeConstraintType;
  readonly description: string;
  readonly rationale: string;
  readonly impact: 'blocking' | 'warning' | 'advisory';
  readonly applicableTo?: string[];    // channels, asset types, etc.
}

export enum CreativeConstraintType {
  TECHNICAL = 'technical',
  LEGAL = 'legal',
  BRAND = 'brand',
  CREATIVE = 'creative',
  RESOURCE = 'resource',
  BUDGET = 'budget',
  TIMELINE = 'timeline',
  COMPLIANCE = 'compliance',
  ACCESSIBILITY = 'accessibility',
  CULTURAL = 'cultural',
}

export interface ChannelStrategy {
  readonly channels: ChannelPlan[];
  readonly crossChannelSynergy: string;
  readonly sequencing?: ChannelSequence[];
  readonly budgetAllocation?: ChannelBudget[];
}

export interface ChannelPlan {
  readonly channel: CommunicationChannel;
  readonly role: ChannelRole;
  readonly objectives: string[];
  readonly assetTypes: AssetType[];
  readonly contentStrategy: string;
  readonly timing: string;
  readonly kpis: string[];
}

export enum ChannelRole {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  SUPPORT = 'support',
  AMPLIFICATION = 'amplification',
  RETARGETING = 'retargeting',
}

export interface ChannelSequence {
  readonly phase: string;
  readonly channels: CommunicationChannel[];
  readonly duration?: number;
  readonly objective: string;
}

export interface ChannelBudget {
  readonly channel: CommunicationChannel;
  readonly amount: number;
  readonly percentage: number;
}

export interface BrandReference {
  readonly element: string;        // "logo", "colors", "typography", etc.
  readonly requirement: string;
  readonly source?: string;
  readonly examples?: string[];
}

export interface PriorityMatrix {
  readonly mustHave: string[];
  readonly shouldHave: string[];
  readonly couldHave: string[];
  readonly wontHave: string[];
  readonly tradeoffs: Tradeoff[];
}

export interface Tradeoff {
  readonly description: string;
  readonly option1: string;
  readonly option2: string;
  readonly recommendation: string;
  readonly rationale: string;
}

// ============================================================================
// Campaign Package (Processed)
// ============================================================================

/**
 * Campaign Package is the fully processed campaign representation
 * combining business brief, brand profile, and creative brief.
 */
export interface CampaignPackage {
  readonly id: CampaignPackageId;
  readonly campaignId: string;
  readonly version: string;
  readonly status: CampaignPackageStatus;
  readonly businessBrief: BusinessBriefInput;
  readonly creativeBrief: CreativeBrief;
  readonly brandProfileId?: string;
  readonly validationResult: CampaignValidationResult;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export enum CampaignPackageStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  APPROVED = 'approved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export interface CampaignValidationResult {
  readonly valid: boolean;
  readonly errors: CampaignValidationError[];
  readonly warnings: CampaignValidationWarning[];
  readonly metadata: {
    validatedAt: string;
    validator: string;
    validationTime: number;
    rulesChecked: number;
    rulesPassed: number;
  };
}

export interface CampaignValidationError {
  readonly code: string;
  readonly message: string;
  readonly severity: 'critical' | 'high' | 'medium';
  readonly path?: string;
  readonly suggestion?: string;
}

export interface CampaignValidationWarning {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

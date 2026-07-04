/**
 * Creative Intermediate Representation (Creative IR) Types
 *
 * This module defines the complete type system for Creative IR.
 * Creative IR is the canonical, machine-readable representation of every creative artifact.
 *
 * Key Principles:
 * - Single Source of Truth for all creative work
 * - Automatically generated from Business Brief + Brand + Campaign + Feedback
 * - Never user-edited directly
 * - Machine-readable and deterministic
 * - Provider-neutral (no AI provider coupling)
 * - Versioned and stable for cross-engine integration
 */

import type { ISO8601Timestamp, UserId } from '@creative-factory/domain';

// ============================================================================
// Root Document
// ============================================================================

export interface CreativeIR {
  readonly version: string;
  readonly id: CreativeIRId;
  readonly createdAt: ISO8601Timestamp;
  readonly updatedAt: ISO8601Timestamp;
  readonly revisionHistory: RevisionRecord[];
  readonly campaign: Campaign;
  readonly creativeContext: CreativeContext;
  readonly stories: Story[];
  readonly brandTokens: BrandTokens;
  readonly designTokens: DesignTokens;
  readonly assetRequests: AssetRequest[];
  readonly reviews: Review[];
  readonly exports: ExportMetadata[];
  readonly validationStatus: ValidationStatus;
  readonly compilerMetadata: CompilerMetadata;
}

export type CreativeIRId = string & { readonly __brand: 'CreativeIRId' };

// ============================================================================
// Campaign & Context
// ============================================================================

export interface Campaign {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly objective: string;
  readonly targetAudience: TargetAudience;
  readonly duration: Duration;
  readonly aspectRatios: AspectRatio[];
  readonly languages: Language[];
  readonly marketRegions: Region[];
  readonly lifecycleState: CampaignLifecycleState;
  readonly approvalState: ApprovalState;
  readonly createdBy: UserId;
  readonly updatedBy: UserId;
}

export interface TargetAudience {
  readonly demographics: Demographic[];
  readonly psychographics: string[];
  readonly mediaPreferences: string[];
  readonly geographies: Region[];
}

export interface Demographic {
  readonly age: AgeRange;
  readonly gender?: string;
  readonly income?: IncomeRange;
  readonly education?: string;
}

export interface AgeRange {
  readonly min: number;
  readonly max: number;
}

export interface IncomeRange {
  readonly min: number;
  readonly max: number;
}

export interface Duration {
  readonly minutes: number;
  readonly seconds: number;
  readonly frames?: number;
  readonly frameRate?: number;
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9';
export type Language = string; // ISO 639-1
export type Region = string; // ISO 3166-1 alpha-2

export interface CreativeContext {
  readonly briefId: string;
  readonly briefTitle: string;
  readonly briefObjective: string;
  readonly creativeDirection: string;
  readonly moodAndTone: MoodAndTone;
  readonly visualStyle: VisualStyle;
  readonly narrativeTheme: string;
  readonly keyMessages: string[];
  readonly callToAction: string;
  readonly brandGuidelines: BrandGuidelines;
  readonly competitiveContext?: string;
  readonly constraints: Constraint[];
  readonly approvedBy?: UserId;
  readonly approvalDate?: ISO8601Timestamp;
}

export interface MoodAndTone {
  readonly primary: string;
  readonly secondary: string[];
  readonly avoided: string[];
}

export interface VisualStyle {
  readonly cinematography: string;
  readonly colorPalette: string[];
  readonly lighting: string;
  readonly composition: string;
  readonly references: Reference[];
}

export interface Reference {
  readonly title: string;
  readonly url?: string;
  readonly creator?: string;
  readonly description?: string;
}

export interface BrandGuidelines {
  readonly logoUsage: string;
  readonly colorRules: ColorRule[];
  readonly typographyRules: TypographyRule[];
  readonly voiceAndTone: VoiceAndTone;
  readonly prohibitedElements: string[];
}

export interface ColorRule {
  readonly color: string;
  readonly usage: string;
  readonly context: string[];
}

export interface TypographyRule {
  readonly fontFamily: string;
  readonly fontWeight: string | number;
  readonly fontSize: number;
  readonly usage: string;
}

export interface VoiceAndTone {
  readonly personality: string[];
  readonly toneInContext: Record<string, string>;
  readonly doNotUse: string[];
}

export interface Constraint {
  readonly type: 'technical' | 'legal' | 'brand' | 'creative' | 'resource';
  readonly description: string;
  readonly impact: 'blocking' | 'warning' | 'advisory';
}

export type CampaignLifecycleState =
  | 'DRAFT'
  | 'BRIEF_READY'
  | 'STRATEGY_DRAFT'
  | 'STRATEGY_REVIEW'
  | 'STORYBOARD_DRAFT'
  | 'STORYBOARD_REVIEW'
  | 'PROMPT_READY'
  | 'ASSET_GENERATION_PENDING'
  | 'ASSET_GENERATION_RUNNING'
  | 'ASSET_REVIEW'
  | 'FINAL_APPROVAL'
  | 'EXPORTING'
  | 'COMPLETED'
  | 'CANCELLED';

export type ApprovalState = 'pending' | 'approved' | 'rejected' | 'changes-requested';

// ============================================================================
// Narrative Structure (Stories, Storyboards, Scenes, Shots)
// ============================================================================

export interface Story {
  readonly id: StoryId;
  readonly title: string;
  readonly description: string;
  readonly sequence: number;
  readonly durationFrames: number;
  readonly storyboards: Storyboard[];
  readonly reviewState: ReviewState;
  readonly approvalState: ApprovalState;
  readonly metadata: Record<string, unknown>;
}

export type StoryId = string & { readonly __brand: 'StoryId' };

export interface Storyboard {
  readonly id: StoryboardId;
  readonly title: string;
  readonly description?: string;
  readonly sequence: number;
  readonly scenes: Scene[];
  readonly duration: Duration;
  readonly reviewNotes?: string;
}

export type StoryboardId = string & { readonly __brand: 'StoryboardId' };

export interface Scene {
  readonly id: SceneId;
  readonly title: string;
  readonly description?: string;
  readonly sequence: number;
  readonly narrativeText: string;
  /**
   * Strategic objectives for the scene. Optional and additive (schema-compatible with 1.0.0
   * documents that predate it); populated by the Creative IR Compiler so downstream Scene
   * Specification outputs are complete.
   */
  readonly objectives?: SceneObjectives;
  readonly shots: Shot[];
  readonly transitions: Transition[];
  readonly audioSpecs: AudioSpecification;
  readonly duration: Duration;
  readonly reviewNotes?: string;
}

export interface SceneObjectives {
  readonly purpose: string;
  readonly narrativeGoal: string;
  readonly businessGoal: string;
  readonly audienceImpact: string;
  readonly emotion: string;
}

export type SceneId = string & { readonly __brand: 'SceneId' };

export interface Shot {
  readonly id: ShotId;
  readonly sequence: number;
  readonly description: string;
  readonly duration: Duration;
  readonly visualSpec: VisualSpecification;
  readonly motionSpec: MotionSpecification;
  readonly audioElements: AudioElement[];
  readonly assetRequests: string[];
  readonly reviewNotes?: string;
}

export type ShotId = string & { readonly __brand: 'ShotId' };

export interface Transition {
  readonly type: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'zoom' | 'pan';
  readonly duration: Duration;
  readonly easing?: string;
  readonly description?: string;
}

export type ReviewState = 'not-started' | 'in-progress' | 'completed' | 'revision-needed';

// ============================================================================
// Visual Specifications
// ============================================================================

export interface VisualSpecification {
  readonly shotType: ShotType;
  readonly camera: CameraConfiguration;
  readonly composition: CompositionSpec;
  readonly lighting: LightingSpec;
  readonly colorGrading: ColorGradingSpec;
  readonly foregroundElements: VisualElement[];
  readonly backgroundElements: VisualElement[];
  readonly specialEffects: SpecialEffect[];
  readonly props: Prop[];
  readonly talent: TalentDirection[];
}

export type ShotType =
  | 'wide'
  | 'medium'
  | 'close-up'
  | 'extreme-close-up'
  | 'aerial'
  | 'pov'
  | 'over-shoulder'
  | 'two-shot'
  | 'group';

export interface CameraConfiguration {
  readonly movement: CameraMovement;
  readonly angle: CameraAngle;
  readonly lens: LensSpec;
  readonly focus: FocusSpec;
  readonly depth: number;
}

export type CameraMovement =
  | 'static'
  | 'pan'
  | 'tilt'
  | 'dolly'
  | 'crane'
  | 'orbit'
  | 'tracking'
  | 'reveal';

export interface CameraAngle {
  readonly pitch: number;
  readonly yaw: number;
  readonly roll: number;
}

export interface LensSpec {
  readonly type: string;
}

export interface FocusSpec {
  readonly type: string;
}

export interface CompositionSpec {
  readonly rule: 'rule-of-thirds' | 'center' | 'leading-lines' | 'depth';
  readonly subjectPlacement: string;
  readonly balanceType: 'symmetrical' | 'asymmetrical' | 'radial';
}

export interface LightingSpec {
  readonly type: 'three-point' | 'two-point' | 'backlighting' | 'sidelighting' | 'practical';
  readonly keyLight: LightDescription;
  readonly fillLight?: LightDescription;
  readonly backLight?: LightDescription;
  readonly ambientLight?: LightDescription;
  readonly shadows: string;
  readonly mood: string;
}

export interface LightDescription {
  readonly intensity: number;
  readonly color: string;
  readonly direction: string;
  readonly softness: number;
}

export interface ColorGradingSpec {
  readonly look: string;
  readonly colorCast: string;
  readonly saturation: number;
  readonly contrast: number;
  readonly highlights: number;
  readonly shadows: number;
  readonly temperature: number;
}

export interface VisualElement {
  readonly id: string;
  readonly type: string;
  readonly description: string;
  readonly position?: Vector2D;
  readonly scale?: Vector2D;
  readonly rotation?: number;
  readonly opacity?: number;
}

export interface Vector2D {
  readonly x: number;
  readonly y: number;
}

export interface Vector3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface SpecialEffect {
  readonly type: string;
  readonly description: string;
  readonly parameters: Record<string, unknown>;
  readonly timing: Timing;
}

export interface Prop {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly visualCharacteristics: string;
  readonly sourceAssets?: string[];
}

export interface TalentDirection {
  readonly talentId: string;
  readonly action: string;
  readonly emotion: string;
  readonly positioning: string;
  readonly facialExpression: string;
}

// ============================================================================
// Motion Specifications
// ============================================================================

export interface MotionSpecification {
  readonly cameraMotion: CameraMotionKeyframes[];
  readonly objectMotions: ObjectMotion[];
  readonly particleEffects: ParticleEffect[];
  readonly dynamicsSimulation?: DynamicsSimulation;
}

export interface CameraMotionKeyframes {
  readonly time: number;
  readonly position: Vector3D;
  readonly rotation: Rotation3D;
  readonly focalLength: number;
  readonly focusDistance: number;
  readonly easing: EasingFunction;
}

export type EasingFunction =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'cubic-bezier'
  | 'spring';

export interface Rotation3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface ObjectMotion {
  readonly objectId: string;
  readonly keyframes: MotionKeyframe[];
  readonly loop: boolean;
  readonly physics?: PhysicsProps;
}

export interface MotionKeyframe {
  readonly time: number;
  readonly position: Vector3D;
  readonly rotation: Rotation3D;
  readonly scale: Vector3D;
  readonly easing: EasingFunction;
}

export interface ParticleEffect {
  readonly id: string;
  readonly type: string;
  readonly emitterPosition: Vector3D;
  readonly emission: Record<string, unknown>;
  readonly lifespan: number;
  readonly physics: ParticlePhysics;
}

export interface PhysicsProps {
  readonly mass: number;
  readonly drag: number;
  readonly angularDrag: number;
}

export interface ParticlePhysics {
  readonly velocity: Vector3D;
  readonly acceleration: Vector3D;
  readonly rotation: Vector3D;
  readonly lifetime: number;
  readonly drag: number;
}

export interface DynamicsSimulation {
  readonly gravity: Vector3D;
  readonly wind: Vector3D;
  readonly friction: number;
  readonly elasticity: number;
}

export interface Timing {
  readonly startTime: number;
  readonly duration: number;
  readonly easing?: EasingFunction;
}

// ============================================================================
// Audio Specifications
// ============================================================================

export interface AudioSpecification {
  readonly voiceover?: VoiceoverSpec;
  readonly music?: MusicSpec;
  readonly soundEffects: SoundEffect[];
  readonly ambience?: AmbienceSpec;
  readonly mixing: MixingSpec;
  readonly localization?: LocalizationSpec;
}

export interface AudioElement {
  readonly id: string;
  readonly type: string;
  readonly description: string;
}

export interface VoiceoverSpec {
  readonly script: string;
  readonly language: Language;
  readonly style: string;
  readonly pacing: string;
  readonly emotionalTone: string;
  readonly deliveryNotes: string;
}

export interface MusicSpec {
  readonly mood: string;
  readonly tempo: number;
  readonly genre: string;
  readonly instrumentation: string[];
  readonly intensity: number;
  readonly notes: string;
  readonly licensingRequirements?: string;
}

export interface SoundEffect {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly timing: Timing;
  readonly volume: number;
  readonly effects?: AudioEffect[];
}

export interface AudioEffect {
  readonly type: string;
  readonly parameters: Record<string, number>;
}

export interface AmbienceSpec {
  readonly description: string;
  readonly elements: string[];
  readonly volume: number;
}

export interface MixingSpec {
  readonly masterVolume: number;
  readonly voiceoverLevel: number;
  readonly musicLevel: number;
  readonly effectsLevel: number;
  readonly ambienceLevel: number;
  readonly dynamicRangeCompression: boolean;
  readonly normalization: boolean;
}

export interface LocalizationSpec {
  readonly targetLanguages: Language[];
  readonly voiceoverPerLanguage: Record<Language, VoiceoverSpec>;
  readonly subtitles?: SubtitleSpec;
}

export interface SubtitleSpec {
  readonly format: 'vtt' | 'srt' | 'ass';
  readonly languages: Language[];
  readonly styling: Record<string, unknown>;
}

// ============================================================================
// Brand & Design Tokens
// ============================================================================

export interface BrandTokens {
  readonly brandId: string;
  readonly brandName: string;
  readonly primaryColors: ColorToken[];
  readonly secondaryColors: ColorToken[];
  readonly accentColors: ColorToken[];
  readonly typography: TypographyToken[];
  readonly logoVariations: LogoVariation[];
  readonly imageryGuidelines: ImageryGuideline[];
  readonly voiceAndTone: VoiceAndToneToken;
  readonly prohibitedElements: ProhibitedElement[];
  readonly brandPersonality: BrandPersonality;
}

export interface ColorToken {
  readonly name: string;
  readonly hex: string;
  readonly rgb: RGB;
  readonly hsl: HSL;
  readonly usage: string;
  readonly context: string[];
}

export interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export interface HSL {
  readonly h: number;
  readonly s: number;
  readonly l: number;
}

export interface TypographyToken {
  readonly name: string;
  readonly fontFamily: string;
  readonly fontWeight: string | number;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly letterSpacing: number;
  readonly usage: string;
}

export interface LogoVariation {
  readonly type: 'primary' | 'secondary' | 'monochrome' | 'icon';
  readonly description: string;
  readonly minimumSize: number;
  readonly clearanceRules: string;
  readonly usageContext: string[];
}

export interface ImageryGuideline {
  readonly category: string;
  readonly description: string;
  readonly visualCharacteristics: string[];
  readonly examples?: string[];
  readonly prohibited: string[];
}

export interface VoiceAndToneToken {
  readonly personality: string[];
  readonly toneInContext: Record<string, string>;
  readonly doNotUse: string[];
}

export interface BrandPersonality {
  readonly primaryTraits: string[];
  readonly secondaryTraits: string[];
  readonly communicationStyle: string;
  readonly valuePropositions: string[];
}

export interface ProhibitedElement {
  readonly type: string;
  readonly description: string;
  readonly reason: string;
  readonly context?: string;
}

export interface DesignTokens {
  readonly spacing: SpacingToken[];
  readonly sizing: SizingToken[];
  readonly shadows: ShadowToken[];
  readonly borders: BorderToken[];
  readonly animations: AnimationToken[];
  readonly breakpoints: BreakpointToken[];
}

export interface SpacingToken {
  readonly name: string;
  readonly value: number;
  readonly unit: string;
}

export interface SizingToken {
  readonly name: string;
  readonly width?: number;
  readonly height?: number;
  readonly unit: string;
}

export interface ShadowToken {
  readonly name: string;
  readonly color: string;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly blur: number;
  readonly spread: number;
}

export interface BorderToken {
  readonly name: string;
  readonly width: number;
  readonly style: string;
  readonly color: string;
  readonly radius?: number;
}

export interface AnimationToken {
  readonly name: string;
  readonly duration: number;
  readonly easing: EasingFunction;
  readonly delay?: number;
}

export interface BreakpointToken {
  readonly name: string;
  readonly minWidth: number;
  readonly maxWidth?: number;
}

// ============================================================================
// Asset Requests & Outputs
// ============================================================================

export interface AssetRequest {
  readonly id: AssetRequestId;
  readonly createdAt: ISO8601Timestamp;
  readonly shotId: ShotId;
  readonly assetType: AssetType;
  readonly specifications: AssetSpecification;
  readonly quantity: number;
  readonly priority: 'critical' | 'high' | 'medium' | 'low';
  readonly deadline?: ISO8601Timestamp;
  readonly deliveredAssets: AssetOutput[];
  readonly qaStatus: 'pending' | 'in-progress' | 'approved' | 'rejected';
  readonly metadata: Record<string, unknown>;
}

export type AssetRequestId = string & { readonly __brand: 'AssetRequestId' };

export type AssetType = 'image' | 'video' | 'audio' | 'animation' | '3d-model' | 'text';

export interface AssetSpecification {
  readonly description: string;
  readonly dimensions: AssetDimension;
  readonly format: string;
  readonly colorSpace: string;
  readonly quality: string;
  readonly constraints: AssetConstraint[];
}

export interface AssetDimension {
  readonly width: number;
  readonly height: number;
  readonly depth?: number;
  readonly duration?: Duration;
  readonly framerate?: number;
}

export interface AssetConstraint {
  readonly type: string;
  readonly value: unknown;
}

export interface AssetOutput {
  readonly id: string;
  readonly requestId: AssetRequestId;
  readonly format: string;
  readonly url: string;
  readonly metadata: AssetMetadata;
  readonly generatedAt: ISO8601Timestamp;
  readonly generatedBy: string;
  readonly provenance: Provenance;
}

export interface AssetMetadata {
  readonly width: number;
  readonly height: number;
  readonly fileSize: number;
  readonly duration?: Duration;
  readonly colorSpace: string;
  readonly bitDepth?: number;
  readonly frameCount?: number;
  readonly framerate?: number;
}

export interface Provenance {
  readonly sourceEngine: string;
  readonly sourceModel?: string;
  readonly sourceVersion?: string;
  readonly parameters: Record<string, unknown>;
  readonly seed?: string;
  readonly generationTime: number;
}

// ============================================================================
// Reviews & Approvals
// ============================================================================

export interface Review {
  readonly id: ReviewId;
  readonly createdAt: ISO8601Timestamp;
  readonly reviewedBy: UserId;
  readonly reviewType: 'strategy' | 'storyboard' | 'assets' | 'final';
  readonly status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  readonly targetId: string;
  readonly decision: 'approved' | 'approved-with-changes' | 'rejected' | 'pending';
  readonly comments: ReviewComment[];
  readonly attachments: Attachment[];
  readonly deadline?: ISO8601Timestamp;
}

export type ReviewId = string & { readonly __brand: 'ReviewId' };

export interface ReviewComment {
  readonly id: string;
  readonly author: UserId;
  readonly timestamp: ISO8601Timestamp;
  readonly text: string;
  readonly attachments?: Attachment[];
  readonly resolved: boolean;
}

export interface Attachment {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly url: string;
  readonly uploadedAt: ISO8601Timestamp;
  readonly uploadedBy: UserId;
}

export interface Approval {
  readonly id: string;
  readonly approverUserId: UserId;
  readonly approvalType: 'creative' | 'brand' | 'legal' | 'final';
  readonly timestamp: ISO8601Timestamp;
  readonly status: 'pending' | 'approved' | 'rejected';
  readonly comment?: string;
  readonly approvalLevel: number;
}

// ============================================================================
// Export & Compilation
// ============================================================================

export interface ExportMetadata {
  readonly id: string;
  readonly createdAt: ISO8601Timestamp;
  readonly exportedBy: UserId;
  readonly exportFormat: ExportFormat;
  readonly adapterUsed: string;
  readonly targetPlatform: string;
  readonly artifacts: ExportArtifact[];
  readonly status: 'pending' | 'processing' | 'completed' | 'failed';
  readonly errorLog?: string;
}

export type ExportFormat =
  | 'storyboard-html'
  | 'scene-spec-pdf'
  | 'shot-list-json'
  | 'motion-spec-json'
  | 'prompt-package-json'
  | 'image-generation-requests'
  | 'video-generation-requests'
  | 'qa-spec-json'
  | 'production-package';

export interface ExportArtifact {
  readonly format: string;
  readonly url: string;
  readonly size: number;
  readonly generatedAt: ISO8601Timestamp;
  readonly metadata: Record<string, unknown>;
}

export interface CompilerMetadata {
  readonly compileVersion: string;
  readonly compileTimestamp: ISO8601Timestamp;
  readonly sourceComponents: SourceComponent[];
  readonly compileRules: string[];
  readonly adapterMetadata: Record<string, AdapterCompileMetadata>;
  readonly diagnostics: Diagnostic[];
}

export interface SourceComponent {
  readonly id: string;
  readonly type: string;
  readonly version: string;
  readonly checksum: string;
}

export interface AdapterCompileMetadata {
  readonly adapterName: string;
  readonly adapterVersion: string;
  readonly outputCount: number;
  readonly compileDuration: number;
}

export interface Diagnostic {
  readonly level: 'info' | 'warning' | 'error';
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly suggestion?: string;
}

// ============================================================================
// Validation & Versioning
// ============================================================================

export interface ValidationStatus {
  readonly isValid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
  readonly lastValidatedAt: ISO8601Timestamp;
}

export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly severity: 'critical' | 'high' | 'medium';
}

export interface ValidationWarning {
  readonly code: string;
  readonly message: string;
  readonly path: string;
}

export interface RevisionRecord {
  readonly version: number;
  readonly timestamp: ISO8601Timestamp;
  readonly actor: UserId;
  readonly changeDescription: string;
  readonly previousVersionId?: string;
  readonly metadata: Record<string, unknown>;
}

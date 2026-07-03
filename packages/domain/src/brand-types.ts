/**
 * Brand Engine Core Types
 *
 * Defines the type system for brand management, import, validation, and tokenization.
 * Brand data is the single source of truth for all visual identity across the platform.
 */

import type { BrandId } from './identity.js';

// ============================================================================
// Brand Identifiers
// ============================================================================

export type { BrandId } from './identity.js';
export type BrandProfileId = string & { readonly __brand: 'BrandProfileId' };
export type BrandPackageId = string & { readonly __brand: 'BrandPackageId' };

// ============================================================================
// Brand Package (Input)
// ============================================================================

/**
 * Brand Package is the input container for all brand data.
 * It can include guidelines, assets, tokens, and rules.
 */
export interface BrandPackage {
  readonly id: BrandPackageId;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly sourceFormat: BrandSourceFormat;
  readonly sourceUrl?: string;
  readonly metadata: Record<string, unknown>;
  readonly components: BrandComponent[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export enum BrandSourceFormat {
  MARKDOWN = 'markdown',
  PDF = 'pdf',
  FIGMA = 'figma',
  YAML = 'yaml',
  JSON = 'json',
  ZIP_ARCHIVE = 'zip',
  CUSTOM = 'custom',
}

export interface BrandComponent {
  readonly type: BrandComponentType;
  readonly name: string;
  readonly description?: string;
  readonly content: BrandComponentContent;
  readonly metadata: Record<string, unknown>;
}

export enum BrandComponentType {
  GUIDELINE_DOCUMENT = 'guideline-document',
  LOGO = 'logo',
  TYPOGRAPHY = 'typography',
  COLOR_PALETTE = 'color-palette',
  ICON_LIBRARY = 'icon-library',
  ILLUSTRATION_LIBRARY = 'illustration-library',
  PHOTOGRAPHY_GUIDE = 'photography-guide',
  MOTION_GUIDELINES = 'motion-guidelines',
  TONE_OF_VOICE = 'tone-of-voice',
  TEMPLATE = 'template',
  DESIGN_TOKENS = 'design-tokens',
  COMPONENT_LIBRARY = 'component-library',
  CUSTOM = 'custom',
}

export interface BrandComponentContent {
  readonly format: string;
  readonly data: string | object;
  readonly url?: string;
  readonly binaryData?: Buffer;
}

// ============================================================================
// Brand Import Result
// ============================================================================

export interface BrandImportResult {
  readonly packageId: BrandPackageId;
  readonly success: boolean;
  readonly components: ImportedComponent[];
  readonly errors: ImportError[];
  readonly warnings: ImportWarning[];
  readonly metadata: ImportMetadata;
}

export interface ImportedComponent {
  readonly type: BrandComponentType;
  readonly name: string;
  readonly parsed: boolean;
  readonly data?: unknown;
  readonly error?: string;
}

export interface ImportError {
  readonly component?: BrandComponentType;
  readonly message: string;
  readonly severity: 'critical' | 'high' | 'medium';
  readonly suggestion?: string;
}

export interface ImportWarning {
  readonly component?: BrandComponentType;
  readonly message: string;
}

export interface ImportMetadata {
  readonly importedAt: string;
  readonly importer: string;
  readonly importTime: number;
  readonly componentCount: number;
}

// ============================================================================
// Brand Profile (Processed)
// ============================================================================

/**
 * Brand Profile is the normalized, processed representation of a brand.
 * It's the output of the Brand Engine and serves as input to Creative IR.
 */
export interface BrandProfile {
  readonly id: BrandProfileId;
  readonly brandId: BrandId;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly status: BrandProfileStatus;
  readonly colorPalette: ColorPalette;
  readonly typography: TypographySystem;
  readonly logoSystem: LogoSystem;
  readonly iconSystem: IconSystem;
  readonly illustrationGuide: IllustrationGuide;
  readonly photographyGuide: PhotographyGuide;
  readonly motionGuide: MotionGuide;
  readonly voiceAndTone: VoiceAndToneProfile;
  readonly rules: BrandRule[];
  readonly tokens: BrandProfileTokens;
  readonly templates: BrandTemplate[];
  readonly metadata: BrandMetadata;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export enum BrandProfileStatus {
  DRAFT = 'draft',
  VALID = 'valid',
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived',
}

// ============================================================================
// Color System
// ============================================================================

export interface ColorPalette {
  readonly primaryColors: Color[];
  readonly secondaryColors: Color[];
  readonly accentColors: Color[];
  readonly neutrals: Color[];
  readonly semanticColors: SemanticColor[];
  readonly guidelines: ColorGuideline[];
}

export interface Color {
  readonly id: string;
  readonly name: string;
  readonly hex: string;
  readonly rgb: RGB;
  readonly hsl: HSL;
  readonly hsv: HSV;
  readonly usage: string;
  readonly contexts: string[];
  readonly accessibility: AccessibilityInfo;
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

export interface HSV {
  readonly h: number;
  readonly s: number;
  readonly v: number;
}

export interface SemanticColor {
  readonly name: string;
  readonly role: 'success' | 'error' | 'warning' | 'info';
  readonly lightMode: Color;
  readonly darkMode: Color;
}

export interface ColorGuideline {
  readonly category: string;
  readonly description: string;
  readonly doUse: string[];
  readonly dontUse: string[];
  readonly minimumContrast: number;
}

export interface AccessibilityInfo {
  readonly wcagAACompliant: boolean;
  readonly wcagAAACompliant: boolean;
  readonly contrastRatio: number;
}

// ============================================================================
// Typography System
// ============================================================================

export interface TypographySystem {
  readonly families: FontFamily[];
  readonly scales: TypeScale[];
  readonly weights: FontWeight[];
  readonly guidelines: TypographyGuideline[];
}

export interface FontFamily {
  readonly id: string;
  readonly name: string;
  readonly category: FontCategory;
  readonly usage: string;
  readonly weights: number[];
  readonly styles: string[];
  readonly url?: string;
  readonly fallbacks: string[];
}

export enum FontCategory {
  SERIF = 'serif',
  SANS_SERIF = 'sans-serif',
  MONOSPACE = 'monospace',
  DISPLAY = 'display',
  SCRIPT = 'script',
}

export interface TypeScale {
  readonly name: string;
  readonly steps: TypeScaleStep[];
  readonly description: string;
  readonly ratioBase: number;
  readonly ratioMultiplier: number;
}

export interface TypeScaleStep {
  readonly level: string;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly letterSpacing: number;
  readonly fontWeight: number | string;
  readonly usage: string;
}

export interface FontWeight {
  readonly value: number;
  readonly name: string;
  readonly usage: string;
}

export interface TypographyGuideline {
  readonly category: string;
  readonly description: string;
  readonly rules: string[];
  readonly doNot: string[];
}

// ============================================================================
// Logo System
// ============================================================================

export interface LogoSystem {
  readonly variations: LogoVariation[];
  readonly guidelines: LogoGuideline[];
  readonly spacing: LogoSpacing;
  readonly colorRules: LogoColorRule[];
}

export interface LogoVariation {
  readonly id: string;
  readonly name: string;
  readonly type: LogoType;
  readonly description: string;
  readonly assetUrl: string;
  readonly minimumSize: number;
  readonly clearanceRules: ClearanceRule;
  readonly usageContext: string[];
}

export enum LogoType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  MONOCHROME = 'monochrome',
  ICON = 'icon',
  LOCKUP = 'lockup',
  WORDMARK = 'wordmark',
}

export interface ClearanceRule {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
  readonly unit: string;
}

export interface LogoSpacing {
  readonly margins: ClearanceRule;
  readonly internalSpacing: Record<string, number>;
}

export interface LogoColorRule {
  readonly variation: LogoType;
  readonly allowedColors: string[];
  readonly prohibitedColors: string[];
  readonly guidelines: string;
}

export interface LogoGuideline {
  readonly category: string;
  readonly description: string;
  readonly doUse: string[];
  readonly dontUse: string[];
}

// ============================================================================
// Icon System
// ============================================================================

export interface IconSystem {
  readonly name: string;
  readonly description: string;
  readonly gridSize: number;
  readonly strokeWidth: number;
  readonly icons: IconAsset[];
  readonly guidelines: IconGuideline[];
  readonly sets: IconSet[];
}

export interface IconAsset {
  readonly id: string;
  readonly name: string;
  readonly tags: string[];
  readonly assetUrl: string;
  readonly sizes: number[];
  readonly usageContext: string[];
  readonly accessibility: IconAccessibility;
}

export interface IconAccessibility {
  readonly ariaLabel: string;
  readonly ariaDescription?: string;
  readonly decorative: boolean;
}

export interface IconSet {
  readonly name: string;
  readonly description: string;
  readonly icons: string[];
}

export interface IconGuideline {
  readonly category: string;
  readonly description: string;
  readonly rules: string[];
  readonly doNot: string[];
}

// ============================================================================
// Illustration Guide
// ============================================================================

export interface IllustrationGuide {
  readonly style: string;
  readonly characteristics: string[];
  readonly colorUsage: string;
  readonly examples: IllustrationExample[];
  readonly guidelines: IllustrationGuideline[];
  readonly prohibited: string[];
}

export interface IllustrationExample {
  readonly name: string;
  readonly description: string;
  readonly assetUrl: string;
  readonly usageContext: string[];
}

export interface IllustrationGuideline {
  readonly category: string;
  readonly description: string;
  readonly doUse: string[];
  readonly dontUse: string[];
}

// ============================================================================
// Photography Guide
// ============================================================================

export interface PhotographyGuide {
  readonly style: string;
  readonly characteristics: string[];
  readonly lighting: string;
  readonly composition: string;
  readonly colorTreatment: string;
  readonly examples: PhotographyExample[];
  readonly guidelines: PhotographyGuideline[];
  readonly prohibited: string[];
}

export interface PhotographyExample {
  readonly name: string;
  readonly description: string;
  readonly assetUrl: string;
  readonly usageContext: string[];
}

export interface PhotographyGuideline {
  readonly category: string;
  readonly description: string;
  readonly doUse: string[];
  readonly dontUse: string[];
}

// ============================================================================
// Motion Guide
// ============================================================================

export interface MotionGuide {
  readonly duration: MotionDuration;
  readonly easing: MotionEasing[];
  readonly transitions: MotionTransition[];
  readonly guidelines: MotionGuideline[];
}

export interface MotionDuration {
  readonly quickInteraction: number;
  readonly normalAnimation: number;
  readonly slowAnimation: number;
  readonly unit: string;
}

export interface MotionEasing {
  readonly name: string;
  readonly curve: string;
  readonly usage: string;
  readonly bezier?: [number, number, number, number];
}

export interface MotionTransition {
  readonly name: string;
  readonly type: string;
  readonly duration: number;
  readonly easing: string;
  readonly usage: string;
}

export interface MotionGuideline {
  readonly category: string;
  readonly description: string;
  readonly rules: string[];
  readonly doNot: string[];
}

// ============================================================================
// Voice and Tone
// ============================================================================

export interface VoiceAndToneProfile {
  readonly personality: string[];
  readonly traits: string[];
  readonly toneInContext: Record<string, ToneContext>;
  readonly guidelines: VoiceGuideline[];
  readonly prohibitedTerms: string[];
  readonly approvedTerms: string[];
  readonly examples: VoiceExample[];
}

export interface ToneContext {
  readonly description: string;
  readonly characteristics: string[];
  readonly example: string;
}

export interface VoiceGuideline {
  readonly category: string;
  readonly description: string;
  readonly doUse: string[];
  readonly dontUse: string[];
}

export interface VoiceExample {
  readonly context: string;
  readonly good: string;
  readonly poor: string;
}

// ============================================================================
// Brand Rules
// ============================================================================

export interface BrandRule {
  readonly id: string;
  readonly name: string;
  readonly category: BrandRuleCategory;
  readonly description: string;
  readonly constraint: BrandConstraint;
  readonly severity: 'blocking' | 'warning' | 'advisory';
  readonly applicableTo: string[];
  readonly examples?: string[];
}

export enum BrandRuleCategory {
  COLOR = 'color',
  TYPOGRAPHY = 'typography',
  LOGO = 'logo',
  ICON = 'icon',
  PHOTOGRAPHY = 'photography',
  ILLUSTRATION = 'illustration',
  MOTION = 'motion',
  VOICE = 'voice',
  LAYOUT = 'layout',
  ACCESSIBILITY = 'accessibility',
  CUSTOM = 'custom',
}

export interface BrandConstraint {
  readonly type: ConstraintType;
  readonly value: unknown;
  readonly operator?: string;
}

export enum ConstraintType {
  ALLOWED_VALUES = 'allowed-values',
  FORBIDDEN_VALUES = 'forbidden-values',
  MIN_VALUE = 'min-value',
  MAX_VALUE = 'max-value',
  REGEX_PATTERN = 'regex-pattern',
  CUSTOM = 'custom',
}

// ============================================================================
// Brand Tokens
// ============================================================================

export interface BrandProfileTokens {
  readonly colorTokens: ColorToken[];
  readonly typographyTokens: TypographyToken[];
  readonly spacingTokens: SpacingToken[];
  readonly animationTokens: AnimationToken[];
  readonly shadowTokens: ShadowToken[];
  readonly componentTokens: ComponentToken[];
}

export interface ColorToken {
  readonly id: string;
  readonly name: string;
  readonly value: string;
  readonly category: string;
  readonly description?: string;
  readonly usage: string[];
}

export interface TypographyToken {
  readonly id: string;
  readonly name: string;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: string | number;
  readonly lineHeight: number;
  readonly letterSpacing: number;
  readonly category: string;
  readonly usage: string[];
}

export interface SpacingToken {
  readonly id: string;
  readonly name: string;
  readonly value: number;
  readonly unit: string;
  readonly category: string;
  readonly usage: string[];
}

export interface AnimationToken {
  readonly id: string;
  readonly name: string;
  readonly duration: number;
  readonly easing: string;
  readonly category: string;
  readonly usage: string[];
}

export interface ShadowToken {
  readonly id: string;
  readonly name: string;
  readonly value: string;
  readonly category: string;
  readonly usage: string[];
}

export interface ComponentToken {
  readonly id: string;
  readonly name: string;
  readonly tokens: Record<string, string>;
  readonly category: string;
  readonly usage: string[];
}

// ============================================================================
// Brand Templates
// ============================================================================

export interface BrandTemplate {
  readonly id: string;
  readonly name: string;
  readonly type: TemplateType;
  readonly description: string;
  readonly assetUrl: string;
  readonly components: string[];
  readonly usageContext: string[];
}

export enum TemplateType {
  SOCIAL_MEDIA = 'social-media',
  WEBSITE = 'website',
  EMAIL = 'email',
  PRESENTATION = 'presentation',
  DOCUMENT = 'document',
  VIDEO = 'video',
  PRINT = 'print',
  CUSTOM = 'custom',
}

// ============================================================================
// Brand Metadata
// ============================================================================

export interface BrandMetadata {
  readonly organization: string;
  readonly department?: string;
  readonly owner: string;
  readonly contact: string;
  readonly documentationUrl?: string;
  readonly lastReviewDate: string;
  readonly nextReviewDate: string;
  readonly changeLog: BrandChange[];
  readonly tags: string[];
}

export interface BrandChange {
  readonly date: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly type: 'major' | 'minor' | 'patch';
}

// ============================================================================
// Brand Validation
// ============================================================================

export interface BrandValidationResult {
  readonly valid: boolean;
  readonly errors: BrandValidationError[];
  readonly warnings: BrandValidationWarning[];
  readonly metadata: ValidationMetadata;
}

export interface BrandValidationError {
  readonly code: string;
  readonly message: string;
  readonly severity: 'critical' | 'high' | 'medium';
  readonly path?: string;
  readonly suggestion?: string;
}

export interface BrandValidationWarning {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export interface ValidationMetadata {
  readonly validatedAt: string;
  readonly validator: string;
  readonly validationTime: number;
  readonly rulesChecked: number;
  readonly rulesPasssed: number;
}

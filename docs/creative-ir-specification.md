# Creative Intermediate Representation (Creative IR) Specification

**Version**: 1.0.0  
**Status**: Specification (Not implemented)  
**Last Updated**: June 2026

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design Principles](#design-principles)
3. [Creative IR Schema](#creative-ir-schema)
4. [Versioning Strategy](#versioning-strategy)
5. [Validation Rules](#validation-rules)
6. [Serialization Format](#serialization-format)
7. [Compiler Interface](#compiler-interface)
8. [Adapter Interface](#adapter-interface)
9. [Extension Mechanism](#extension-mechanism)
10. [Backward Compatibility](#backward-compatibility)
11. [Migration Strategy](#migration-strategy)
12. [Example Creative IR Documents](#example-creative-ir-documents)

---

## Executive Summary

**Creative Intermediate Representation (Creative IR)** is the canonical, machine-readable representation of every creative artifact produced by the Creative Factory. 

### Key Principles

- **Single Source of Truth**: Creative IR is the definitive model for all creative work.
- **Automatic Generation**: Creative IR is generated automatically from Business Brief, Brand Package, Campaign Package, and Human Review feedback.
- **Never User-Edited**: Marketing users NEVER edit Creative IR directly.
- **Engine-Agnostic**: All engines consume and/or produce Creative IR through standardized interfaces.
- **Provider-Neutral**: No engine communicates through provider-specific prompts.
- **Stable Contract**: Creative IR is a versioned, public contract for cross-engine integration.

### Information Architecture

```
Business Brief
     ↓
[Brand Engine] ──→ Brand Configuration
[Campaign Engine] → Campaign Context
[Brief Engine] ──→ Creative Brief
     ↓
  [Creative IR Compiler] ← Brand Tokens, Design Tokens
     ↓
Creative Intermediate Representation
     ↓
┌─────────────────────────────────────────────────────┐
│ Compiler Output Adapters (Pluggable)                │
├─────────────────────────────────────────────────────┤
│ • Human-Readable Storyboard Adapter                 │
│ • Scene Specification Adapter                       │
│ • Shot List Adapter                                 │
│ • Motion Specification Adapter                      │
│ • Prompt Translation Adapter                        │
│ • Image Generation Request Adapter                  │
│ • Video Generation Request Adapter                  │
│ • QA Specification Adapter                          │
│ • Export Package Adapter                            │
│ • [Future Adapters - Pluggable]                     │
└─────────────────────────────────────────────────────┘
     ↓
Production Artifacts
```

---

## Design Principles

### 1. Separation of Concerns

- **Creative IR** models the creative vision independent of:
  - Implementation details
  - Provider capabilities
  - Output formats
  - Deployment constraints

- **Adapters** translate Creative IR into provider-specific or format-specific artifacts.

### 2. Machine Readability

- Creative IR MUST be:
  - Fully parseable by machines
  - Deterministic (same input → same structure)
  - Lossless (no critical information lost in representation)
  - Extendable (new fields must not break existing consumers)

### 3. Immutability and Auditability

- Creative IR documents are immutable once created
- Version history is tracked
- All modifications create new versions
- Revision history includes timestamp, actor, change description, and previous version reference

### 4. Composability

- Creative IR is composed of smaller, reusable components
- Components have explicit relationships
- No circular dependencies
- Clear dependency graph for compiler optimization

### 5. Provider Neutrality

- Creative IR NEVER contains:
  - AI provider names or API-specific parameters
  - Format-specific constraints beyond semantic meaning
  - Implementation details of generation engines
  
- Prompt synthesis happens only in Prompt Translation adapters

---

## Creative IR Schema

### Root Document Structure

```typescript
interface CreativeIR {
  // Metadata
  readonly version: string;           // Semantic version of Creative IR spec (e.g., "1.0.0")
  readonly id: CreativeIRId;          // Unique document identifier
  readonly createdAt: ISO8601Timestamp;
  readonly updatedAt: ISO8601Timestamp;
  readonly revisionHistory: RevisionRecord[];
  
  // Content Model
  readonly campaign: Campaign;
  readonly creativeContext: CreativeContext;
  readonly stories: Story[];
  readonly brandTokens: BrandTokens;
  readonly designTokens: DesignTokens;
  readonly assetRequests: AssetRequest[];
  readonly reviews: Review[];
  readonly exports: ExportMetadata[];
  
  // Validation Metadata
  readonly validationStatus: ValidationStatus;
  readonly compilerMetadata: CompilerMetadata;
}
```

### Campaign

```typescript
interface Campaign {
  readonly id: CampaignId;
  readonly name: string;
  readonly description: string;
  readonly objective: string;              // Business objective
  readonly targetAudience: TargetAudience;
  readonly duration: Duration;
  readonly aspectRatios: AspectRatio[];    // Supported output formats
  readonly languages: Language[];
  readonly marketRegions: Region[];
  readonly lifecycleState: CampaignLifecycleState;
  readonly approvalState: ApprovalState;
  readonly createdBy: UserId;
  readonly updatedBy: UserId;
}

interface TargetAudience {
  readonly demographics: Demographic[];
  readonly psychographics: string[];
  readonly mediaPreferences: string[];
  readonly geographies: Region[];
}

interface Demographic {
  readonly age: AgeRange;
  readonly gender?: string;
  readonly income?: IncomeRange;
  readonly education?: string;
}

interface Duration {
  readonly minutes: number;
  readonly seconds: number;
  readonly frames?: number;
  readonly frameRate?: number;
}

type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "21:9";
type Language = string;  // ISO 639-1 code
type Region = string;    // ISO 3166-1 alpha-2
```

### Creative Context

```typescript
interface CreativeContext {
  readonly briefId: CreativeBriefId;
  readonly briefTitle: string;
  readonly briefObjective: string;
  readonly creativeDirection: string;     // High-level creative direction
  readonly moodAndTone: MoodAndTone;
  readonly visualStyle: VisualStyle;
  readonly narrativeTheme: string;
  readonly keyMessages: string[];
  readonly callToAction: string;
  readonly brandGuidelines: BrandGuidelines;
  readonly competitiveContext: string;
  readonly constraints: Constraint[];
  readonly approvedBy?: UserId;
  readonly approvalDate?: ISO8601Timestamp;
}

interface MoodAndTone {
  readonly primary: string;
  readonly secondary: string[];
  readonly avoided: string[];
}

interface VisualStyle {
  readonly cinematography: string;
  readonly colorPalette: string[];
  readonly lighting: string;
  readonly composition: string;
  readonly references: Reference[];
}

interface BrandGuidelines {
  readonly logoUsage: string;
  readonly colorRules: ColorRule[];
  readonly typographyRules: TypographyRule[];
  readonly voiceAndTone: VoiceAndTone;
  readonly prohibitedElements: string[];
}

interface Constraint {
  readonly type: "technical" | "legal" | "brand" | "creative" | "resource";
  readonly description: string;
  readonly impact: "blocking" | "warning" | "advisory";
}
```

### Story

```typescript
interface Story {
  readonly id: StoryId;
  readonly title: string;
  readonly description: string;
  readonly sequence: number;
  readonly durationFrames: number;
  readonly storyboards: Storyboard[];
  readonly reviewState: ReviewState;
  readonly approvalState: ApprovalState;
  readonly metadata: StoryMetadata;
}

interface Storyboard {
  readonly id: StoryboardId;
  readonly title: string;
  readonly description: string;
  readonly sequence: number;
  readonly scenes: Scene[];
  readonly duration: Duration;
  readonly reviewNotes?: string;
}

interface Scene {
  readonly id: SceneId;
  readonly title: string;
  readonly description: string;
  readonly sequence: number;
  readonly narrativeText: string;
  readonly shots: Shot[];
  readonly transitions: Transition[];
  readonly audioSpecs: AudioSpecification;
  readonly duration: Duration;
  readonly reviewNotes?: string;
}

interface Shot {
  readonly id: ShotId;
  readonly sequence: number;
  readonly description: string;
  readonly duration: Duration;
  readonly visualSpec: VisualSpecification;
  readonly motionSpec: MotionSpecification;
  readonly audioElements: AudioElement[];
  readonly assetRequests: AssetRequest[];
  readonly reviewNotes?: string;
}

interface Transition {
  readonly type: "cut" | "fade" | "dissolve" | "wipe" | "zoom" | "pan";
  readonly duration: Duration;
  readonly easing?: string;
  readonly description?: string;
}
```

### Visual Specification

```typescript
interface VisualSpecification {
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

type ShotType = 
  | "wide" 
  | "medium" 
  | "close-up" 
  | "extreme-close-up"
  | "aerial"
  | "pov"
  | "over-shoulder"
  | "two-shot"
  | "group";

interface CameraConfiguration {
  readonly movement: CameraMovement;
  readonly angle: CameraAngle;
  readonly lens: LensSpec;
  readonly focus: FocusSpec;
  readonly depth: number;  // Approximate focal length in mm
}

type CameraMovement = 
  | "static" 
  | "pan" 
  | "tilt" 
  | "dolly" 
  | "crane" 
  | "orbit"
  | "tracking"
  | "reveal";

interface CameraAngle {
  readonly pitch: number;   // -90 to +90 degrees
  readonly yaw: number;     // 0 to 360 degrees
  readonly roll: number;    // -90 to +90 degrees
}

interface CompositionSpec {
  readonly rule: "rule-of-thirds" | "center" | "leading-lines" | "depth";
  readonly subjectPlacement: string;
  readonly balanceType: "symmetrical" | "asymmetrical" | "radial";
}

interface LightingSpec {
  readonly type: "three-point" | "two-point" | "backlighting" | "sidelighting" | "practical";
  readonly keyLight: LightDescription;
  readonly fillLight?: LightDescription;
  readonly backLight?: LightDescription;
  readonly ambientLight?: LightDescription;
  readonly shadows: string;
  readonly mood: string;
}

interface LightDescription {
  readonly intensity: number;   // 0-100
  readonly color: string;       // Hex or RGB
  readonly direction: string;
  readonly softness: number;    // 0-100
}

interface ColorGradingSpec {
  readonly look: string;
  readonly colorCast: string;
  readonly saturation: number;     // -100 to +100
  readonly contrast: number;       // -100 to +100
  readonly highlights: number;     // -100 to +100
  readonly shadows: number;        // -100 to +100
  readonly temperature: number;    // Kelvin or -100 to +100
}

interface VisualElement {
  readonly id: string;
  readonly type: string;
  readonly description: string;
  readonly position: Vector2D;
  readonly scale: Vector2D;
  readonly rotation: number;
  readonly opacity: number;
}

interface SpecialEffect {
  readonly type: string;
  readonly description: string;
  readonly parameters: Record<string, unknown>;
  readonly timing: Timing;
}

interface Prop {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly visualCharacteristics: string;
  readonly sourceAssets?: AssetId[];
}

interface TalentDirection {
  readonly talentId: string;
  readonly action: string;
  readonly emotion: string;
  readonly positioning: string;
  readonly facialExpression: string;
}
```

### Motion Specification

```typescript
interface MotionSpecification {
  readonly cameraMotion: CameraMotionKeyframes[];
  readonly objectMotions: ObjectMotion[];
  readonly particleEffects: ParticleEffect[];
  readonly dynamicsSimulation?: DynamicsSimulation;
}

interface CameraMotionKeyframes {
  readonly time: number;  // Milliseconds from shot start
  readonly position: Vector3D;
  readonly rotation: Rotation3D;
  readonly focalLength: number;
  readonly focusDistance: number;
  readonly easing: EasingFunction;
}

type EasingFunction = 
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "cubic-bezier"
  | "spring";

interface ObjectMotion {
  readonly objectId: string;
  readonly keyframes: MotionKeyframe[];
  readonly loop: boolean;
  readonly physics?: PhysicsProps;
}

interface MotionKeyframe {
  readonly time: number;
  readonly position: Vector3D;
  readonly rotation: Rotation3D;
  readonly scale: Vector3D;
  readonly easing: EasingFunction;
}

interface ParticleEffect {
  readonly id: string;
  readonly type: string;
  readonly emitterPosition: Vector3D;
  readonly emission: EmissionProps;
  readonly lifespan: number;
  readonly physics: ParticlePhysics;
}

interface DynamicsSimulation {
  readonly gravity: Vector3D;
  readonly wind: Vector3D;
  readonly friction: number;
  readonly elasticity: number;
}

interface PhysicsProps {
  readonly mass: number;
  readonly drag: number;
  readonly angularDrag: number;
}

interface ParticlePhysics {
  readonly velocity: Vector3D;
  readonly acceleration: Vector3D;
  readonly rotation: Vector3D;
  readonly lifetime: number;
  readonly drag: number;
}

interface Vector2D {
  readonly x: number;
  readonly y: number;
}

interface Vector3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

interface Rotation3D {
  readonly x: number;  // Pitch in degrees
  readonly y: number;  // Yaw in degrees
  readonly z: number;  // Roll in degrees
}

interface Timing {
  readonly startTime: number;
  readonly duration: number;
  readonly easing?: EasingFunction;
}
```

### Audio Specification

```typescript
interface AudioSpecification {
  readonly voiceover?: VoiceoverSpec;
  readonly music?: MusicSpec;
  readonly soundEffects: SoundEffect[];
  readonly ambience?: AmbienceSpec;
  readonly mixing: MixingSpec;
  readonly localization?: LocalizationSpec;
}

interface VoiceoverSpec {
  readonly script: string;
  readonly language: Language;
  readonly style: string;           // e.g., "conversational", "authoritative", "whimsical"
  readonly pacing: string;
  readonly emotionalTone: string;
  readonly deliveryNotes: string;
}

interface MusicSpec {
  readonly mood: string;
  readonly tempo: number;           // BPM
  readonly genre: string;
  readonly instrumentation: string[];
  readonly intensity: number;       // 0-100
  readonly notes: string;
  readonly licensingRequirements?: string;
}

interface SoundEffect {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly timing: Timing;
  readonly volume: number;          // 0-100 dB
  readonly effects?: AudioEffect[];
}

interface AudioEffect {
  readonly type: string;           // e.g., "reverb", "delay", "compression", "eq"
  readonly parameters: Record<string, number>;
}

interface AmbienceSpec {
  readonly description: string;
  readonly elements: string[];
  readonly volume: number;
}

interface MixingSpec {
  readonly masterVolume: number;
  readonly voiceoverLevel: number;
  readonly musicLevel: number;
  readonly effectsLevel: number;
  readonly ambienceLevel: number;
  readonly dynamicRangeCompression: boolean;
  readonly normalization: boolean;
}

interface LocalizationSpec {
  readonly targetLanguages: Language[];
  readonly voiceoverPerLanguage: Record<Language, VoiceoverSpec>;
  readonly subtitles?: SubtitleSpec;
}

interface SubtitleSpec {
  readonly format: "vtt" | "srt" | "ass";
  readonly languages: Language[];
  readonly styling: CSSStyles;
}
```

### Brand Tokens

```typescript
interface BrandTokens {
  readonly brandId: BrandId;
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

interface ColorToken {
  readonly name: string;
  readonly hex: string;
  readonly rgb: RGB;
  readonly hsl: HSL;
  readonly usage: string;
  readonly context: string[];  // e.g., ["web", "print", "video"]
}

interface TypographyToken {
  readonly name: string;
  readonly fontFamily: string;
  readonly fontWeight: number | string;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly letterSpacing: number;
  readonly usage: string;
}

interface LogoVariation {
  readonly type: "primary" | "secondary" | "monochrome" | "icon";
  readonly description: string;
  readonly minimumSize: number;
  readonly clearanceRules: string;
  readonly usageContext: string[];
}

interface ImageryGuideline {
  readonly category: string;
  readonly description: string;
  readonly visualCharacteristics: string[];
  readonly examples?: string[];
  readonly prohibited: string[];
}

interface VoiceAndToneToken {
  readonly personality: string[];
  readonly toneInContext: Record<string, string>;
  readonly doNotUse: string[];
}

interface BrandPersonality {
  readonly primaryTraits: string[];
  readonly secondaryTraits: string[];
  readonly communicationStyle: string;
  readonly valuePropositions: string[];
}

interface ProhibitedElement {
  readonly type: string;
  readonly description: string;
  readonly reason: string;
  readonly context?: string;
}
```

### Design Tokens

```typescript
interface DesignTokens {
  readonly spacing: SpacingToken[];
  readonly sizing: SizingToken[];
  readonly shadows: ShadowToken[];
  readonly borders: BorderToken[];
  readonly animations: AnimationToken[];
  readonly breakpoints: BreakpointToken[];
}

interface SpacingToken {
  readonly name: string;
  readonly value: number;
  readonly unit: string;
}

interface SizingToken {
  readonly name: string;
  readonly width?: number;
  readonly height?: number;
  readonly unit: string;
}

interface ShadowToken {
  readonly name: string;
  readonly color: string;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly blur: number;
  readonly spread: number;
}

interface BorderToken {
  readonly name: string;
  readonly width: number;
  readonly style: string;
  readonly color: string;
  readonly radius?: number;
}

interface AnimationToken {
  readonly name: string;
  readonly duration: number;
  readonly easing: EasingFunction;
  readonly delay?: number;
}

interface BreakpointToken {
  readonly name: string;
  readonly minWidth: number;
  readonly maxWidth?: number;
}
```

### Asset Requests

```typescript
interface AssetRequest {
  readonly id: AssetRequestId;
  readonly createdAt: ISO8601Timestamp;
  readonly shotId: ShotId;
  readonly assetType: AssetType;
  readonly specifications: AssetSpecification;
  readonly quantity: number;
  readonly priority: "critical" | "high" | "medium" | "low";
  readonly deadline?: ISO8601Timestamp;
  readonly deliveredAssets: AssetOutput[];
  readonly qaStatus: "pending" | "in-progress" | "approved" | "rejected";
  readonly metadata: Record<string, unknown>;
}

type AssetType = "image" | "video" | "audio" | "animation" | "3d-model" | "text";

interface AssetSpecification {
  readonly description: string;
  readonly dimensions: AssetDimension;
  readonly format: string;
  readonly colorSpace: string;
  readonly quality: string;
  readonly constraints: AssetConstraint[];
}

interface AssetDimension {
  readonly width: number;
  readonly height: number;
  readonly depth?: number;
  readonly duration?: Duration;
  readonly framerate?: number;
}

interface AssetConstraint {
  readonly type: string;
  readonly value: unknown;
}

interface AssetOutput {
  readonly id: AssetId;
  readonly requestId: AssetRequestId;
  readonly format: string;
  readonly url: string;
  readonly metadata: AssetMetadata;
  readonly generatedAt: ISO8601Timestamp;
  readonly generatedBy: string;  // Engine identifier
  readonly provenance: Provenance;
}

interface AssetMetadata {
  readonly width: number;
  readonly height: number;
  readonly fileSize: number;
  readonly duration?: Duration;
  readonly colorSpace: string;
  readonly bitDepth?: number;
  readonly frameCount?: number;
  readonly framerate?: number;
}

interface Provenance {
  readonly sourceEngine: string;
  readonly sourceModel?: string;
  readonly sourceVersion?: string;
  readonly parameters: Record<string, unknown>;
  readonly seed?: string;  // For reproducibility
  readonly generationTime: number;  // Milliseconds
}
```

### Review & Approval

```typescript
interface Review {
  readonly id: ReviewId;
  readonly createdAt: ISO8601Timestamp;
  readonly reviewedBy: UserId;
  readonly reviewType: "strategy" | "storyboard" | "assets" | "final";
  readonly status: "pending" | "in-progress" | "completed" | "rejected";
  readonly targetId: string;     // ID of reviewed entity (story, storyboard, etc.)
  readonly decision: ReviewDecision;
  readonly comments: ReviewComment[];
  readonly attachments: Attachment[];
  readonly deadline?: ISO8601Timestamp;
}

type ReviewDecision = "approved" | "approved-with-changes" | "rejected" | "pending";

interface ReviewComment {
  readonly id: CommentId;
  readonly author: UserId;
  readonly timestamp: ISO8601Timestamp;
  readonly text: string;
  readonly attachments?: Attachment[];
  readonly resolved: boolean;
}

interface Attachment {
  readonly id: AttachmentId;
  readonly name: string;
  readonly mimeType: string;
  readonly url: string;
  readonly uploadedAt: ISO8601Timestamp;
  readonly uploadedBy: UserId;
}

interface Approval {
  readonly id: ApprovalId;
  readonly approverUserId: UserId;
  readonly approvalType: "creative" | "brand" | "legal" | "final";
  readonly timestamp: ISO8601Timestamp;
  readonly status: "pending" | "approved" | "rejected";
  readonly comment?: string;
  readonly approvalLevel: number;  // For multi-level approval workflows
}

type ApprovalState = "pending" | "approved" | "rejected" | "changes-requested";
type ReviewState = "not-started" | "in-progress" | "completed" | "revision-needed";
```

### Export Metadata

```typescript
interface ExportMetadata {
  readonly id: ExportId;
  readonly createdAt: ISO8601Timestamp;
  readonly exportedBy: UserId;
  readonly exportFormat: ExportFormat;
  readonly adapterUsed: string;          // Adapter identifier
  readonly targetPlatform: string;       // e.g., "instagram", "tiktok", "youtube", "broadcast"
  readonly artifacts: ExportArtifact[];
  readonly status: "pending" | "processing" | "completed" | "failed";
  readonly errorLog?: string;
}

type ExportFormat = 
  | "storyboard-html"
  | "scene-spec-pdf"
  | "shot-list-json"
  | "motion-spec-json"
  | "prompt-package-json"
  | "image-generation-requests"
  | "video-generation-requests"
  | "qa-spec-json"
  | "production-package";

interface ExportArtifact {
  readonly format: string;
  readonly url: string;
  readonly size: number;
  readonly generatedAt: ISO8601Timestamp;
  readonly metadata: Record<string, unknown>;
}
```

### Compiler Metadata

```typescript
interface CompilerMetadata {
  readonly compileVersion: string;
  readonly compileTimestamp: ISO8601Timestamp;
  readonly sourceComponents: SourceComponent[];
  readonly compileRules: string[];
  readonly adapterMetadata: Record<string, AdapterCompileMetadata>;
  readonly diagnostics: Diagnostic[];
}

interface SourceComponent {
  readonly id: string;
  readonly type: string;
  readonly version: string;
  readonly checksum: string;
}

interface AdapterCompileMetadata {
  readonly adapterName: string;
  readonly adapterVersion: string;
  readonly outputCount: number;
  readonly compileDuration: number;
}

interface Diagnostic {
  readonly level: "info" | "warning" | "error";
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly suggestion?: string;
}
```

### Validation Status

```typescript
interface ValidationStatus {
  readonly isValid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
  readonly lastValidatedAt: ISO8601Timestamp;
}

interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly severity: "critical" | "high" | "medium";
}

interface ValidationWarning {
  readonly code: string;
  readonly message: string;
  readonly path: string;
}

interface RevisionRecord {
  readonly version: number;
  readonly timestamp: ISO8601Timestamp;
  readonly actor: UserId;
  readonly changeDescription: string;
  readonly previousVersionId?: string;
  readonly metadata: Record<string, unknown>;
}
```

---

## Versioning Strategy

### Semantic Versioning

Creative IR uses semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes to the schema (rare, requires migration strategy)
- **MINOR**: New fields, new optional elements (backward compatible)
- **PATCH**: Bug fixes, clarifications (no schema changes)

### Versioning Rules

1. **Field Additions**: Only as optional fields with `null` default
2. **Field Deprecation**: Marked with `@deprecated` annotation
3. **Type Evolution**: Only widen types (e.g., `"a" | "b"` → `"a" | "b" | "c"`)
4. **Required Fields**: Never introduced in MINOR versions
5. **Enum Values**: Only add new values in MINOR versions

### Document Versioning

Each Creative IR document carries its schema version:

```json
{
  "version": "1.0.0",
  "id": "creative-ir-abc123",
  "campaign": { ... }
}
```

Consumers MUST validate schema version before parsing.

---

## Validation Rules

### Structural Validation

1. **Type Checking**: All fields must match declared types
2. **Required Fields**: All non-optional fields must be present
3. **Enum Validation**: Enum values must match predefined sets
4. **Cross-Field Dependencies**: Enforced by validation rules (e.g., if `assetType="video"`, then `duration` is required)

### Semantic Validation

1. **Referential Integrity**: All IDs must resolve to existing entities
2. **Temporal Consistency**: `createdAt` ≤ `updatedAt`
3. **Logical Constraints**: 
   - Shot count > 0
   - Duration > 0
   - AspectRatios supported
4. **Brand Compliance**: Visual elements match brand guidelines

### Compiler Validation

1. **Path Completeness**: All story/storyboard/scene/shot paths must be traceable
2. **Asset Resolution**: All asset requests must have clear specifications
3. **Approval Chain**: All necessary approvals must be present for export

### Validation Modes

```typescript
enum ValidationMode {
  STRICT,       // All rules enforced
  PERMISSIVE,   // Warnings only for non-critical issues
  DRAFT,        // Minimal validation (development only)
}
```

---

## Serialization Format

### JSON-LD Primary Format

Creative IR is serialized as JSON-LD for:
- RDF-compatible linked data
- Semantic web integration
- Future knowledge graph capabilities

```json
{
  "@context": "https://creative-factory.ai/contexts/creative-ir/v1.0.0.jsonld",
  "@type": "CreativeIR",
  "version": "1.0.0",
  "id": "creative-ir:abc123",
  ...
}
```

### Alternative Formats

- **YAML**: Human-editable development format
- **Protocol Buffers**: High-performance transport (future)
- **MessagePack**: Compact binary (future)

### Format Specifications

All formats MUST:
1. Preserve exact type information
2. Support all date/time semantics
3. Support nested objects and arrays
4. Support null/undefined values
5. Be bidirectionally convertible

---

## Compiler Interface

### CompilerRequest

```typescript
interface CompilerRequest {
  readonly creativeBriefId: CreativeBriefId;
  readonly brandId: BrandId;
  readonly campaignId: CampaignId;
  readonly reviewFeedback?: ReviewFeedback[];
  readonly adapterFilters?: string[];  // If empty, all enabled
  readonly validationMode: ValidationMode;
}

interface ReviewFeedback {
  readonly reviewId: ReviewId;
  readonly applicableSince: ISO8601Timestamp;
  readonly priority: number;
}
```

### CompilerOutput

```typescript
interface CompilerOutput {
  readonly creativeIR: CreativeIR;
  readonly adapterOutputs: Map<string, AdapterOutput>;
  readonly compilation: CompileReport;
}

interface CompileReport {
  readonly success: boolean;
  readonly duration: number;
  readonly adapterResults: Record<string, AdapterCompileResult>;
  readonly warnings: string[];
  readonly errors: string[];
}

interface AdapterCompileResult {
  readonly status: "success" | "partial" | "skipped" | "failed";
  readonly artifactCount: number;
  readonly duration: number;
  readonly errors?: string[];
}
```

### Compiler Interface

```typescript
interface CreativeIRCompiler {
  compile(request: CompilerRequest): Promise<CompilerOutput>;
  validate(ir: CreativeIR, mode?: ValidationMode): ValidationResult;
  getSchema(): SchemaDefinition;
  getAdapters(): AdapterInfo[];
}
```

---

## Adapter Interface

### Output Adapter Pattern

```typescript
interface CreativeIRAdapter {
  readonly name: string;
  readonly version: string;
  readonly supportedOutputFormats: string[];
  readonly capabilities: AdapterCapability[];
  
  transform(
    creativeIR: CreativeIR,
    options: AdapterOptions
  ): Promise<AdapterOutput>;
  
  validate(creativeIR: CreativeIR): AdapterValidationResult;
}

interface AdapterCapability {
  readonly feature: string;
  readonly level: "required" | "optional" | "unsupported";
  readonly notes?: string;
}

interface AdapterOptions {
  readonly outputFormat: string;
  readonly targetPlatform?: string;
  readonly includeMetadata: boolean;
  readonly validationMode: ValidationMode;
  readonly parameters: Record<string, unknown>;
}

interface AdapterOutput {
  readonly artifacts: OutputArtifact[];
  readonly metadata: AdapterMetadata;
  readonly warnings: string[];
}

interface OutputArtifact {
  readonly name: string;
  readonly format: string;
  readonly content: Buffer;
  readonly mimeType: string;
}
```

### Adapter Registration

```typescript
interface AdapterRegistry {
  register(adapter: CreativeIRAdapter): void;
  unregister(name: string): void;
  get(name: string): CreativeIRAdapter | undefined;
  list(): AdapterInfo[];
  listByCapability(capability: string): AdapterInfo[];
}

interface AdapterInfo {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly capabilities: AdapterCapability[];
  readonly supportedOutputFormats: string[];
}
```

---

## Extension Mechanism

### Custom Type Extensions

Extensions allow adapters to add custom fields without modifying core schema:

```typescript
interface ExtensionField {
  readonly namespace: string;
  readonly fieldName: string;
  readonly type: JSONSchema;
  readonly required: boolean;
  readonly default?: unknown;
}

// Usage in Creative IR
{
  "campaign": { ... },
  "@extensions": {
    "my-adapter": {
      "customField1": "value1",
      "customField2": { "nested": "value" }
    }
  }
}
```

### Adapter-Specific Metadata

```typescript
interface AdapterMetadata {
  readonly adapterName: string;
  readonly adapterVersion: string;
  readonly processedAt: ISO8601Timestamp;
  readonly transformRules: string[];
  readonly customizations: Record<string, unknown>;
}
```

### Validation of Extensions

1. Extensions MUST NOT override core schema fields
2. Extensions MUST be namespaced with adapter name
3. Extensions MUST include schema definition
4. Consumers MAY ignore unknown extensions

---

## Backward Compatibility

### Compatibility Rules

1. **Always Additive**: Never remove fields, only deprecate
2. **Optional Expansion**: New fields MUST have defaults
3. **Type Widening Only**: Never narrow types
4. **Semantic Preservation**: Never change meaning of existing fields

### Deprecation Process

```typescript
interface DeprecatedField {
  readonly version: string;          // Version deprecated in
  readonly replacement?: string;     // Suggested replacement
  readonly removalVersion?: string;  // When it will be removed
  readonly migration?: string;       // Migration instructions
}
```

### Version Negotiation

```typescript
interface VersionNegotiation {
  readonly clientVersion: string;
  readonly serverVersion: string;
  readonly compatibleVersions: string[];
  readonly requiresAdaptation: boolean;
  readonly adaptationRules?: AdaptationRule[];
}

interface AdaptationRule {
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly transformations: Transformation[];
}
```

---

## Migration Strategy

### Schema Migration

For MAJOR version changes:

1. **Announce**: Document breaking changes 6+ months in advance
2. **Adapter**: Provide migration adapter (old → new)
3. **Dual Support**: Support both versions in compiler
4. **Timeline**: 12+ month transition period
5. **Tooling**: Automated migration scripts

### Migration Tools

```typescript
interface SchemaMigrator {
  migrate(
    document: unknown,
    fromVersion: string,
    toVersion: string
  ): unknown;
  
  getPath(
    fromVersion: string,
    toVersion: string
  ): MigrationStep[];
}

interface MigrationStep {
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly transform: (doc: unknown) => unknown;
  readonly description: string;
}
```

---

## Example Creative IR Documents

### Example 1: Simple Social Media Campaign

```json
{
  "@context": "https://creative-factory.ai/contexts/creative-ir/v1.0.0.jsonld",
  "@type": "CreativeIR",
  "version": "1.0.0",
  "id": "creative-ir:instagram-summer-2026",
  "createdAt": "2026-06-26T10:00:00Z",
  "updatedAt": "2026-06-26T10:00:00Z",
  "revisionHistory": [],
  
  "campaign": {
    "id": "campaign:instagram-summer-2026",
    "name": "Summer Vibes Campaign",
    "description": "Social media campaign for summer product launch",
    "objective": "Increase brand awareness and drive engagement",
    "targetAudience": {
      "demographics": [
        { "age": { "min": 18, "max": 35 } }
      ],
      "psychographics": ["lifestyle-conscious", "eco-aware"],
      "geographies": ["US", "CA"]
    },
    "duration": { "minutes": 0, "seconds": 15 },
    "aspectRatios": ["9:16", "1:1"],
    "languages": ["en"],
    "marketRegions": ["North America"],
    "lifecycleState": "STORYBOARD_DRAFT",
    "approvalState": "pending",
    "createdBy": "user:creator1",
    "updatedBy": "user:creator1"
  },
  
  "creativeContext": {
    "briefId": "brief:instagram-summer-2026",
    "briefTitle": "Summer Product Launch",
    "briefObjective": "Showcase product in authentic lifestyle settings",
    "creativeDirection": "Natural, authentic, candid moments",
    "moodAndTone": {
      "primary": "joyful",
      "secondary": ["authentic", "energetic"],
      "avoided": ["corporate", "sales-y"]
    },
    "visualStyle": {
      "cinematography": "handheld, natural light",
      "colorPalette": ["#FFB84D", "#00A8E8", "#FFFFFF"],
      "lighting": "golden hour, natural",
      "composition": "dynamic, rule-of-thirds",
      "references": []
    },
    "narrativeTheme": "Discovering summer joy",
    "keyMessages": ["Live your best summer", "Be yourself"],
    "callToAction": "Shop now",
    "brandGuidelines": {
      "logoUsage": "Small watermark bottom-right",
      "colorRules": [],
      "typographyRules": [],
      "voiceAndTone": {
        "personality": ["friendly", "energetic"],
        "toneInContext": {},
        "doNotUse": []
      },
      "prohibitedElements": []
    },
    "constraints": []
  },
  
  "stories": [
    {
      "id": "story:summer-opening",
      "title": "Opening Scene",
      "description": "Person waking up on summer morning",
      "sequence": 1,
      "durationFrames": 360,
      "storyboards": [
        {
          "id": "sb:summer-opening-1",
          "title": "Morning Light",
          "sequence": 1,
          "scenes": [
            {
              "id": "scene:morning",
              "title": "Bedroom Wake",
              "sequence": 1,
              "narrativeText": "Natural light floods a bedroom",
              "shots": [
                {
                  "id": "shot:morning-light",
                  "sequence": 1,
                  "description": "Wide shot of sunlight through window",
                  "duration": { "minutes": 0, "seconds": 5 },
                  "visualSpec": {
                    "shotType": "wide",
                    "camera": {
                      "movement": "static",
                      "angle": { "pitch": 0, "yaw": 0, "roll": 0 },
                      "lens": { "type": "standard" },
                      "focus": { "type": "auto" },
                      "depth": 50
                    },
                    "composition": {
                      "rule": "rule-of-thirds",
                      "subjectPlacement": "upper third",
                      "balanceType": "asymmetrical"
                    },
                    "lighting": {
                      "type": "backlighting",
                      "keyLight": {
                        "intensity": 85,
                        "color": "#FFE4B5",
                        "direction": "from window",
                        "softness": 90
                      },
                      "shadows": "soft",
                      "mood": "peaceful"
                    },
                    "colorGrading": {
                      "look": "warm golden",
                      "colorCast": "warm",
                      "saturation": 15,
                      "contrast": 5,
                      "highlights": 10,
                      "shadows": -5,
                      "temperature": 5500
                    },
                    "foregroundElements": [],
                    "backgroundElements": [],
                    "specialEffects": [],
                    "props": []
                  },
                  "motionSpec": {
                    "cameraMotion": [],
                    "objectMotions": [],
                    "particleEffects": []
                  },
                  "audioElements": [],
                  "assetRequests": [],
                  "transitions": []
                }
              ],
              "audioSpecs": {
                "music": {
                  "mood": "peaceful",
                  "tempo": 60,
                  "genre": "ambient",
                  "instrumentation": ["piano", "strings"],
                  "intensity": 30,
                  "notes": "Gentle, uplifting"
                },
                "soundEffects": []
              },
              "duration": { "minutes": 0, "seconds": 5 }
            }
          ],
          "duration": { "minutes": 0, "seconds": 5 }
        }
      ],
      "reviewState": "not-started",
      "approvalState": "pending",
      "metadata": {}
    }
  ],
  
  "brandTokens": {
    "brandId": "brand:acme-summer",
    "brandName": "Acme Brand",
    "primaryColors": [
      {
        "name": "Brand Orange",
        "hex": "#FFB84D",
        "rgb": { "r": 255, "g": 184, "b": 77 },
        "hsl": { "h": 36, "s": 100, "l": 65 },
        "usage": "Primary call-to-action buttons",
        "context": ["web", "video", "social"]
      }
    ],
    "secondaryColors": [],
    "accentColors": [],
    "typography": [],
    "logoVariations": [],
    "imageryGuidelines": [],
    "voiceAndTone": {
      "personality": ["friendly", "authentic", "energetic"],
      "toneInContext": {
        "social": "Casual and relatable",
        "email": "Warm and inviting"
      },
      "doNotUse": ["corporate", "overly formal"]
    },
    "prohibitedElements": [],
    "brandPersonality": {
      "primaryTraits": ["authentic", "youthful", "energetic"],
      "secondaryTraits": ["inclusive", "eco-conscious"],
      "communicationStyle": "Conversational and genuine",
      "valuePropositions": ["Authenticity", "Quality", "Sustainability"]
    }
  },
  
  "designTokens": {
    "spacing": [
      { "name": "xs", "value": 4, "unit": "px" },
      { "name": "sm", "value": 8, "unit": "px" },
      { "name": "md", "value": 16, "unit": "px" },
      { "name": "lg", "value": 24, "unit": "px" },
      { "name": "xl", "value": 32, "unit": "px" }
    ],
    "sizing": [],
    "shadows": [],
    "borders": [],
    "animations": [
      {
        "name": "fadeIn",
        "duration": 300,
        "easing": "ease-out",
        "delay": 0
      }
    ],
    "breakpoints": []
  },
  
  "assetRequests": [],
  "reviews": [],
  "exports": [],
  
  "validationStatus": {
    "isValid": true,
    "errors": [],
    "warnings": [],
    "lastValidatedAt": "2026-06-26T10:00:00Z"
  },
  
  "compilerMetadata": {
    "compileVersion": "1.0.0",
    "compileTimestamp": "2026-06-26T10:00:00Z",
    "sourceComponents": [],
    "compileRules": [],
    "adapterMetadata": {},
    "diagnostics": []
  }
}
```

---

## Documentation

### For Engine Developers

1. Read this specification completely
2. Review example Creative IR documents
3. Understand your engine's consumption/production role
4. Implement validation against JSON Schema
5. Register with AdapterRegistry if you are an adapter
6. Follow backward compatibility rules

### For Integration Partners

1. Implement CompilerRequest interface
2. Call CreativeIRCompiler.compile()
3. Process returned AdapterOutputs
4. Never modify Creative IR documents directly
5. Subscribe to version updates

### For Product Managers

- Creative IR is never shown to marketing users
- All user interfaces should auto-generate from Creative IR
- Review workflows consume Creative IR, produce feedback
- Adapters are the only direct user-facing outputs

---

## Summary

Creative IR is the canonical model for all creative production. It is:

- **Generated automatically** from Business Brief + Brand + Campaign + Feedback
- **Never user-edited** directly
- **Stable and versioned** for cross-engine integration
- **Machine-readable** for deterministic compilation
- **Extensible** through adapters and extensions
- **Backward compatible** through semantic versioning
- **Auditable** through revision history

All future engines MUST consume and/or produce Creative IR.

No engine may define its own internal creative model.

All provider-specific prompts must be generated through Prompt Translation adapters.

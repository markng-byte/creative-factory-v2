import type {
  ApprovalRecordId,
  AssetSlotId,
  BrandGuidelineId,
  BrandId,
  BusinessBriefId,
  CampaignId,
  CreativeStrategyId,
  FrameId,
  GeneratedAssetId,
  OrganizationId,
  ProductionPackageId,
  PromptArtifactId,
  QAReportId,
  ReviewCommentId,
  ReviewCycleId,
  SceneId,
  StoryboardId,
  UserId,
} from './identity.js';
import type {
  AssetKind,
  AuditStamp,
  CampaignLifecycleState,
  ContentHash,
  ProviderRef,
  ReviewDecision,
} from './value-objects.js';

export interface Organization extends AuditStamp {
  readonly id: OrganizationId;
  readonly name: string;
}

export interface Brand extends AuditStamp {
  readonly id: BrandId;
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly activeGuidelineId: BrandGuidelineId;
  readonly pluginId: string;
}

export interface BrandGuidelines extends AuditStamp {
  readonly id: BrandGuidelineId;
  readonly brandId: BrandId;
  readonly version: string;
  readonly sourceOfTruthUri: string;
}

export interface Campaign extends AuditStamp {
  readonly id: CampaignId;
  readonly organizationId: OrganizationId;
  readonly brandId: BrandId;
  readonly name: string;
  readonly lifecycleState: CampaignLifecycleState;
}

export interface BusinessBrief extends AuditStamp {
  readonly id: BusinessBriefId;
  readonly campaignId: CampaignId;
  readonly objective: string;
  readonly audience: string;
  readonly channels: readonly string[];
  readonly constraints: readonly string[];
}

export interface CreativeStrategy extends AuditStamp {
  readonly id: CreativeStrategyId;
  readonly campaignId: CampaignId;
  readonly positioning: string;
  readonly messagingPillars: readonly string[];
  readonly tone: string;
  readonly visualDirection: string;
}

export interface Storyboard extends AuditStamp {
  readonly id: StoryboardId;
  readonly campaignId: CampaignId;
  readonly scenes: readonly Scene[];
}

export interface Scene {
  readonly id: SceneId;
  readonly order: number;
  readonly intent: string;
  readonly frames: readonly Frame[];
}

export interface Frame {
  readonly id: FrameId;
  readonly order: number;
  readonly intent: string;
  readonly assetSlots: readonly AssetSlot[];
}

export interface AssetSlot {
  readonly id: AssetSlotId;
  readonly kind: AssetKind;
  readonly label: string;
}

export interface ReviewCycle extends AuditStamp {
  readonly id: ReviewCycleId;
  readonly campaignId: CampaignId;
  readonly state: 'OPEN' | 'CLOSED';
}

export interface ReviewComment extends AuditStamp {
  readonly id: ReviewCommentId;
  readonly reviewCycleId: ReviewCycleId;
  readonly authorId: UserId;
  readonly targetPath: string;
  readonly body: string;
}

export interface PromptArtifact extends AuditStamp {
  readonly id: PromptArtifactId;
  readonly campaignId: CampaignId;
  readonly sourceHash: ContentHash;
  readonly targetPath: string;
  readonly version: number;
}

export interface GeneratedAsset extends AuditStamp {
  readonly id: GeneratedAssetId;
  readonly campaignId: CampaignId;
  readonly promptArtifactId: PromptArtifactId;
  readonly provider: ProviderRef;
  readonly uri: string;
  readonly kind: AssetKind;
}

export interface QAReport extends AuditStamp {
  readonly id: QAReportId;
  readonly campaignId: CampaignId;
  readonly assetId: GeneratedAssetId;
  readonly status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
  readonly violations: readonly string[];
}

export interface ApprovalRecord extends AuditStamp {
  readonly id: ApprovalRecordId;
  readonly campaignId: CampaignId;
  readonly approverId: UserId;
  readonly decision: ReviewDecision;
  readonly rationale?: string;
}

export interface ProductionPackage extends AuditStamp {
  readonly id: ProductionPackageId;
  readonly campaignId: CampaignId;
  readonly manifestUri: string;
  readonly destination: string;
}

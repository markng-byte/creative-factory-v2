export type Opaque<K, T> = K & { readonly __brand: T };

export type EntityId = Opaque<string, 'EntityId'>;
export type OrganizationId = Opaque<string, 'OrganizationId'>;
export type BrandId = Opaque<string, 'BrandId'>;
export type BrandGuidelineId = Opaque<string, 'BrandGuidelineId'>;
export type CampaignId = Opaque<string, 'CampaignId'>;
export type BusinessBriefId = Opaque<string, 'BusinessBriefId'>;
export type CreativeStrategyId = Opaque<string, 'CreativeStrategyId'>;
export type StoryboardId = Opaque<string, 'StoryboardId'>;
export type SceneId = Opaque<string, 'SceneId'>;
export type FrameId = Opaque<string, 'FrameId'>;
export type AssetSlotId = Opaque<string, 'AssetSlotId'>;
export type ReviewCycleId = Opaque<string, 'ReviewCycleId'>;
export type ReviewCommentId = Opaque<string, 'ReviewCommentId'>;
export type PromptArtifactId = Opaque<string, 'PromptArtifactId'>;
export type GeneratedAssetId = Opaque<string, 'GeneratedAssetId'>;
export type QAReportId = Opaque<string, 'QAReportId'>;
export type ApprovalRecordId = Opaque<string, 'ApprovalRecordId'>;
export type ProductionPackageId = Opaque<string, 'ProductionPackageId'>;
export type UserId = Opaque<string, 'UserId'>;

export type DomainId =
  | EntityId
  | OrganizationId
  | BrandId
  | BrandGuidelineId
  | CampaignId
  | BusinessBriefId
  | CreativeStrategyId
  | StoryboardId
  | SceneId
  | FrameId
  | AssetSlotId
  | ReviewCycleId
  | ReviewCommentId
  | PromptArtifactId
  | GeneratedAssetId
  | QAReportId
  | ApprovalRecordId
  | ProductionPackageId
  | UserId;

function createBrandedId<T extends string>(value: string, label: T): Opaque<string, T> {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`${label} cannot be empty`);
  }

  return normalized as Opaque<string, T>;
}

export function createEntityId(id: string): EntityId {
  return createBrandedId(id, 'EntityId');
}

export function createOrganizationId(id: string): OrganizationId {
  return createBrandedId(id, 'OrganizationId');
}

export function createBrandId(id: string): BrandId {
  return createBrandedId(id, 'BrandId');
}

export function createBrandGuidelineId(id: string): BrandGuidelineId {
  return createBrandedId(id, 'BrandGuidelineId');
}

export function createCampaignId(id: string): CampaignId {
  return createBrandedId(id, 'CampaignId');
}

export function createBusinessBriefId(id: string): BusinessBriefId {
  return createBrandedId(id, 'BusinessBriefId');
}

export function createCreativeStrategyId(id: string): CreativeStrategyId {
  return createBrandedId(id, 'CreativeStrategyId');
}

export function createStoryboardId(id: string): StoryboardId {
  return createBrandedId(id, 'StoryboardId');
}

export function createSceneId(id: string): SceneId {
  return createBrandedId(id, 'SceneId');
}

export function createFrameId(id: string): FrameId {
  return createBrandedId(id, 'FrameId');
}

export function createAssetSlotId(id: string): AssetSlotId {
  return createBrandedId(id, 'AssetSlotId');
}

export function createReviewCycleId(id: string): ReviewCycleId {
  return createBrandedId(id, 'ReviewCycleId');
}

export function createReviewCommentId(id: string): ReviewCommentId {
  return createBrandedId(id, 'ReviewCommentId');
}

export function createPromptArtifactId(id: string): PromptArtifactId {
  return createBrandedId(id, 'PromptArtifactId');
}

export function createGeneratedAssetId(id: string): GeneratedAssetId {
  return createBrandedId(id, 'GeneratedAssetId');
}

export function createQAReportId(id: string): QAReportId {
  return createBrandedId(id, 'QAReportId');
}

export function createApprovalRecordId(id: string): ApprovalRecordId {
  return createBrandedId(id, 'ApprovalRecordId');
}

export function createProductionPackageId(id: string): ProductionPackageId {
  return createBrandedId(id, 'ProductionPackageId');
}

export function createUserId(id: string): UserId {
  return createBrandedId(id, 'UserId');
}

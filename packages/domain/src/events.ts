import type {
  ApprovalRecordId,
  BrandGuidelineId,
  CampaignId,
  GeneratedAssetId,
  PromptArtifactId,
  QAReportId,
  ReviewCycleId,
} from './identity.js';
import type { CampaignLifecycleState, ReviewDecision } from './value-objects.js';

export type DomainEventName =
  | 'campaign.created'
  | 'campaign.lifecycle.transitioned'
  | 'brand.guidelines.published'
  | 'review.requested'
  | 'review.completed'
  | 'prompt.generated'
  | 'prompt.invalidated'
  | 'asset.job.completed'
  | 'qa.completed'
  | 'approval.recorded'
  | 'export.completed';

export interface DomainEventEnvelope<TName extends DomainEventName, TPayload> {
  readonly id: string;
  readonly name: TName;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: TPayload;
}

export type CampaignCreatedEvent = DomainEventEnvelope<
  'campaign.created',
  {
    readonly campaignId: CampaignId;
  }
>;

export type CampaignLifecycleTransitionedEvent = DomainEventEnvelope<
  'campaign.lifecycle.transitioned',
  {
    readonly campaignId: CampaignId;
    readonly from: CampaignLifecycleState;
    readonly to: CampaignLifecycleState;
    readonly reason: string;
  }
>;

export type BrandGuidelinesPublishedEvent = DomainEventEnvelope<
  'brand.guidelines.published',
  {
    readonly guidelineId: BrandGuidelineId;
    readonly version: string;
  }
>;

export type ReviewRequestedEvent = DomainEventEnvelope<
  'review.requested',
  {
    readonly campaignId: CampaignId;
    readonly reviewCycleId: ReviewCycleId;
  }
>;

export type ReviewCompletedEvent = DomainEventEnvelope<
  'review.completed',
  {
    readonly campaignId: CampaignId;
    readonly reviewCycleId: ReviewCycleId;
    readonly decision: ReviewDecision;
  }
>;

export type PromptGeneratedEvent = DomainEventEnvelope<
  'prompt.generated',
  {
    readonly campaignId: CampaignId;
    readonly promptArtifactId: PromptArtifactId;
  }
>;

export type PromptInvalidatedEvent = DomainEventEnvelope<
  'prompt.invalidated',
  {
    readonly campaignId: CampaignId;
    readonly promptArtifactId: PromptArtifactId;
  }
>;

export type AssetJobCompletedEvent = DomainEventEnvelope<
  'asset.job.completed',
  {
    readonly campaignId: CampaignId;
    readonly assetId: GeneratedAssetId;
  }
>;

export type QACompletedEvent = DomainEventEnvelope<
  'qa.completed',
  {
    readonly campaignId: CampaignId;
    readonly reportId: QAReportId;
    readonly status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
  }
>;

export type ApprovalRecordedEvent = DomainEventEnvelope<
  'approval.recorded',
  {
    readonly campaignId: CampaignId;
    readonly approvalRecordId: ApprovalRecordId;
    readonly decision: ReviewDecision;
  }
>;

export type ExportCompletedEvent = DomainEventEnvelope<
  'export.completed',
  {
    readonly campaignId: CampaignId;
    readonly productionPackageId: string;
  }
>;

export type DomainEvent =
  | CampaignCreatedEvent
  | CampaignLifecycleTransitionedEvent
  | BrandGuidelinesPublishedEvent
  | ReviewRequestedEvent
  | ReviewCompletedEvent
  | PromptGeneratedEvent
  | PromptInvalidatedEvent
  | AssetJobCompletedEvent
  | QACompletedEvent
  | ApprovalRecordedEvent
  | ExportCompletedEvent;

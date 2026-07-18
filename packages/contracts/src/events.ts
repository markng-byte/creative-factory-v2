import type { CampaignLifecycleState, ReviewDecision } from '@creative-factory/domain';

export interface EventEnvelope<TName extends string, TPayload> {
  id: string;
  name: TName;
  version: 1;
  occurredAt: string;
  aggregateId: string;
  causationId?: string;
  correlationId?: string;
  payload: TPayload;
}

export type CampaignLifecycleTransitionedContract = EventEnvelope<
  'campaign.lifecycle.transitioned',
  {
    campaignId: string;
    from: CampaignLifecycleState;
    to: CampaignLifecycleState;
    reason: string;
  }
>;

export type ReviewCompletedContract = EventEnvelope<
  'review.completed',
  {
    campaignId: string;
    reviewCycleId: string;
    decision: ReviewDecision;
  }
>;

export type PromptGeneratedContract = EventEnvelope<
  'prompt.generated',
  {
    campaignId: string;
    promptArtifactId: string;
    sourceHash: string;
    targetPath: string;
    version: number;
  }
>;

export type QACompletedContract = EventEnvelope<
  'qa.completed',
  {
    campaignId: string;
    reportId: string;
    status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
  }
>;

export type AssetGeneratedContract = EventEnvelope<
  'asset.generated',
  {
    campaignId: string;
    assetRequestId: string;
    assetOutputId: string;
    sourceEngine: string;
    format: string;
  }
>;

export type AssetCatalogedContract = EventEnvelope<
  'asset.cataloged',
  {
    campaignId: string;
    libraryAssetId: string;
    versionId: string;
    version: number;
    contentHash: string;
    deduped: boolean;
  }
>;

export type CreativeFactoryEventContract =
  | CampaignLifecycleTransitionedContract
  | ReviewCompletedContract
  | PromptGeneratedContract
  | QACompletedContract
  | AssetGeneratedContract
  | AssetCatalogedContract;

export const EVENT_CONTRACT_NAMES = [
  'campaign.lifecycle.transitioned',
  'review.completed',
  'prompt.generated',
  'qa.completed',
  'asset.generated',
  'asset.cataloged',
] as const;

export type EventContractName = (typeof EVENT_CONTRACT_NAMES)[number];

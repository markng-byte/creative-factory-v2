import type { AssetKind, CampaignLifecycleState, ReviewDecision } from '@creative-factory/domain';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
}

export interface ApiErrorResponse {
  type: string;
  title: string;
  status: number;
  detail?: string;
}

export interface CampaignSummaryDto {
  id: string;
  organizationId: string;
  brandId: string;
  name: string;
  lifecycleState: CampaignLifecycleState;
  updatedAt: string;
}

export interface BusinessBriefDto {
  id: string;
  campaignId: string;
  objective: string;
  audience: string;
  channels: readonly string[];
  constraints: readonly string[];
  updatedAt: string;
}

export interface AssetSlotDto {
  id: string;
  kind: AssetKind;
  label: string;
}

export interface FrameDto {
  id: string;
  order: number;
  intent: string;
  assetSlots: readonly AssetSlotDto[];
}

export interface SceneDto {
  id: string;
  order: number;
  intent: string;
  frames: readonly FrameDto[];
}

export interface StoryboardDto {
  id: string;
  campaignId: string;
  scenes: readonly SceneDto[];
  updatedAt: string;
}

export interface ReviewDecisionRequest {
  reviewCycleId: string;
  decision: ReviewDecision;
  rationale?: string;
}

export interface WorkflowTransitionRequest {
  campaignId: string;
  transition: string;
  actorId: string;
  reason: string;
}

export interface WorkflowTransitionResponse {
  campaignId: string;
  from: CampaignLifecycleState;
  to: CampaignLifecycleState;
  transition: string;
  acceptedAt: string;
}

export type AssetKind = 'image' | 'video' | 'composite';
export type ReviewDecision = 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'ESCALATE';
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

export interface AuditStamp {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ContentHash {
  readonly algorithm: 'sha256';
  readonly value: string;
}

export interface ProviderRef {
  readonly providerId: string;
  readonly modelId: string;
  readonly capability: 'llm' | 'image-generation' | 'video-generation' | 'vision-qa';
}

export interface Duration {
  readonly seconds: number;
}

export interface AspectRatio {
  readonly width: number;
  readonly height: number;
}

export interface Resolution {
  readonly width: number;
  readonly height: number;
}

export interface Money {
  readonly currency: string;
  readonly amountMinor: number;
}

export function createContentHash(value: string): ContentHash {
  const normalized = value.trim().toLowerCase();

  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new Error('ContentHash must be a 64-character sha256 hex digest');
  }

  return { algorithm: 'sha256', value: normalized };
}

export function createAspectRatio(width: number, height: number): AspectRatio {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error('AspectRatio dimensions must be positive integers');
  }

  return { width, height };
}

export function createResolution(width: number, height: number): Resolution {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error('Resolution dimensions must be positive integers');
  }

  return { width, height };
}

export function createDuration(seconds: number): Duration {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new Error('Duration seconds must be a non-negative finite number');
  }

  return { seconds };
}

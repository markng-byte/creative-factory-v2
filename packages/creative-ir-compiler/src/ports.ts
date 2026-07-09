/**
 * Compiler ports.
 *
 * The Creative IR Compiler is hexagonal: its inputs arrive through source ports that resolve
 * canonical artifacts by id, and its side-effect-free needs (time, ids) arrive through the
 * clock and id-generator ports. This keeps every planning stage a pure function and lets tests
 * drive compilation with in-memory fakes.
 */

import type { CreativeBrief } from '@creative-factory/domain';
import type {
  BrandTokens,
  Campaign,
  DesignTokens,
  ReviewFeedback,
} from '@creative-factory/creative-ir';
import type { Clock } from './support/clock.js';
import type { IdGenerator } from './support/id.js';

/** The brand-derived tokens that flow straight through into the Creative IR. */
export interface BrandTokensBundle {
  readonly brandTokens: BrandTokens;
  readonly designTokens: DesignTokens;
}

export interface CreativeBriefSource {
  getById(creativeBriefId: string): Promise<CreativeBrief | undefined>;
}

export interface CampaignSource {
  getById(campaignId: string): Promise<Campaign | undefined>;
}

export interface BrandTokensSource {
  getById(brandId: string): Promise<BrandTokensBundle | undefined>;
}

/** The resolved, in-memory inputs a compilation operates on. */
export interface CompileInputs {
  readonly brief: CreativeBrief;
  readonly campaign: Campaign;
  readonly brand: BrandTokensBundle;
  /**
   * Structured feedback from completed review cycles. When present, the recompilation is
   * recorded as a new revision in the document's revision history (review → feedback →
   * recompile loop, Sprint 6).
   */
  readonly reviewFeedback?: readonly ReviewFeedback[];
}

/**
 * Immutable context threaded through the planning pipeline. Stages read `ids` for stable
 * identifiers; only the assembler reads `clock`. Nothing here performs I/O.
 */
export interface PlanningContext {
  readonly ids: IdGenerator;
  readonly clock: Clock;
  readonly seed: string;
}

export interface CompilerPorts {
  readonly briefs: CreativeBriefSource;
  readonly campaigns: CampaignSource;
  readonly brands: BrandTokensSource;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

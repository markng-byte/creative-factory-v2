/**
 * Storyboard gate.
 *
 * Image and video generation through a paid, external provider may only run after a human has
 * approved the storyboard — the `approve_storyboard` workflow transition, which moves a campaign
 * from STORYBOARD_REVIEW to PROMPT_READY. The gate reads the campaign lifecycle state carried by
 * the Creative IR and refuses before any provider is called.
 *
 * Offline providers (the deterministic SVG / SMIL renderers, the dry-run provider) send nothing
 * anywhere and cost nothing, so by default they are not gated; tests, examples, and the demo keep
 * running unchanged. Every other provider is gated unless the caller explicitly opts out.
 */

import type { CampaignLifecycleState, CreativeIR } from './types.js';

/** Lifecycle states reached only after the storyboard was approved. */
export const STORYBOARD_APPROVED_STATES: readonly CampaignLifecycleState[] = [
  'PROMPT_READY',
  'ASSET_GENERATION_PENDING',
  'ASSET_GENERATION_RUNNING',
  'ASSET_REVIEW',
  'FINAL_APPROVAL',
  'EXPORTING',
  'COMPLETED',
];

/**
 * `external-only` (default): gate every provider that does not declare itself offline.
 * `always`: gate every provider. `off`: never gate (explicit opt-out, e.g. offline previews).
 */
export type StoryboardGateMode = 'external-only' | 'always' | 'off';

export class StoryboardNotApprovedError extends Error {
  readonly code = 'STORYBOARD_NOT_APPROVED' as const;

  constructor(
    readonly campaignId: string,
    readonly lifecycleState: CampaignLifecycleState,
    readonly provider: string,
  ) {
    super(
      `Storyboard for campaign ${campaignId} is not approved (state ${lifecycleState}); ` +
        `refusing to call provider "${provider}".`,
    );
    this.name = 'StoryboardNotApprovedError';
  }
}

export function isStoryboardApproved(ir: CreativeIR): boolean {
  return STORYBOARD_APPROVED_STATES.includes(ir.campaign.lifecycleState);
}

/** Throws StoryboardNotApprovedError when the gate applies and the storyboard is not approved. */
export function assertGenerationAllowed(
  ir: CreativeIR,
  provider: { readonly name: string; readonly offline?: boolean },
  mode: StoryboardGateMode = 'external-only',
): void {
  if (mode === 'off') return;
  if (mode === 'external-only' && provider.offline === true) return;
  if (!isStoryboardApproved(ir)) {
    throw new StoryboardNotApprovedError(ir.campaign.id, ir.campaign.lifecycleState, provider.name);
  }
}

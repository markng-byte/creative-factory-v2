/**
 * Gate mapping.
 *
 * Binds each review target kind to its workflow-engine human gate: the lifecycle state a
 * campaign must be in for the cycle to open, and the transitions its outcomes drive. The
 * review engine never invents transitions — it only requests moves the deterministic state
 * machine already defines, so an approval can never skip a gate.
 *
 * Note the asymmetry at the final gate: the state machine defines no "request changes" out of
 * FINAL_APPROVAL, so a final-gate changes-request yields no transition (the campaign stays at
 * the gate for a fresh cycle) and only reject maps to `cancel`.
 */

import type { CampaignLifecycleState } from '@creative-factory/domain';
import type { WorkflowTransition } from '@creative-factory/workflow-engine';
import type { ReviewTargetKind } from './types.js';

export interface GateBinding {
  readonly targetKind: ReviewTargetKind;
  /** Lifecycle state the campaign must be in to open this cycle. */
  readonly gateState: CampaignLifecycleState;
  readonly approveTransition: WorkflowTransition;
  readonly changesTransition?: WorkflowTransition;
  readonly rejectTransition: WorkflowTransition;
}

export const GATE_BINDINGS: Readonly<Record<ReviewTargetKind, GateBinding>> = {
  strategy: {
    targetKind: 'strategy',
    gateState: 'STRATEGY_REVIEW',
    approveTransition: 'approve_strategy',
    changesTransition: 'request_strategy_changes',
    rejectTransition: 'cancel',
  },
  storyboard: {
    targetKind: 'storyboard',
    gateState: 'STORYBOARD_REVIEW',
    approveTransition: 'approve_storyboard',
    changesTransition: 'request_storyboard_changes',
    rejectTransition: 'cancel',
  },
  assets: {
    targetKind: 'assets',
    gateState: 'ASSET_REVIEW',
    approveTransition: 'approve_assets',
    changesTransition: 'request_asset_changes',
    rejectTransition: 'cancel',
  },
  final: {
    targetKind: 'final',
    gateState: 'FINAL_APPROVAL',
    approveTransition: 'start_export',
    changesTransition: undefined,
    rejectTransition: 'cancel',
  },
};

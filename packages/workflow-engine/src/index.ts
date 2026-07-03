import type { CampaignLifecycleState } from '@creative-factory/domain';
import { err, ok, type Result } from '@creative-factory/shared-kernel';

export const WORKFLOW_ENGINE_PACKAGE = '@creative-factory/workflow-engine' as const;

export type WorkflowTransition =
  | 'submit_brief'
  | 'draft_strategy'
  | 'request_strategy_review'
  | 'approve_strategy'
  | 'request_strategy_changes'
  | 'draft_storyboard'
  | 'request_storyboard_review'
  | 'approve_storyboard'
  | 'request_storyboard_changes'
  | 'prepare_generation'
  | 'start_generation'
  | 'complete_generation'
  | 'approve_assets'
  | 'request_asset_changes'
  | 'start_export'
  | 'complete_export'
  | 'cancel';

export interface TransitionDefinition {
  readonly transition: WorkflowTransition;
  readonly from: CampaignLifecycleState;
  readonly to: CampaignLifecycleState;
  readonly requiresHumanGate: boolean;
  readonly description: string;
}

export interface TransitionRequest {
  readonly from: CampaignLifecycleState;
  readonly transition: WorkflowTransition;
}

export interface TransitionAccepted {
  readonly from: CampaignLifecycleState;
  readonly to: CampaignLifecycleState;
  readonly transition: WorkflowTransition;
  readonly requiresHumanGate: boolean;
}

export interface TransitionRejected {
  readonly code: 'UNKNOWN_TRANSITION' | 'INVALID_TRANSITION';
  readonly message: string;
  readonly from: CampaignLifecycleState;
  readonly transition: WorkflowTransition;
}

export const TRANSITION_DEFINITIONS = [
  {
    transition: 'submit_brief',
    from: 'DRAFT',
    to: 'BRIEF_READY',
    requiresHumanGate: false,
    description: 'Business brief has enough structured input to begin strategy drafting.',
  },
  {
    transition: 'draft_strategy',
    from: 'BRIEF_READY',
    to: 'STRATEGY_DRAFT',
    requiresHumanGate: false,
    description: 'Strategy draft work begins from the approved brief.',
  },
  {
    transition: 'request_strategy_review',
    from: 'STRATEGY_DRAFT',
    to: 'STRATEGY_REVIEW',
    requiresHumanGate: true,
    description: 'Strategy is ready for human review.',
  },
  {
    transition: 'approve_strategy',
    from: 'STRATEGY_REVIEW',
    to: 'STORYBOARD_DRAFT',
    requiresHumanGate: true,
    description: 'Human reviewer approved strategy direction.',
  },
  {
    transition: 'request_strategy_changes',
    from: 'STRATEGY_REVIEW',
    to: 'STRATEGY_DRAFT',
    requiresHumanGate: true,
    description: 'Human reviewer requested strategy changes.',
  },
  {
    transition: 'draft_storyboard',
    from: 'STORYBOARD_DRAFT',
    to: 'STORYBOARD_DRAFT',
    requiresHumanGate: false,
    description: 'Storyboard draft is being updated without leaving the draft state.',
  },
  {
    transition: 'request_storyboard_review',
    from: 'STORYBOARD_DRAFT',
    to: 'STORYBOARD_REVIEW',
    requiresHumanGate: true,
    description: 'Storyboard is ready for human review.',
  },
  {
    transition: 'approve_storyboard',
    from: 'STORYBOARD_REVIEW',
    to: 'PROMPT_READY',
    requiresHumanGate: true,
    description: 'Human reviewer approved storyboard direction.',
  },
  {
    transition: 'request_storyboard_changes',
    from: 'STORYBOARD_REVIEW',
    to: 'STORYBOARD_DRAFT',
    requiresHumanGate: true,
    description: 'Human reviewer requested storyboard changes.',
  },
  {
    transition: 'prepare_generation',
    from: 'PROMPT_READY',
    to: 'ASSET_GENERATION_PENDING',
    requiresHumanGate: false,
    description: 'Prompt artifacts are ready and asset generation jobs can be queued.',
  },
  {
    transition: 'start_generation',
    from: 'ASSET_GENERATION_PENDING',
    to: 'ASSET_GENERATION_RUNNING',
    requiresHumanGate: false,
    description: 'Asset generation workers have started processing queued jobs.',
  },
  {
    transition: 'complete_generation',
    from: 'ASSET_GENERATION_RUNNING',
    to: 'ASSET_REVIEW',
    requiresHumanGate: false,
    description: 'Generation and automated QA have completed enough for asset review.',
  },
  {
    transition: 'approve_assets',
    from: 'ASSET_REVIEW',
    to: 'FINAL_APPROVAL',
    requiresHumanGate: true,
    description: 'Human reviewer approved generated assets.',
  },
  {
    transition: 'request_asset_changes',
    from: 'ASSET_REVIEW',
    to: 'PROMPT_READY',
    requiresHumanGate: true,
    description: 'Human reviewer requested asset changes that require prompt regeneration.',
  },
  {
    transition: 'start_export',
    from: 'FINAL_APPROVAL',
    to: 'EXPORTING',
    requiresHumanGate: true,
    description: 'Final approval has been granted and production export can start.',
  },
  {
    transition: 'complete_export',
    from: 'EXPORTING',
    to: 'COMPLETED',
    requiresHumanGate: false,
    description: 'Production package export completed.',
  },
  {
    transition: 'cancel',
    from: 'DRAFT',
    to: 'CANCELLED',
    requiresHumanGate: true,
    description: 'Campaign was cancelled before production.',
  },
  {
    transition: 'cancel',
    from: 'BRIEF_READY',
    to: 'CANCELLED',
    requiresHumanGate: true,
    description: 'Campaign was cancelled before production.',
  },
  {
    transition: 'cancel',
    from: 'STRATEGY_DRAFT',
    to: 'CANCELLED',
    requiresHumanGate: true,
    description: 'Campaign was cancelled before production.',
  },
  {
    transition: 'cancel',
    from: 'STRATEGY_REVIEW',
    to: 'CANCELLED',
    requiresHumanGate: true,
    description: 'Campaign was cancelled before production.',
  },
  {
    transition: 'cancel',
    from: 'STORYBOARD_DRAFT',
    to: 'CANCELLED',
    requiresHumanGate: true,
    description: 'Campaign was cancelled before production.',
  },
  {
    transition: 'cancel',
    from: 'STORYBOARD_REVIEW',
    to: 'CANCELLED',
    requiresHumanGate: true,
    description: 'Campaign was cancelled before production.',
  },
  {
    transition: 'cancel',
    from: 'PROMPT_READY',
    to: 'CANCELLED',
    requiresHumanGate: true,
    description: 'Campaign was cancelled before production.',
  },
  {
    transition: 'cancel',
    from: 'ASSET_GENERATION_PENDING',
    to: 'CANCELLED',
    requiresHumanGate: true,
    description: 'Campaign was cancelled before production.',
  },
  {
    transition: 'cancel',
    from: 'ASSET_GENERATION_RUNNING',
    to: 'CANCELLED',
    requiresHumanGate: true,
    description: 'Campaign was cancelled before production.',
  },
  {
    transition: 'cancel',
    from: 'ASSET_REVIEW',
    to: 'CANCELLED',
    requiresHumanGate: true,
    description: 'Campaign was cancelled before production.',
  },
  {
    transition: 'cancel',
    from: 'FINAL_APPROVAL',
    to: 'CANCELLED',
    requiresHumanGate: true,
    description: 'Campaign was cancelled before production.',
  },
  {
    transition: 'cancel',
    from: 'EXPORTING',
    to: 'CANCELLED',
    requiresHumanGate: true,
    description: 'Campaign was cancelled before production.',
  },
] as const satisfies readonly TransitionDefinition[];

export const HUMAN_GATE_STATES = [
  'STRATEGY_REVIEW',
  'STORYBOARD_REVIEW',
  'ASSET_REVIEW',
  'FINAL_APPROVAL',
] as const satisfies readonly CampaignLifecycleState[];

export function isHumanGateState(state: CampaignLifecycleState): boolean {
  return HUMAN_GATE_STATES.includes(state as (typeof HUMAN_GATE_STATES)[number]);
}

export function allowedTransitionsFrom(
  state: CampaignLifecycleState,
): readonly TransitionDefinition[] {
  return TRANSITION_DEFINITIONS.filter((definition) => definition.from === state);
}

export function evaluateTransition(
  request: TransitionRequest,
): Result<TransitionAccepted, TransitionRejected> {
  const candidates = TRANSITION_DEFINITIONS.filter(
    (definition) => definition.transition === request.transition,
  );

  if (candidates.length === 0) {
    return err({
      code: 'UNKNOWN_TRANSITION',
      message: `Unknown workflow transition: ${request.transition}`,
      from: request.from,
      transition: request.transition,
    });
  }

  const definition = candidates.find((candidate) => candidate.from === request.from);

  if (!definition) {
    return err({
      code: 'INVALID_TRANSITION',
      message: `Cannot apply ${request.transition} from ${request.from}`,
      from: request.from,
      transition: request.transition,
    });
  }

  return ok({
    from: definition.from,
    to: definition.to,
    transition: definition.transition,
    requiresHumanGate: definition.requiresHumanGate,
  });
}

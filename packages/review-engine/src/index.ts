/**
 * @creative-factory/review-engine
 *
 * Human Review & Approval Engine (Sprint 6). Opens review cycles at the workflow's four human
 * gates, collects comments anchored to Creative IR nodes, advances configurable multi-level
 * approval chains, and closes each cycle into a complete outcome: a validated workflow
 * transition, contract events, structured feedback for recompilation, and the canonical
 * Creative IR `Review` record.
 *
 * @packageDocumentation
 */

export const REVIEW_ENGINE_PACKAGE = '@creative-factory/review-engine' as const;

// Model
export type {
  AnchorKind,
  ApprovalPolicy,
  ApprovalStep,
  ApprovalType,
  CommentAnchor,
  CommentSeverity,
  CommentThread,
  CommentThreadId,
  DecisionId,
  EscalationBehavior,
  RecordedDecision,
  ReviewCommentId,
  ReviewCycle,
  ReviewCycleComment,
  ReviewCycleId,
  ReviewCycleState,
  ReviewError,
  ReviewErrorCode,
  ReviewTargetKind,
  ReviewVerdict,
  StructuredFeedbackItem,
} from './types.js';

// Engine
export {
  StandardReviewEngine,
  type AddCommentRequest,
  type DecisionRequest,
  type DecisionResult,
  type OpenCycleRequest,
  type ReviewEngineDependencies,
  type ReviewOutcome,
} from './engine.js';

// Policy
export { DEFAULT_APPROVAL_POLICIES, evaluateChain, validatePolicy } from './policy.js';
export type { ChainEvaluation } from './policy.js';

// Gates
export { GATE_BINDINGS, type GateBinding } from './gates.js';

// Anchors
export { buildAnchorIndex, isAnchorValid } from './anchors.js';

// Feedback
export { compilerFeedback, structuredFeedback } from './feedback.js';

// Events
export {
  buildLifecycleTransitionedEvent,
  buildReviewCompletedEvent,
  reviewDecisionForState,
} from './events.js';

// IR mapping
export { toCreativeIRReview } from './ir-review.js';

// Registry
export { InMemoryReviewRegistry, type ReviewRegistry } from './registry.js';

// Ports
export {
  FixedClock,
  SequentialIdGenerator,
  SystemClock,
  type Clock,
  type IdGenerator,
} from './support.js';

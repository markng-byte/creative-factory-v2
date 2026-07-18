# Enterprise AI Creative Factory Roadmap

This roadmap is updated at the end of each sprint. The project follows an incremental methodology: review the existing repository, evaluate completed work, adjust the plan, define acceptance criteria, implement only the current sprint, test, document, and then update this file.

**Architecture Foundation**: Creative Intermediate Representation (Creative IR) is the canonical, machine-readable representation of every creative artifact. It is generated automatically from Business Brief, Brand Package, Campaign Package, and Human Review feedback. Creative IR becomes the Single Source of Truth between all engines.

## Sprint Status

| Sprint    | Scope                                                               | Status                                      |
| --------- | ------------------------------------------------------------------- | ------------------------------------------- |
| Sprint 0  | Architecture & PRD                                                  | Complete from imported architecture context |
| Sprint 1  | Monorepo & Infrastructure                                           | Complete                                    |
| Sprint 2  | Domain Models, Contracts & Workflow Engine + Creative IR Foundation | Complete                                    |
| Sprint 3  | Brand Intelligence Engine                                           | Complete                                    |
| Sprint 4  | Campaign & Creative Brief Engine                                    | Complete                                    |
| Sprint 5  | Creative IR Compiler + Multi-Adapter Output Generation              | Complete                                    |
| Sprint 6  | Human Review & Approval Engine                                      | Complete                                    |
| Sprint 7  | Prompt Translation Engine                                           | Complete                                    |
| Sprint 8  | Image Generation Engine                                             | Not started                                 |
| Sprint 9  | Video Generation Engine                                             | Not started                                 |
| Sprint 10 | QA & Brand Compliance Engine                                        | Not started                                 |
| Sprint 11 | Asset Library & Versioning                                          | Not started                                 |
| Sprint 12 | Export & Publishing Engine                                          | Not started                                 |
| Sprint 13 | Analytics & Optimization                                            | Not started                                 |
| Sprint 14 | Enterprise Hardening & Documentation                                | Not started                                 |

## Sprint 2 Acceptance Criteria

- Domain package exposes typed IDs, core value objects, aggregate/entity interfaces, and domain event types for the creative production lifecycle.
- Contracts package exposes stable API DTOs and versioned event envelope types without coupling callers to implementation details.
- Repository-level event JSON schemas exist for the lifecycle and review events that currently define cross-service boundaries.
- Workflow engine package exposes a deterministic state machine with allowed transitions, human gate metadata, invalid-transition rejection, and tests.
- Creative IR specification is defined as a versioned, machine-readable contract independent of code implementation.
- Sprint 2 does not implement brand rules, brief CRUD, strategy/storyboard generation, prompt generation, asset generation, QA execution, export, analytics, or enterprise hardening.

## Sprint 2 Completed Work

- Replaced the placeholder domain scaffold with real domain identities, value objects, entities, and event definitions.
- Expanded contracts from health-only types to campaign, brief, storyboard, review, workflow, and event contracts.
- Added `@creative-factory/workflow-engine` as a pure TypeScript package.
- Added tests for domain validation, contract envelopes, and workflow transition behavior.
- Added Sprint 2 architecture notes in `docs/architecture/sprint-2-domain-contracts-workflow.md`.
- Created Creative IR specification as the canonical model for creative artifacts.

## Sprint 3 Acceptance Criteria

- [x] Brand package importer with pluggable architecture (JSON, YAML, Markdown, custom formats)
- [x] Brand package validator with structural and semantic validation rules
- [x] Brand normalizer converting raw packages to BrandProfile representation
- [x] Brand tokenizer generating DesignTokens for color, typography, spacing, animation, shadows, components
- [x] Brand rule extractor defining brand constraints and guidelines
- [x] Brand registry for storing, retrieving, and versioning brand profiles
- [x] Strong typing with BrandId, BrandProfileId, BrandPackageId branded types throughout
- [x] Configuration-driven validation and tokenization (no hardcoding)
- [x] Plugin architecture enabling future importers and validators without core changes
- [x] Comprehensive unit tests for all packages
- [x] No source code changes required to onboard new brands
- [x] Brand profiles integrate with Creative IR as single source of truth for visual identity

## Sprint 3 Completed Work

- Created `@creative-factory/domain` extension with complete brand type system (brand-types.ts)
- Created `@creative-factory/brand-engine` orchestrator interfaces for workflow coordination
- Created `@creative-factory/brand-importers` package with pluggable registry and three importers:
  - JSONBrandImporter: JSON format brand packages
  - YAMLBrandImporter: YAML format (js-yaml dependency)
  - MarkdownBrandImporter: Markdown guideline documents with intelligent section extraction
- Created `@creative-factory/brand-validator` package with structural and semantic validation
- Created `@creative-factory/brand-tokenizer` package generating design tokens for all categories
- Created `@creative-factory/brand-registry` package with memory-based registry implementation
- Added comprehensive documentation: `docs/sprint-3-brand-engine.md`
- Created example brand package: `docs/examples/brand-package-acme.yaml`
- All packages configured with TypeScript strict mode, Vitest tests, and ESLint
- Full type safety throughout with no implicit any types

## Sprint 3 Non-Implementation Decisions

Sprint 3 did not implement:

- Database backend for brand registry (memory-only implementation)
- PDF, Figma, or other advanced importer formats (plugin architecture allows future addition)
- Advanced brand rule engine with complex constraint evaluation (basic validation sufficient)
- Brand profile versioning with database history (future work)
- Orchestrator implementation with error recovery (interfaces defined, implementation pending Sprint 4 integration)
- Integration with Creative IR generation (ready for Sprint 4)

## Sprint 4 Entry Criteria

Sprint 4 can start after Sprint 3 tests and typechecks pass. Its expected scope is the Campaign & Creative Brief Engine plus Orchestrator implementation: campaign package modeling, brief generation, strategy and storyboard generation, and brand integration.

## Sprint 4 Acceptance Criteria

- [x] Business Brief importer with pluggable format architecture (JSON, YAML)
- [x] Audience model generator producing processed segments, personas, psychographic/journey/media maps, and sentiment from a business brief
- [x] Messaging framework generator producing core message, supporting messages, tone/voice, pillars, channel variations, and CTAs
- [x] Creative Brief builder orchestrating audience + messaging generation into a domain `CreativeBrief`
- [x] Campaign registry (memory + versioned) for storing, retrieving, and rolling back campaign packages
- [x] Campaign Engine orchestrator running the end-to-end workflow: import brief → model audience → generate messaging → build creative brief → validate → store
- [x] Domain types extended with campaign and business-brief definitions (`campaign-types.ts`)
- [x] Strong typing with branded IDs throughout; configuration-driven, no hardcoded campaign logic
- [x] Comprehensive unit tests for every package (build, typecheck, lint, and test all green across the monorepo)

## Sprint 4 Completed Work

- Added six packages implementing the Campaign & Creative Brief Engine:
  - `@creative-factory/business-brief-importer`: pluggable JSON/YAML importers with a registry
  - `@creative-factory/audience-model`: `StandardAudienceModelGenerator` and the audience model type system
  - `@creative-factory/messaging-engine`: `StandardMessagingFrameworkGenerator` and the messaging model type system
  - `@creative-factory/creative-brief`: `StandardCreativeBriefBuilder` mapping engine outputs into the domain `CreativeBrief`
  - `@creative-factory/campaign-registry`: memory-based and versioned campaign registries
  - `@creative-factory/campaign-engine`: `StandardCampaignEngineOrchestrator` coordinating the full workflow
- Extended `@creative-factory/domain` with campaign/business-brief types and an `ISO8601Timestamp` value type.
- Audience and messaging engines expose their intermediate models as package-local types (`audience-model`, `messaging-engine`) that the creative-brief builder maps onto the canonical domain contract, keeping the domain the single source of truth for the final brief.
- Stabilized the build toolchain across all packages: each package builds through its own `tsconfig.build.json` (emitting to `dist`, excluding tests), test scripts standardized to `vitest run`, and package eslint configs aligned to the shared `library`/`next` presets.
- Fixed defects surfaced while getting the workspace green: duplicate re-exports in `creative-ir`, broken relative test imports, a `require()` call inside an ESM module, and jest-dom matcher wiring for the web app.
- See `docs/sprint-4-campaign-engine.md` for architecture and data-flow details.

## Sprint 4 Non-Implementation Decisions

Sprint 4 did not implement:

- Database-backed campaign or brief persistence (memory-only registries)
- Markdown or other advanced business-brief importer formats (plugin architecture allows future addition)
- AI/LLM-driven generation for audience insight, messaging, or creative direction (deterministic heuristics used as placeholders)
- Deep brand-profile integration beyond referencing brand IDs and primary color (full brand-to-brief synthesis deferred)
- Generation of Creative IR from the Creative Brief (that bridge is Sprint 5 compiler scope)

## Sprint 5: Creative IR Compiler + Multi-Adapter Output Generation

Sprint 5 is redefined to build the Creative IR Compiler, which transforms Creative IR into multiple production artifacts:

- Human-readable Storyboards
- Scene Specifications
- Shot Lists
- Motion Specifications
- Prompt Packages
- Image Generation Requests
- Video Generation Requests
- QA Specifications
- Export Packages

The compiler must support pluggable output adapters. Future adapters must integrate without changing the core compiler architecture.

## Sprint 5 Acceptance Criteria

- [x] Deterministic `CreativeIRCompiler` implementation that builds a fully-populated, schema-valid Creative IR from a Creative Brief, Campaign, and Brand Tokens — with no AI provider calls
- [x] Nine independently-testable pure planning stages: narrative, story, storyboard, scene, shot, composition, motion, timing, asset
- [x] Frame-accurate Timing Planner whose per-element frames sum exactly to the campaign duration
- [x] Marketing constraints normalized onto the canonical `Constraint` model (no new constraint concept)
- [x] Pluggable output adapters implementing the existing `CreativeIRAdapter` interfaces, managed by a registry, discoverable by capability
- [x] Seven adapters: storyboard-html, scene-spec, shot-list, motion-spec, asset-plan, timeline, qa-spec
- [x] Reusable Creative Package bundling all adapter outputs + derived creative metadata as the canonical downstream input
- [x] Concrete `StandardCreativeIRValidator` (structural, semantic, compiler rule families)
- [x] Determinism guarantee: identical inputs yield a byte-identical Creative IR and Creative Package (unit-tested)
- [x] Strong typing, immutable pipeline stages, versioned outputs, full unit + integration tests
- [x] Worked example (Creative IR + Creative Package + storyboard) committed under `docs/examples/`
- [x] Documentation in `docs/sprint-5-creative-ir-compiler.md`; build, lint, and test green across the monorepo

## Sprint 5 Completed Work

- Extended `@creative-factory/creative-ir`: added `StandardCreativeIRValidator`, an additive optional `SceneObjectives` field on `Scene`, and fixed the branded-ID helpers (removed `as any`).
- Added `@creative-factory/creative-ir-compiler`: the `StandardCreativeIRCompiler`, a hexagonal ports layer (brief/campaign/brand sources + `Clock` + `IdGenerator`), nine pure planning stages, a pipeline assembler, in-memory sources, and a worked example fixture (`exampleCreativeBrief` / `exampleCampaign` / `exampleBrandBundle`).
- Added `@creative-factory/creative-ir-adapters`: seven output adapters, `StandardAdapterRegistry`, and the Creative Package assembler (`renderCreativePackage` / `assembleCreativePackage`).
- Generated committed examples: `docs/examples/creative-ir-northwind.json`, `docs/examples/creative-package-northwind.json`, `docs/examples/storyboard-northwind.html`.
- See `docs/sprint-5-creative-ir-compiler.md` for architecture, data flow, and stage-to-IR mapping.

## Sprint 5 Non-Implementation Decisions

Sprint 5 did not implement:

- Prompt-Translation, Image-Generation, Video-Generation, or Export adapters (Sprints 7–12); their interfaces remain stubs.
- Any AI/LLM-driven generation (deterministic heuristics are used throughout, as in Sprint 4).
- Database-backed persistence (source ports ship with in-memory implementations only).
- Human review/approval logic (Sprint 6).

## Sprint 6 Acceptance Criteria

- [x] Review cycles bound to the workflow engine's four human gates (strategy, storyboard, assets, final), opening only when the campaign sits at the matching lifecycle state
- [x] Configurable multi-level approval chains (creative → brand → legal → final) with per-step quorum, escalation behavior, and per-level duplicate-reviewer protection
- [x] Comments anchored to specific Creative IR nodes (document, story, storyboard, scene, shot, asset request), validated structurally against the reviewed document; threads with severity and resolution
- [x] Cycle outcomes drive the deterministic state machine — transitions are evaluated by `workflow-engine`, never invented, so approvals cannot skip gates
- [x] Existing contract events emitted on closure: `review.completed` and `campaign.lifecycle.transitioned`
- [x] Review → feedback → recompile loop closed: changes-requested cycles yield `ReviewFeedback` consumed by `CompilerRequest.reviewFeedback`, and the compiler records the recompilation in the document's revision history
- [x] Closed cycles projected onto the canonical `Review` type in `@creative-factory/creative-ir`
- [x] Deterministic under injected clock/id ports (byte-identical outcomes for identical operation sequences, unit-tested)
- [x] Comprehensive unit + integration tests (19 tests, including a full gate walkthrough against a real compiled Creative IR); build, lint, and test green across the monorepo

## Sprint 6 Completed Work

- Added `@creative-factory/review-engine`: `StandardReviewEngine` (open/comment/resolve/decide/cancel), gate bindings, default approval policies with a pure `evaluateChain` fold, anchor indexing/validation, feedback normalization (`compilerFeedback` + `structuredFeedback`), contract event builders, Creative IR `Review` projection, and an in-memory registry.
- Extended `@creative-factory/creative-ir-compiler`: `CompileInputs.reviewFeedback` threads review feedback into recompilation as a new revision-history record naming the source review cycles.
- Added `docs/sprint-6-review-engine.md` with architecture, chain semantics, and the gate asymmetry at final approval.

## Sprint 6 Non-Implementation Decisions

Sprint 6 did not implement:

- A review UI (backend engine only; a dashboard is future work)
- Notifications, email, or reviewer identity/assignment management (no auth layer exists yet)
- Database-backed review persistence (in-memory registry, consistent with Sprints 3–5)
- Compiler interpretation of feedback content (directives like "shorten scene 3" are recorded, not acted on)

## Sprint 7 Entry Criteria

Sprint 7 (Prompt Translation Engine) can start now: an approved Creative Package exists behind the `PROMPT_READY` lifecycle state, approvals are recorded as canonical `Review` data, and rework loops pass structured feedback through recompilation with full revision history. The `PromptTranslationAdapter` interface stub in `@creative-factory/creative-ir` marks where provider coupling is finally allowed to happen.

## Sprint 7 Acceptance Criteria

- [x] Translate an approved Creative IR into provider-neutral prompt packages: one `PromptRequest` per asset request, assembled into a deterministic `PromptPackage`
- [x] Pluggable prompt targets for image, video, and voiceover/audio; new targets register without changing the engine
- [x] Image prompts derived from shot visual specs (composition, lighting, color grade, subject) with brand controls, negative prompts, and content-derived seeds; video prompts add camera motion, easing, duration, and frame rate; audio target splits voiceover (TTS) from music brief so no asset is dropped
- [x] Provider dispatch seam (`PromptProvider`) with an offline `DryRunProvider` default — no live AI calls, no secrets, no network in the core or CI
- [x] `prompt.generated` contract event emitted per request
- [x] `StandardPromptTranslationAdapter` implements the existing `prompt-translation` `CreativeIRAdapter` stub, plugging into the Sprint 5 registry / Creative Package flow
- [x] Unsupported asset types reported as `unhandled` rather than silently dropped
- [x] Deterministic under injected clock/id ports (byte-identical package + events, unit-tested)
- [x] Comprehensive tests (10) driven against a real compiled Creative IR; build, lint, and test green across the monorepo

## Sprint 7 Completed Work

- Added `@creative-factory/prompt-translation`: `StandardPromptTranslationEngine`, three pluggable prompt targets (image / video / voiceover-audio), the `PromptProvider` dispatch seam with an offline `DryRunProvider`, `prompt.generated` event emission, and `StandardPromptTranslationAdapter` implementing the canonical `prompt-translation` adapter interface.
- Deterministic support (FNV-1a hashing + injected clock/id ports) keeps prompt packages byte-reproducible.
- Added `docs/sprint-7-prompt-translation.md` covering the target framework and the provider seam.

## Sprint 7 Non-Implementation Decisions

Sprint 7 did not implement:

- Live AI provider calls (the seam is dry-run only; no API keys, network, or secrets introduced)
- Actual asset generation (Sprints 8–9) — this sprint produces prompts, not media
- A vendor-specific prompt dialect beyond the neutral target formats
- Persistence of prompt packages (returned in-memory / emitted as an adapter artifact)

## Sprint 8 Entry Criteria

Sprint 8 (Image Generation Engine) can start now: `PromptRequest`s of kind `image` are self-contained, brand-controlled, seeded, and tied to a shot and asset request. Sprint 8 implements a concrete `PromptProvider` behind the existing dispatch seam to generate assets and record their provenance back into the Creative IR's `AssetOutput` model.

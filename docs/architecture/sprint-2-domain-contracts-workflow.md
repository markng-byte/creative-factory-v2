# Sprint 2 - Domain Models, Contracts, Workflow Engine & Creative IR Foundation

## Repository Review

Sprint 1 delivered the monorepo scaffold: pnpm workspace, Turborepo, Next.js web app, FastAPI API, Docker files, CI, shared TypeScript package scaffolds, and placeholder documentation directories. The domain and contracts packages existed but contained only scaffold-level examples.

## Current Sprint Scope

Sprint 2 establishes:

1. **Shared model layer** that all services consume
2. **Workflow rules** that govern the campaign lifecycle
3. **Creative Intermediate Representation (Creative IR)** as the canonical model for creative artifacts
4. **Foundation for provider-neutral architecture** where all engines work through adapters

## Architectural Vision: Creative Intermediate Representation

### The Problem We're Solving

Without a canonical model, engines either:
- Couple directly to provider APIs (GitHub Copilot, Claude, Midjourney, etc.)
- Develop proprietary internal models (inefficient, incompatible)
- Pass unstructured prompts between systems (lossy, non-deterministic)

### The Solution: Creative IR

**Creative IR is the single source of truth** for all creative work:

- **Generated automatically** from Business Brief + Brand Package + Campaign Package + Review Feedback
- **Never user-edited** directly
- **Machine-readable** for deterministic compilation
- **Stable versioned contract** for cross-engine integration
- **Provider-neutral** — no provider-specific code in the model

### Information Architecture

```
Human Input (Business Brief)
         ↓
┌────────────────────────────────────────────┐
│ Creative Factory Engine Pipeline           │
├────────────────────────────────────────────┤
│ Brand Engine → Brand Config                │
│ Campaign Engine → Campaign Context         │
│ Brief Engine → Creative Brief              │
│ Review Engine ← Feedback                   │
└────────────────────────────────────────────┘
         ↓
  [Creative IR Compiler]
         ↓
Creative Intermediate Representation (Canonical Model)
         ↓
┌────────────────────────────────────────────┐
│ Pluggable Output Adapters                  │
├────────────────────────────────────────────┤
│ • Storyboard HTML Adapter                  │
│ • Scene Specification Adapter              │
│ • Prompt Translation Adapter               │
│ • Image Generation Adapter                 │
│ • Video Generation Adapter                 │
│ • QA Specification Adapter                 │
│ • Export Package Adapter                   │
│ • [Future Adapters]                        │
└────────────────────────────────────────────┘
         ↓
   Production Artifacts
```

### Key Principles

1. **Separation of Concerns**
   - Creative IR models the creative vision (platform-independent)
   - Adapters handle provider-specific transformations
   - Engines work through standardized interfaces

2. **Determinism & Auditability**
   - Same Creative IR → Same outputs (reproducible)
   - Full revision history
   - All changes tracked with actor and timestamp

3. **Machine Readability**
   - Fully parseable by machines
   - Lossless representation
   - Extendable without breaking consumers

4. **Composability**
   - Small reusable components
   - Clear dependency graph
   - No circular dependencies

## Implemented Packages

### `@creative-factory/domain`

The domain package now defines:

- Opaque typed IDs for organizations, brands, campaigns, briefs, strategies, storyboards, review cycles, prompt artifacts, generated assets, QA reports, approvals, and production packages.
- Value objects for content hashes, provider references, duration, aspect ratio, resolution, money, asset kind, review decision, and campaign lifecycle state.
- Entity and aggregate interfaces for the Enterprise AI Creative Factory lifecycle.
- Domain event envelope types for major lifecycle and governance events.

### `@creative-factory/contracts`

The contracts package now defines:

- API response and request DTOs for health, campaign summaries, briefs, storyboards, review decisions, and workflow transitions.
- Versioned event envelope contracts.
- Event names that establish the initial cross-service boundary vocabulary.

Repository-level JSON schemas were added under `contracts/events/` for:

- `campaign.lifecycle.transitioned`
- `review.completed`

### `@creative-factory/workflow-engine`

The workflow engine is a pure package with no infrastructure dependencies. It defines:

- Campaign lifecycle states.
- Allowed transitions.
- Human gate states.
- Transition metadata and descriptions.
- Deterministic transition evaluation that returns a typed `Result`.

## Lifecycle States

```text
DRAFT
BRIEF_READY
STRATEGY_DRAFT
STRATEGY_REVIEW
STORYBOARD_DRAFT
STORYBOARD_REVIEW
PROMPT_READY
ASSET_GENERATION_PENDING
ASSET_GENERATION_RUNNING
ASSET_REVIEW
FINAL_APPROVAL
EXPORTING
COMPLETED
CANCELLED
```

## Human Gates

```text
STRATEGY_REVIEW
STORYBOARD_REVIEW
ASSET_REVIEW
FINAL_APPROVAL
```

## Creative Intermediate Representation (Creative IR)

### Definition

Creative IR is the **canonical, machine-readable representation** of every creative artifact. It is:

- **Single Source of Truth** between all engines
- **Automatically Generated** from Business Brief, Brand Package, Campaign Package, and Review Feedback
- **Never User-Edited** directly (marketing users work through UI, not CR documents)
- **Versioned and Stable** for cross-engine integration
- **Provider-Neutral** (no AI provider coupling in the model)

### What Creative IR Models

A complete Creative IR document includes:

- **Campaign**: Objective, target audience, duration, supported formats
- **Creative Context**: Direction, mood, tone, narrative theme, key messages
- **Stories & Storyboards**: Narrative structure, scenes, shots
- **Shots**: Visual specifications, camera work, lighting, color grading, motion
- **Audio**: Voiceover, music, sound effects, mixing specifications
- **Brand Tokens**: Colors, typography, logo rules, imagery guidelines
- **Design Tokens**: Spacing, sizing, shadows, animations
- **Asset Requests**: Specifications for image, video, audio generation
- **Reviews & Approvals**: Complete audit trail
- **Export Metadata**: Records of compiled outputs

### Creative IR Compiler

The Creative IR Compiler (Sprint 5) transforms Creative IR into multiple production outputs:

- **Human-readable Storyboards** (HTML)
- **Scene Specifications** (PDF/JSON)
- **Shot Lists** (JSON)
- **Motion Specifications** (JSON)
- **Prompt Packages** (for Prompt Translation Engine)
- **Image Generation Requests** (for Image Generation Engine)
- **Video Generation Requests** (for Video Generation Engine)
- **QA Specifications** (for QA Engine)
- **Export Packages** (for Export Engine)

### Adapter Architecture

Each output format is produced by a **pluggable output adapter**:

```typescript
interface CreativeIRAdapter {
  transform(creativeIR: CreativeIR, options: AdapterOptions): Promise<AdapterOutput>;
  validate(creativeIR: CreativeIR): AdapterValidationResult;
}
```

Adapters:
- NEVER modify Creative IR
- Transform Creative IR into provider-specific or format-specific outputs
- Can be added/updated without changing the compiler
- Register with a central AdapterRegistry

### No Provider Coupling

🚫 **NEVER do this**:
```typescript
// Bad: Provider-specific prompts in Creative IR
{
  "openai_system_prompt": "...",
  "anthropic_system_prompt": "...",
  "midjourney_magic_words": "..."
}
```

✅ **DO this instead**:
```typescript
// Good: Provider-neutral specification
{
  "visualSpec": {
    "shotType": "close-up",
    "lighting": { "type": "three-point", ... },
    "colorGrading": { ... }
  }
}
// Then: Prompt Translation Adapter converts to provider prompts
```

### Versioning & Backward Compatibility

Creative IR uses semantic versioning:
- **MAJOR**: Breaking changes (rare, requires migration)
- **MINOR**: New optional fields
- **PATCH**: Bug fixes, clarifications

Migration tools are provided for MAJOR version upgrades.

### Serialization

Creative IR documents are serialized as:
- **Primary**: JSON-LD (RDF-compatible, linked data ready)
- **Alternative**: YAML (development), Protocol Buffers (future)

### Documentation

Complete Creative IR specification includes:
- [Creative IR Specification](../creative-ir-specification.md) — Full model definition
- [JSON Schema](../creative-ir-schema.json) — Machine-readable validation schema
- Versioning strategy
- Backward compatibility rules
- Validation rules
- Compiler interface
- Adapter interface
- Extension mechanism
- Example documents
- Migration strategy

## Explicit Non-Scope

Sprint 2 does not include:

- Brand plugin loading or brand rule evaluation.
- Campaign persistence or API endpoints.
- Creative brief, strategy, or storyboard generation logic.
- Prompt synthesis (handled by Prompt Translation adapters in Sprint 7).
- Image or video generation.
- QA scans.
- Asset library storage/versioning.
- Export publishing.
- Analytics.
- Implementation of Creative IR Compiler (Sprint 5).
- Implementation of output adapters (individual sprints).

These remain in their planned future sprints.

## Next Steps

**Sprint 3 (Brand Engine)**: Can now safely build against the Creative IR contract, knowing that:
- The model is stable and versioned
- All engines will consume/produce Creative IR consistently
- No engine needs to know about provider-specific details
- Adapters provide the provider integration layer

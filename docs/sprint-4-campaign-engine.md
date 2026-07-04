# Sprint 4: Campaign & Creative Brief Engine

## Overview

The Campaign & Creative Brief Engine turns a raw **Business Brief** (the input marketing
teams provide) into a structured **Creative Brief** — the artifact that downstream Sprint 5
will compile into Creative IR. It owns the strategic reasoning layer of the platform:
audience modeling, messaging strategy, and creative direction.

**Core Principle**: The Business Brief is untrusted, loosely structured input; the Creative
Brief is a validated, strongly typed contract. Every campaign flows import → model → generate
→ build → validate → store, and the domain `CreativeBrief` remains the single source of truth
that Creative IR is generated from.

## Architecture

The engine is composed of six independent packages that compose into one orchestrated workflow.

```
BusinessBriefInput (JSON/YAML)
        │
        ▼
┌───────────────────────────┐
│ business-brief-importer   │  parse + normalize + validate required fields
└───────────────────────────┘
        │ BusinessBriefInput
        ▼
┌───────────────────────────┐     ┌───────────────────────────┐
│ audience-model            │     │ messaging-engine          │
│  AudienceModel            │────▶│  MessagingModel           │
└───────────────────────────┘     └───────────────────────────┘
        │                                 │
        └──────────────┬──────────────────┘
                       ▼
        ┌───────────────────────────┐
        │ creative-brief            │  map engine outputs → domain CreativeBrief
        └───────────────────────────┘
                       │ CreativeBrief
                       ▼
        ┌───────────────────────────┐
        │ campaign-engine           │  validate + assemble CampaignPackage
        └───────────────────────────┘
                       │ CampaignPackage
                       ▼
        ┌───────────────────────────┐
        │ campaign-registry         │  store / version / rollback
        └───────────────────────────┘
```

### 1. `@creative-factory/business-brief-importer`

Pluggable importers that accept a raw brief and normalize it into a `BusinessBriefInput`.

- **JSONBusinessBriefImporter** — parses JSON objects or strings.
- **YAMLBusinessBriefImporter** — parses YAML via `js-yaml`.
- **StandardBusinessBriefImporterRegistry** — registers importers by `format` string and
  rejects duplicate registrations, so new formats (Markdown, CSV, etc.) can be added without
  touching the core.

Each importer fills sensible defaults, checks required fields
(`id`, `campaignGoal`, `industry`, `valueProposition`, `targetAudience`) and returns a
structured `BusinessBriefImportResult` with errors, warnings, and import metadata.

```typescript
const registry = new StandardBusinessBriefImporterRegistry();
registry.register(new JSONBusinessBriefImporter());
registry.register(new YAMLBusinessBriefImporter());

const result = await registry.get('json')!.import('campaign-1', briefJson);
```

### 2. `@creative-factory/audience-model`

`StandardAudienceModelGenerator` transforms the brief's audience inputs into a processed
`AudienceModel`: primary/secondary segments, processed personas with ranked pain points and
goals, a psychographic map, a journey map, a media-consumption map, and a sentiment profile.

The `AudienceModel` type system is **package-local** (`audience-model/src/types.ts`). It is an
intermediate engine representation, deliberately distinct from the domain's Creative Brief
`TargetAudience` contract — the creative-brief builder maps between them.

### 3. `@creative-factory/messaging-engine`

`StandardMessagingFrameworkGenerator` produces a `MessagingModel`: a core message, supporting
messages, tone & voice, messaging pillars, per-channel variations, and calls to action, derived
from the brief (and optionally the audience model). Tone adapts by industry; channel variations
adapt copy per channel (character limits, formatting).

Like the audience model, `MessagingModel` is a package-local intermediate type that the
creative-brief builder maps onto the canonical domain `MessagingFramework`.

### 4. `@creative-factory/creative-brief`

`StandardCreativeBriefBuilder` is the composition point. It runs the audience and messaging
generators, then assembles a fully typed domain `CreativeBrief`: campaign context, business and
communication objectives, target audience, key messages and messaging framework, tone/emotional/
visual direction, desired action, success metrics, deliverables, creative constraints, channel
strategy, brand references, and a priority matrix.

This is where the intermediate engine models are translated into the domain contract, keeping
the domain package the single source of truth for what a Creative Brief _is_.

### 5. `@creative-factory/campaign-registry`

Storage for assembled campaigns.

- **MemoryCampaignRegistry** — store, get, list, delete, exists, and predicate search.
- **VersionedCampaignRegistry** — extends the above with version history, `getVersion`,
  `listVersions`, and `rollback`.

### 6. `@creative-factory/campaign-engine`

`StandardCampaignEngineOrchestrator` wires everything together and exposes the public workflow:

```typescript
const orchestrator = new StandardCampaignEngineOrchestrator();
const pkg = await orchestrator.createCampaign('campaign-1', briefInput, 'json', brandProfile);
// import → build creative brief → validate → assemble CampaignPackage → store
```

It also exposes `getCampaign`, `listCampaigns`, and `deleteCampaign`, and performs package-level
validation (required fields, target audience, success metrics) before storing.

## Data Model Additions

`@creative-factory/domain` was extended with `campaign-types.ts`, defining the full campaign
vocabulary: `BusinessBriefInput`, `CampaignType`, `CommunicationChannel`, audience/persona types,
market and product context, constraints, the output `CreativeBrief` and its sub-structures, and
the processed `CampaignPackage` with its validation result. An `ISO8601Timestamp` value type was
added to `value-objects.ts` for Creative IR timestamps.

## Design Decisions

- **Intermediate models are package-local.** Audience and messaging models are engine
  implementation details, not cross-service contracts. Only the `CreativeBrief` they produce is
  a domain contract. This keeps the domain lean and lets the engines evolve independently.
- **Deterministic placeholders, not AI.** Generation uses transparent heuristics so the pipeline
  is testable and reproducible. Swapping in LLM-backed generators later requires no interface
  changes.
- **Pluggable at the edges.** Importers are registry-driven; new brief formats need no core edits.

## Not in Scope (deferred)

- Database-backed persistence (registries are in-memory).
- Markdown / additional importer formats.
- LLM-driven audience, messaging, and creative-direction generation.
- Full brand-profile → brief synthesis (only brand ID and primary color are referenced today).
- Creative IR generation from the Creative Brief — that is the Sprint 5 compiler's job.

## Verification

The entire monorepo is green: `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` all
pass. Each Sprint 4 package ships with unit tests covering its generator/registry/orchestrator
behavior.

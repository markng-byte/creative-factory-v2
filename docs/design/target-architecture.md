# Target Architecture — Interface, Wiring, Persistence & Ingestion

**Status:** Design (pre-implementation). No code changes accompany this document.
**Purpose:** the shared blueprint for the next phase of the Creative Factory — the horizontal layers
(web console, API gateway, persistence/event-store, reference ingestion) that turn the completed
engine spine into a running product. It resolves the cross-cutting decisions **once**, up front, so
the implementation sprints don't rework each other.

> **Why design-first now, when the engine sprints weren't?** Sprints 0–14 were _vertical_ — one
> engine at a time, each self-contained behind a port, no engine depending on another's internals. A
> shared blueprint would have added nothing. The remaining work is _horizontal_: the UI needs the API,
> the API needs the orchestrator, the orchestrator needs durable state, and ingestion touches all of
> them. That mutual dependency is exactly what a design artifact de-risks.

---

## 1. Where we are today

| Area                 | State                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Engines (0–14)**   | Complete. 13 engines + `@creative-factory/pipeline` orchestrator; deterministic, provider-neutral, each behind a port.                                                                                                                                                                                                                                                  |
| **Web** (`apps/web`) | Starter scaffold. Home page: _"Monorepo scaffold. No business features yet."_ No brief form, upload, or run viewer.                                                                                                                                                                                                                                                     |
| **API** (`apps/api`) | FastAPI, `/health` only. None of the engines are exposed over HTTP.                                                                                                                                                                                                                                                                                                     |
| **API contract**     | **Partly designed, unwired.** `packages/contracts/src/api.ts` has `CampaignSummaryDto`, `BusinessBriefDto`, `StoryboardDto` (+ `Scene/Frame/AssetSlot`), `ReviewDecisionRequest`, `WorkflowTransitionRequest/Response`, `HealthResponse`, `ApiErrorResponse` — connected to nothing.                                                                                    |
| **Persistence**      | All state is behind **in-memory ports**. Postgres 16 + Redis 7 are provisioned in `docker-compose*.yml` but **no code connects to them**. No ORM/schema/migrations.                                                                                                                                                                                                     |
| **Events**           | A full contract stream exists (`packages/contracts/src/events.ts`) — `prompt.generated`, `asset.generated`, `qa.completed`, `asset.cataloged`, `export.published`, `campaign.lifecycle.transitioned`, `review.completed` — but is only collected in memory. An event-sourcing backbone with no store.                                                                   |
| **References**       | `ExistingAsset` / `CreativeReference` / `BrandReference` (`packages/domain/src/campaign-types.ts`) exist as **metadata pointers** (URL + description). They flow into the IR via `creative-ir-compiler/src/stages/context.ts`, but nothing uploads, stores, or _analyzes_ real bytes. `asset-library` is already content-addressed — the natural sink for real uploads. |

**The ports we will back with real infrastructure** (all currently `InMemory*`):

- `CreativeBriefSource` / `CampaignSource` / `BrandTokensSource` — `creative-ir-compiler/src/sources/in-memory.ts` (simple async `getById`).
- `AssetLibrary` — `asset-library/src/library.ts` (content-addressed catalog).
- `AssetStore` — `image-generation/src/store.ts`, `video-generation/src/store.ts` (asset bytes).
- `ReviewRegistry` — `review-engine/src/registry.ts` (`save`, `getById`, `listByCampaign`, `listOpen`).

Because these are already interfaces, the entire persistence layer is **"add an adapter behind an
existing port"** — no engine changes.

---

## 2. Target architecture

```
┌──────────────┐   HTTP    ┌──────────────┐   in-process    ┌─────────────────────────┐
│  Web console │──────────▶│ API gateway  │───────────────▶│  Orchestrator            │
│ (apps/web,   │◀──────────│ (TS runtime) │◀───────────────│  createPipeline().run()  │
│  Next.js)    │  events   │              │                │  ─ 13 engines ─          │
└──────────────┘           └──────┬───────┘                └───────────┬─────────────┘
                                  │                                     │ reads/writes via ports
                                  │ upload                              ▼
                                  ▼                        ┌─────────────────────────────┐
                        ┌──────────────────┐   content     │  Persistence                │
                        │ Ingestion        │──hash────────▶│  • Postgres: event store,   │
                        │  • asset-library │               │    IR snapshots, indices    │
                        │  • analysis seam │──descriptors─▶│  • Blob store: real bytes   │
                        └──────────────────┘   into IR     │  • Redis: queue/gates/cache │
                                                           └─────────────────────────────┘
```

One sentence: **a Next.js console talks to a TypeScript API that runs the existing orchestrator
in-process; every engine reads and writes durable state through the ports it already has; uploaded
materials are ingested through the content-addressed library and an analysis seam that feeds the
compiler.**

---

## 3. The four horizontal layers

Each layer is specified the same way the engines were: **swap a port or add a seam — never change an
engine's internals.**

### 3.1 Persistence & event store

Postgres is the system of record:

- **Event store** — an append-only table of the existing `CreativeFactoryEventContract` stream, keyed
  by campaign + sequence. This is the audit trail, and the substrate for replay and live run-streaming
  to the console. (Events are _already emitted_; this only persists them.)
- **IR snapshots** — one immutable row per IR version (JSONB), keyed by content hash. Preserves the
  "engines return new IR snapshots" invariant and gives time-travel/diff across a campaign's history.
- **Indices** — asset-library catalog (content-hash → metadata/versions), review cycles, campaign/
  brief lookups. These back the `*Source`, `AssetLibrary`, and `ReviewRegistry` ports.

**Blob store** (Decision D2) holds the actual image/video/upload bytes, content-addressed, behind the
`AssetStore` interface: local filesystem in dev, S3-compatible in prod.

**Redis** is ephemeral only: the run queue (so a run survives across a multi-day human gate), gate-wait
signalling, locks, and caching. Never a source of truth.

### 3.2 API gateway

A thin TypeScript HTTP layer over the orchestrator and the read models. It **reuses and extends the
DTOs already in `packages/contracts/src/api.ts`** rather than inventing new ones. Endpoint families:

| Family       | Purpose                                                        | Anchored to                               |
| ------------ | -------------------------------------------------------------- | ----------------------------------------- |
| Briefs       | import/create a brief, list, fetch                             | `BusinessBriefDto`                        |
| Materials    | upload a reference/material, list                              | new `MaterialDto` (see §3.4)              |
| Runs         | start a pipeline run, get status, **stream events (SSE)**      | events stream + `PipelineSummary`         |
| Deliverables | fetch finished campaign page, analytics dashboard, compiled IR | `PipelineResult` fields                   |
| Review gates | list open cycles, submit a decision                            | `ReviewDecisionRequest`, `ReviewRegistry` |
| Workflow     | request a lifecycle transition                                 | `WorkflowTransitionRequest/Response`      |

### 3.3 Web console (`apps/web`, Next.js)

Replaces the scaffold page with the operator surface:

1. **Submit / import a brief** (form or JSON/YAML import via `business-brief-importer`).
2. **Upload references & materials** — drag-drop into the ingestion path.
3. **Watch a run live** — subscribe to the event stream; render the campaign moving through its
   lifecycle states (`DRAFT → BRIEF_READY → STRATEGY_* → STORYBOARD_* → PROMPT_READY →
ASSET_GENERATION_* → ASSET_REVIEW → FINAL_APPROVAL → EXPORTING → COMPLETED`).
4. **Human gates** — approve / request-changes / reject at the review states, driving the same
   review-engine + workflow-engine already built.
5. **View deliverables** — the finished campaign page and analytics dashboard the pipeline already
   produces as self-contained HTML.

### 3.4 Ingestion & analysis seam

The step that turns a reference from _"a link with a description"_ into _"something the compiler
understands."_

```
upload ──▶ asset-library (content hash, dedup) ──▶ reference-analysis seam ──▶ descriptors
                                                     (palette / tags / style)      │
                                                                                   ▼
                                                              creative-ir-compiler/stages/context.ts
                                                              (references now carry extracted signal)
```

The **analysis seam** follows the established provider-neutral pattern: the default implementation is
**deterministic and offline** (e.g. palette extraction, structural tags), and a real vision model can
be swapped in behind the same interface later — without breaking byte-reproducibility. A new
`MaterialDto` (id, content hash, kind, filename, extracted descriptors) represents an ingested file, as
distinct from today's URL-only `CreativeReference`.

---

## 4. Invariants this design must preserve

- **Determinism** — content-hash IDs and injected `Clock`/`IdGenerator` stay. Persistence adapters and
  the analysis seam must keep the end-to-end run byte-reproducible (the existing determinism test must
  still pass).
- **Provider-neutrality** — new coupling (DB drivers, blob backend, vision model) lives only behind
  ports/seams with offline defaults.
- **Immutability & audit** — IR snapshots and events are append-only; nothing mutates history.
- **Ports over rewrites** — every layer attaches to an interface that already exists (or a new seam of
  the same shape). No engine's internals change.

---

## 5. Key decisions

### D1 — Runtime boundary (the big one) · _needs explicit sign-off_

The orchestrator and all engines are **TypeScript (Node)**; today's API app is **Python (FastAPI)**.
The gateway has to run `createPipeline().run()`, so where that call lives matters.

| Option                                                 | Trade-off                                                                                    |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **A. TS API service** calls orchestrator in-process    | No cross-language hop; one language for gateway+engines; retire/repurpose FastAPI.           |
| B. FastAPI gateway → Node worker (HTTP/subprocess)     | Keeps Python front door, but adds a serialization boundary on the hot path and two runtimes. |
| C. Next.js route handlers invoke orchestrator directly | Simplest for a single console app; blurs app/gateway separation as surface grows.            |

**Recommendation: A** (with C acceptable for an early single-app slice) — keep the orchestrator
**in-process in a TS runtime** so no serialization boundary sits between the API and the engines, and
position FastAPI as auxiliary (or retire it). This affects `apps/api`, so it is called out for your
explicit decision before S16.

### D2 — Blob storage

Content-addressed `AssetStore` implementation: **local filesystem in dev, S3-compatible in prod**,
behind one interface. Bytes are addressed by hash so dedup and determinism carry over from
`asset-library`.

### D3 — Event store shape

**Recommendation:** a single append-only event table (campaign + monotonic sequence) as the log, plus
**IR snapshot-per-version** as materialized state (rather than always rebuilding IR from events).
Snapshots keep reads cheap and match the existing "new IR snapshot per stage" model; the event log
gives audit and replay.

---

## 6. Proposed sprint sequence

Ordered by dependency — each sprint stands on the one before it.

| Sprint  | Scope                                                                                                                                                                                 | Depends on |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **S15** | **Persistence & Event Store** — Postgres adapters for the `*Source`/`AssetLibrary`/`ReviewRegistry` ports; append-only event store; IR-snapshot store; Redis wiring. Blob store (D2). | engines    |
| **S16** | **API Gateway & Wiring** — resolve D1; expose brief/run/deliverable/review/workflow endpoints over the orchestrator + read models; SSE event stream.                                  | S15        |
| **S17** | **Ingestion & Analysis Seam** — upload → asset-library → deterministic analysis seam → descriptors into `context.ts`; `MaterialDto`.                                                  | S15, S16   |
| **S18** | **Web Console** — brief submit/import, material upload, live run view, human gates, deliverable viewer.                                                                               | S16, S17   |

Persistence is first because everything above it needs durable, resumable state; the console is last
because it consumes all three layers below it.

---

## 7. Out of scope for this document

No Postgres implementations, API routes, UI, or ingestion code are written here. This is the blueprint
the S15–S18 sprints execute against. See `docs/pipeline-overview.md` for the completed engine spine and
`docs/roadmap.md` for per-sprint history.

# Creative Factory — End-to-End Pipeline Overview

This is the top-level map of the whole system: how a Business/Creative Brief becomes a finished,
published, analyzed campaign, and how the thirteen engines compose around one canonical model.

---

## The spine: Creative IR

Every engine reads and/or writes the **Creative Intermediate Representation (Creative IR)** — the
single, canonical, versioned, machine-readable model of a creative work. The architectural rule the
whole project is built on:

```
Business Brief → Creative IR → Production Outputs   (never Business Brief → Prompts)
```

No engine couples to an AI provider. Provider coupling is confined to two explicit **dispatch
seams** (prompt translation and publishing), and even those default to offline, deterministic
implementations.

---

## The pipeline

```
Brief + Campaign + Brand
        │
        ▼  compile (Sprint 5)
   Creative IR ──► Creative Package (adapters: storyboard, scene/shot spec, timeline, QA spec …)
        │
        ▼  translate (Sprint 7)
   Prompt Package (image / video / voiceover)  ── prompt.generated
        │
        ▼  generate (Sprints 8–9)
   AssetOutputs written back into the IR  ── asset.generated
   (deterministic branded images + animated clips)
        │
        ▼  QA (Sprint 10)
   qaStatus written back; verdict PASS/FAIL  ── qa.completed  → recommends ASSET_REVIEW
        │
        ▼  catalog (Sprint 11)
   Content-addressed library versions; refs on the IR  ── asset.cataloged
        │
        ▼  export (Sprint 12)
   Production package + finished campaign page; publish seam  ── export.published
   → start_export → complete_export → COMPLETED
        │
        ▼  analyze (Sprint 13)
   Analytics report + optimization recommendations + dashboard
```

Human **review & approval** (Sprint 6) gates the lifecycle at four points
(strategy / storyboard / assets / final), and its "request changes" outcome feeds structured
feedback back into a recompile.

---

## Engines (packages)

| Sprint | Package                                                                       | Role                                                             |
| ------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 2      | `domain`, `contracts`, `workflow-engine`, `creative-ir`                       | Canonical model, contracts, lifecycle state machine              |
| 3      | `brand-*`                                                                     | Brand intelligence (import, validate, tokenize, register)        |
| 4      | `campaign-engine` + `audience-model`, `messaging-engine`, `creative-brief`, … | Business brief → Creative Brief                                  |
| 5      | `creative-ir-compiler`, `creative-ir-adapters`                                | Brief → Creative IR → Creative Package                           |
| 6      | `review-engine`                                                               | Human gates, approval chains, feedback → recompile               |
| 7      | `prompt-translation`                                                          | Creative IR → provider-neutral prompt packages (+ dispatch seam) |
| 8      | `image-generation`                                                            | Deterministic image provider → AssetOutputs                      |
| 9      | `video-generation`                                                            | Deterministic animated-video provider → AssetOutputs             |
| 10     | `qa-engine`                                                                   | Brand-compliance QA over real asset content                      |
| 11     | `asset-library`                                                               | Content-addressed catalog, versioning, dedup, reuse              |
| 12     | `export-engine`                                                               | Production package, finished campaign, publish seam → COMPLETED  |
| 13     | `analytics-engine`                                                            | Lifecycle analytics, optimization, dashboard                     |
| 14     | `pipeline`                                                                    | Top-level orchestrator composing all of the above                |

---

## One entry point

`@creative-factory/pipeline` wires every engine together:

```ts
import { createPipeline } from '@creative-factory/pipeline';

const pipeline = createPipeline({ briefs, campaigns, brands, clock, seed });
const result = await pipeline.run({ creativeBriefId, brandId, campaignId, validationMode });

result.finishedCampaignPage; // the finished, viewable campaign
result.dashboard; // the analytics dashboard
result.summary; // scenes, shots, assetsGenerated, completed, eventCount
result.events; // the full contract event stream
```

One call runs compile → translate → generate → QA → catalog → export → analyze, deterministically.

---

## Cross-cutting principles

- **Provider-neutral.** No engine embeds provider-specific logic; coupling lives only in dispatch
  seams, which default to offline implementations.
- **Deterministic.** Time and identity are injected everywhere; ids and seeds are content-derived.
  Identical inputs produce byte-identical outputs — asserted across every engine and end-to-end.
- **Immutable & auditable.** Engines return new Creative IR snapshots; provenance, reviews, QA
  verdicts, library versions, and exports are all recorded on the canonical document.
- **Pluggable.** Adapters, prompt targets, QA rules, providers, and publish targets all register
  behind stable interfaces — new capability is added without changing the core.

---

## Worked example (Northwind Analytics)

Committed under `docs/examples/`, all regenerated deterministically:

- `creative-ir-northwind.json` — the compiled Creative IR
- `creative-package-northwind.json` — the adapter outputs
- `storyboard-northwind.html` — the storyboard
- `generated-images-northwind.html` — 13 generated key-frames
- `generated-videos-northwind.html` — 13 generated animated clips
- `final-delivery-northwind.html` — the finished campaign
- `analytics-dashboard-northwind.html` — the analytics dashboard

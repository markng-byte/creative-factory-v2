# Creative Factory

**A provider-neutral, deterministic platform for autonomous creative production.** A Business/Creative
Brief goes in; a finished, published, analyzed campaign comes out — with every review, QA verdict,
provenance record, asset version, and export written to one canonical model.

> **Status: complete (Sprints 0–14).** The pipeline runs end to end. All CI checks — JavaScript/TypeScript,
> Prettier, and Python — pass green.

---

## What it does

Every creative artifact is represented as **Creative Intermediate Representation (Creative IR)** — a
single, versioned, machine-readable model that every engine consumes and produces. The founding rule:

```
Business Brief → Creative IR → Production Outputs        (never Business Brief → Prompts)
```

The full pipeline, composed of thirteen engines around that spine:

```
Brief + Campaign + Brand
   │  compile        → Creative IR  ─► Creative Package (storyboard, scene/shot spec, timeline, QA spec…)
   │  translate      → prompt packages (image / video / voiceover)     ── prompt.generated
   │  generate       → images + animated clips written back into the IR ── asset.generated
   │  QA             → brand-compliance verdicts, qaStatus written back  ── qa.completed
   │  catalog        → content-addressed library versions (dedup/reuse) ── asset.cataloged
   │  export         → production package + finished campaign page       ── export.published → COMPLETED
   │  analyze        → analytics report + optimization recommendations + dashboard
   ▼
Finished, analyzed campaign
```

Human **review & approval** gates the lifecycle at four points (strategy / storyboard / assets / final);
a "request changes" outcome feeds structured feedback back into a recompile.

**No engine couples to an AI provider.** Provider coupling is confined to two explicit dispatch seams
(prompt translation, publishing), which default to offline, deterministic implementations — so the
entire system is byte-for-byte reproducible and fully testable. Swap a real diffusion/TTS/publishing
API in behind a seam and nothing else changes.

📖 **[Pipeline Overview](docs/pipeline-overview.md)** — the full end-to-end map.

---

## Run the whole pipeline in one call

```ts
import { ValidationMode } from '@creative-factory/creative-ir';
import { createPipeline } from '@creative-factory/pipeline';
import {
  InMemoryCreativeBriefSource,
  InMemoryCampaignSource,
  InMemoryBrandTokensSource,
  exampleCreativeBrief,
  exampleCampaign,
  exampleBrandBundle,
} from '@creative-factory/creative-ir-compiler';

const brand = exampleBrandBundle();
const pipeline = createPipeline({
  briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
  campaigns: new InMemoryCampaignSource([exampleCampaign()]),
  brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
  seed: 'northwind',
});

const result = await pipeline.run({
  creativeBriefId: 'brief-northwind-001',
  brandId: 'brand-northwind',
  campaignId: 'campaign-northwind-q3',
  validationMode: ValidationMode.STRICT,
});

result.summary; // { scenes: 6, shots: 13, assetsGenerated: 26, assetsApproved: 26, completed: true, ... }
result.finishedCampaignPage; // self-contained HTML of the finished campaign
result.dashboard; // self-contained analytics dashboard
result.events; // the full contract event stream
```

`node scripts/demo.mjs` runs exactly this and writes the finished campaign + dashboard to `.demo-output/`.

---

## See it

Committed, deterministically-regenerated example artifacts (open the HTML in a browser):

| Artifact                       | File                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Finished campaign              | [`docs/examples/final-delivery-northwind.html`](docs/examples/final-delivery-northwind.html)                                                                  |
| Analytics dashboard            | [`docs/examples/analytics-dashboard-northwind.html`](docs/examples/analytics-dashboard-northwind.html)                                                        |
| Generated images (13)          | [`docs/examples/generated-images-northwind.html`](docs/examples/generated-images-northwind.html)                                                              |
| Generated animated clips (13)  | [`docs/examples/generated-videos-northwind.html`](docs/examples/generated-videos-northwind.html)                                                              |
| Storyboard                     | [`docs/examples/storyboard-northwind.html`](docs/examples/storyboard-northwind.html)                                                                          |
| Compiled Creative IR / Package | [`creative-ir-northwind.json`](docs/examples/creative-ir-northwind.json) · [`creative-package-northwind.json`](docs/examples/creative-package-northwind.json) |

---

## Engines

| Sprint | Package                                        | Role                                                             |
| ------ | ---------------------------------------------- | ---------------------------------------------------------------- |
| 5      | `creative-ir-compiler`, `creative-ir-adapters` | Brief → Creative IR → Creative Package                           |
| 6      | `review-engine`                                | Human gates, approval chains, feedback → recompile               |
| 7      | `prompt-translation`                           | Creative IR → provider-neutral prompt packages (+ dispatch seam) |
| 8      | `image-generation`                             | Deterministic image provider → asset outputs                     |
| 9      | `video-generation`                             | Deterministic animated-video provider → asset outputs            |
| 10     | `qa-engine`                                    | Brand-compliance QA over real asset content                      |
| 11     | `asset-library`                                | Content-addressed catalog, versioning, dedup, reuse              |
| 12     | `export-engine`                                | Production package, finished campaign, publish seam → COMPLETED  |
| 13     | `analytics-engine`                             | Lifecycle analytics, optimization, dashboard                     |
| 14     | `pipeline`                                     | Top-level orchestrator composing all of the above                |

Foundations (Sprints 2–4): `domain`, `contracts`, `workflow-engine`, `creative-ir`, the `brand-*`
packages (brand intelligence), and `campaign-engine` + friends (Business Brief → Creative Brief).
Per-sprint design docs live in [`docs/`](docs/) (e.g. `docs/sprint-5-creative-ir-compiler.md`).

---

## Stack

| Layer           | Technology                    |
| --------------- | ----------------------------- |
| Package manager | pnpm workspaces               |
| Task runner     | Turborepo                     |
| Web app         | Next.js 15 (App Router)       |
| API             | FastAPI (Python 3.12)         |
| Linting         | ESLint 9 (flat config) · ruff |
| Formatting      | Prettier                      |
| Testing         | Vitest (JS) · pytest (Python) |
| Containers      | Docker + Compose              |
| CI              | GitHub Actions                |

Workspace imports use the `@creative-factory/*` scope.

---

## Getting started

```bash
# 1. Install
pnpm install

# 2. Verify everything (build, lint, test, format across the monorepo)
pnpm build && pnpm lint && pnpm test && pnpm format:check

# 3. Run the end-to-end demo
node scripts/demo.mjs        # writes .demo-output/final-delivery.html + analytics-dashboard.html

# 4. Run one engine's tests
pnpm --filter @creative-factory/pipeline test
```

Dev servers (optional):

```bash
pnpm dev                                    # all apps via Turborepo
# Web → http://localhost:3000 · API → http://localhost:8000/docs
cd apps/api && pip install -e ".[dev]" && uvicorn creative_factory_api.main:app --reload
```

Prerequisites: Node.js 20+, pnpm 9+, Python 3.12+ (for the API), Docker (optional).

---

## Design principles

- **Provider-neutral** — no engine embeds provider logic; coupling lives only in swappable dispatch seams.
- **Deterministic** — time and identity are injected everywhere; ids and seeds are content-derived. Identical inputs produce byte-identical outputs, asserted per engine and end to end.
- **Immutable & auditable** — engines return new Creative IR snapshots; provenance, reviews, QA verdicts, library versions, and exports are all recorded on the canonical document.
- **Pluggable** — adapters, prompt targets, QA rules, providers, and publish targets register behind stable interfaces; new capability is added without changing the core.

---

## Docker

```bash
docker compose up --build                              # app services
docker compose -f docker-compose.dev.yml up --build    # + postgres + redis
```

## CI

GitHub Actions on push/PR to `main` and `develop` — **all green**:

- **JavaScript / TypeScript** — install, lint, typecheck, test, build
- **Python / FastAPI** — ruff, mypy, pytest (80% coverage gate)
- **Prettier** — format check
- **Docker** — build API and web images (push only)

## License

UNLICENSED — private project.

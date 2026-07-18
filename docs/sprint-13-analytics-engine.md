# Sprint 13 — Analytics & Optimization Engine

**Status:** Complete
**Scope:** Observe a campaign end-to-end from the Creative IR and the event stream; compute an
analytics report, derive optimization recommendations, and render a viewable dashboard.

---

## 1. What Sprint 13 builds

Sprints 1–12 produce and publish a campaign, emitting an event stream along the way. Sprint 13 turns
that history into insight. It reads the Creative IR (structure, asset QA status, library refs,
exports) and the pipeline's event stream, computes an **`AnalyticsReport`**, derives deterministic
**optimization recommendations**, and renders a self-contained **HTML dashboard**.

It is **read-only** — analytics never mutates the Creative IR.

```
   Creative IR (final)  +  event stream
   (prompt.generated, asset.generated, qa.completed,
    asset.cataloged, export.published, lifecycle.transitioned)
            │
            ▼
   ┌──────────────────────────────────────────────┐
   │           StandardAnalyticsEngine              │
   │  computeReport → structure / assets / quality  │
   │                  reuse / activity / lifecycle  │
   │  deriveRecommendations (heuristic, thresholds) │
   │  assembleDashboard (KPI tiles, funnel, recs)   │
   └───────────────┬────────────────────────────────┘
                   ▼
   AnalyticsReport · recommendations · viewable dashboard
```

---

## 2. Package

`@creative-factory/analytics-engine` (new):

| Module               | Responsibility                                                             |
| -------------------- | -------------------------------------------------------------------------- |
| `metrics.ts`         | `computeReport` — fold the IR + event stream into an `AnalyticsReport`     |
| `recommendations.ts` | `deriveRecommendations` — deterministic heuristic optimization suggestions |
| `dashboard.ts`       | `assembleDashboard` — self-contained, theme-aware HTML dashboard           |
| `engine.ts`          | `StandardAnalyticsEngine.analyze` — report + recommendations + dashboard   |
| `support.ts`         | Injected clock/id ports, ratios, HTML helpers                              |

---

## 3. Metrics

The report folds:

- **Structure** — stories, storyboards, scenes, shots, asset requests.
- **Assets** — total, by type, generated, approved, rejected, pending, generation rate.
- **Quality** — assessed / passed / failed and the QA pass rate.
- **Reuse** — catalogued, deduped, and the dedup rate (from `asset.cataloged` events).
- **Activity** — prompts, generations, catalogings, exports, reviews, QA runs (event counts).
- **Lifecycle** — the ordered transition list, the states reached, and whether the campaign reached
  `COMPLETED`.

For the Northwind example: 33 planned assets, 26 generated & approved (7 audio pending), QA pass
rate 100%, 26 catalogued (0% dedup on first run), and a lifecycle that reaches **COMPLETED**.

---

## 4. Optimization recommendations

Deterministic heuristics with explicit thresholds turn the metrics into guidance for the next run,
each with a severity:

- QA rejection rate above threshold → **warning**: tighten prompt brand controls / composition.
- Ungenerated asset requests → **info**: complete generation (e.g. audio) for full coverage.
- High dedup rate → **info**: reuse library versions instead of regenerating to cut cost.
- No human reviews recorded → **info**: ensure the governance gates ran.
- Reached `COMPLETED` → **success**; otherwise → **warning** with the states reached.

---

## 5. The dashboard

`assembleDashboard` renders a self-contained, theme-aware HTML page: KPI tiles (assets generated,
QA pass rate, approved, dedup rate, prompts, completed), the lifecycle funnel, an assets-by-type
breakdown, and the recommendation list. No external assets, deterministic. The committed example is
`docs/examples/analytics-dashboard-northwind.html`.

---

## 6. Determinism

Analytics is a pure computation over the inputs with injected clock/id ports: identical Creative IR
and event stream yield a byte-identical report and dashboard — unit-tested by `JSON.stringify` /
string equality. The committed dashboard regenerates byte-for-byte.

---

## 7. Testing

`engine.test.ts` (7 tests), driven by running the **entire pipeline** (compile → prompt → generate
→ QA → catalog → export) and collecting its event stream:

- Structure and asset metrics from the Creative IR
- Quality, reuse, and activity metrics from the event stream
- Lifecycle funnel reaching `COMPLETED`
- Optimization recommendations (incl. the completion success and the pending-audio info)
- A self-contained, viewable dashboard (no scripts)
- **Read-only** — the Creative IR is not mutated
- **Determinism** across runs

Build, lint, and test are green across the monorepo.

---

## 8. Non-implementation decisions

Sprint 13 did not implement:

- Cross-campaign / time-series analytics or persistence of reports (single-campaign, in-memory)
- Real charting libraries (the dashboard uses simple, deterministic, dependency-free markup)
- ML-driven optimization (recommendations are transparent, threshold-based heuristics; a model-backed
  recommender could be added behind the same shape)
- Writing analytics back into the Creative IR (analytics is intentionally read-only)

---

## 9. Entry criteria for Sprint 14

Sprint 14 (Enterprise Hardening & Documentation) is the finish line: with all 13 engines complete
and green, it consolidates cross-cutting concerns (a top-level pipeline overview, end-to-end
documentation, and any remaining hardening) rather than adding new pipeline capability.

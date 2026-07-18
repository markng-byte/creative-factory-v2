# Sprint 14 — Enterprise Hardening & Documentation

**Status:** Complete
**Scope:** The finish line. Compose all engines into one orchestrator, get CI fully green, and
document the system end to end. No new pipeline capability.

---

## 1. What Sprint 14 builds

With all thirteen engines complete, Sprint 14 consolidates:

1. a **top-level orchestrator** that runs the entire system in one deterministic call,
2. **fully green CI** — clearing the last (pre-existing) failing check,
3. **end-to-end documentation** — a single overview tying every engine together.

---

## 2. The pipeline orchestrator

`@creative-factory/pipeline` (new) composes every engine:

```ts
import { createPipeline } from '@creative-factory/pipeline';

const pipeline = createPipeline({ briefs, campaigns, brands, clock, seed });
const result = await pipeline.run({ creativeBriefId, brandId, campaignId, validationMode });
```

`run` executes, in order: **compile → translate → generate (image + video) → QA → catalog → export →
analyze**, threading the Creative IR through each stage and collecting the whole event stream. It
returns the finished Creative IR, the prompt/export packages, the QA and analytics reports, the
optimization recommendations, the finished campaign page, the dashboard, and the full event stream —
plus a compact summary.

`createPipeline` wires all engines from the compiler's source ports: one shared clock drives every
stage, and each engine gets its own seeded id generator so ids never collide. The orchestrator only
moves data between engines — each engine keeps its own determinism — so the end-to-end run is
byte-reproducible (asserted by an end-to-end determinism test).

| Module        | Responsibility                                                       |
| ------------- | -------------------------------------------------------------------- |
| `pipeline.ts` | `StandardPipeline.run` + `createPipeline` factory                    |
| `support.ts`  | Clock / IdGenerator ports (structurally compatible with all engines) |

---

## 3. Fully green CI

The Python / FastAPI CI job had failed on a **pre-existing 80% coverage gate** (unrelated to the
TypeScript engines) on every prior PR. Sprint 14 clears it: added focused tests for the API's
configuration (`parse_cors_origins` branches, `is_development`) and the ASGI entrypoint module,
lifting coverage from ~66% to ~95%. **All CI checks — JavaScript/TypeScript, Prettier, and Python —
now pass.**

---

## 4. Documentation

`docs/pipeline-overview.md` is the top-level map: the Creative IR spine, the full pipeline diagram,
the engine/package table across all fourteen sprints, the one-call entry point, the cross-cutting
principles (provider-neutral, deterministic, immutable/auditable, pluggable), and the worked
Northwind example artifacts. The README links it as the entry point to the architecture.

---

## 5. Testing

`pipeline.test.ts` (4 tests) drives the **entire system** through `createPipeline().run(...)`:

- Brief → finished, analyzed campaign in one call (structure, generation, QA PASS, export, completion)
- The full event stream across every stage (prompt / asset / qa / catalog / export / lifecycle)
- A valid Creative IR at the end of the run, with the export recorded
- **End-to-end determinism** — identical inputs yield an identical Creative IR, event stream,
  dashboard, and finished campaign page

Build, lint, and test are green across the monorepo; the API's ruff, mypy, and pytest (with the
coverage gate) are green too.

---

## 6. Project status

Sprints 0–14 are complete. The Creative Factory runs end to end — from a Business/Creative Brief to a
finished, published, analyzed campaign — provider-neutrally and deterministically, with every stage
recorded on the canonical Creative IR. See `docs/pipeline-overview.md` for the full picture and
`docs/roadmap.md` for the per-sprint history.

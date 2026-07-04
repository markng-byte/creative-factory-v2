# Sprint 5 — Creative IR Compiler + Multi-Adapter Output Generation

**Status:** Complete
**Scope:** The deterministic Creative IR Compiler and its pluggable output adapters.

---

## 1. What Sprint 5 builds

Sprint 5 delivers the bridge between business strategy and AI generation: a **deterministic
compiler** that turns a validated Creative Brief (plus Campaign and Brand Tokens) into a
fully-populated **Creative IR**, and a set of **pluggable output adapters** that transform that IR
into production artifacts bundled as a **Creative Package**.

It is **not** an AI generation engine. It calls no AI provider. It converts structured business and
brand information into structured creative specifications through pure, reproducible transformations.

```
                    ┌──────── PHASE 1: IR CONSTRUCTION (planning stages) ─────────┐
CreativeBrief ─┐    │  Narrative → Story → Storyboard → Scene → Shot →            │
BrandTokens  ──┼──► │  Composition → Motion → Timing → Asset                      │ ──► CreativeIR
Campaign     ──┤    │  (pure functions; each populates part of the canonical IR)  │   (validated,
Constraints  ──┘    └─────────────────────────────────────────────────────────────┘    frame-exact)
                                                                                              │
                    ┌──────── PHASE 2: OUTPUT GENERATION (adapters) ──────────────┐          ▼
                    │  storyboard-html · scene-spec · shot-list · motion-spec ·    │ ◄────────┘
                    │  asset-plan · timeline · qa-spec  (read-only over the IR)    │
                    └─────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
                          Creative Package  (canonical input for downstream engines)
```

**Direction of the canonical arrow** (consistent with the README and `packages/creative-ir`):
`Creative Brief + Brand + Campaign → [Compiler] → Creative IR → [Adapters] → Artifacts`.
The compiler _produces_ the Creative IR; the adapters _consume_ it. No adapter ever mutates the IR.

---

## 2. Packages

| Package | Responsibility |
| --- | --- |
| `@creative-factory/creative-ir` (extended) | Canonical model. Adds `StandardCreativeIRValidator` and a `SceneObjectives` field on `Scene`; fixes branded-ID helpers. |
| `@creative-factory/creative-ir-compiler` (new) | Phase 1. Implements `CreativeIRCompiler`. Nine pure planning stages + pipeline assembler + ports (sources, clock, id generator). |
| `@creative-factory/creative-ir-adapters` (new) | Phase 2. Seven `CreativeIRAdapter`s, `StandardAdapterRegistry`, and the Creative Package assembler. |

Each planning stage lives in its own module under `creative-ir-compiler/src/stages/` and is
independently unit-testable. Adapters are one module each under `creative-ir-adapters/src/`.

---

## 3. Phase 1 — the nine planning stages

Every stage is a **pure function**: no I/O, no randomness, no clock. Identifiers come from an
injected `IdGenerator`; the only timestamp is read once, up front, from an injected `Clock`.

| # | Stage | Input → Output | Populates in Creative IR |
| - | --- | --- | --- |
| 1 | **Narrative Engine** | Brief → `NarrativeBlueprint` | `creativeContext` (theme, key messages, mood); the six-beat arc |
| 2 | **Story Engine** | Narrative → `StoryDraft[]` | `stories[]` (title, sequence, duration budget) |
| 3 | **Storyboard Engine** | Story → `StoryboardDraft[]` | `Story.storyboards[]` |
| 4 | **Scene Planner** | Beats → `SceneDraft[]` | `Storyboard.scenes[]` + `Scene.objectives` |
| 5 | **Shot Planner** | Scene → `ShotDraft[]` | `Scene.shots[]` |
| 6 | **Composition Planner** | Shot + Brand → `VisualSpecification` | `Shot.visualSpec` (shot type, camera, composition, lighting, grading) |
| 7 | **Motion Planner** | Shot + Visual → `MotionSpecification` | `Shot.motionSpec` (camera keyframes, object motion) |
| 8 | **Timing Planner** | All + Campaign duration → `TimingPlan` | every `Duration`, `Story.durationFrames` |
| 9 | **Asset Planning Engine** | Shots + Brand → `AssetRequest[]` | `assetRequests[]` + `Shot.assetRequests[]` |

The **six-beat arc** (`setup → inciting → rising → climax → resolution → call-to-action`) with
relative weights `[0.15, 0.15, 0.2, 0.25, 0.15, 0.1]` is the dramatic skeleton. The Timing Planner
distributes the campaign's total frames across scenes by beat weight and across shots evenly, with
rounding remainders absorbed by the final element so the per-element frames always sum back to the
campaign total.

The compiler resolves marketing constraints from the brief onto the canonical `Constraint` model in
`CreativeContext.constraints` — no new constraint concept is introduced.

---

## 4. Phase 2 — output adapters & the Creative Package

Adapters implement the pre-declared `CreativeIRAdapter` interfaces from `@creative-factory/creative-ir`
and are managed by `StandardAdapterRegistry` (register / get / list / `listByCapability`). Adding a new
output format means registering a new adapter — the compiler core never changes.

| Adapter | Artifact | Format |
| --- | --- | --- |
| `storyboard-html` | Human-readable, self-contained storyboard | HTML |
| `scene-spec` | Complete scene specifications | JSON |
| `shot-list` | Flat, ordered shot breakdown | JSON |
| `motion-spec` | Per-shot motion specifications | JSON |
| `asset-plan` | Asset inventory grouped by type | JSON |
| `timeline` | Frame-accurate scene/shot tracks | JSON |
| `qa-spec` | QA checklist (brand / constraint / structural) | JSON |

`renderCreativePackage(creativeIR)` runs the standard adapters and assembles a **Creative Package**:
the adapter artifacts keyed by adapter name, plus derived `CreativeMetadata` (scene/shot/asset totals,
duration, brand, compile provenance). This package is the canonical input for the downstream Prompt
Translation, Image Generation, Video Generation, QA, and Export engines.

---

## 5. Determinism

Determinism is a first-class, tested property:

- **No wall-clock, no RNG in stages.** Time is injected via `Clock`; ids via `IdGenerator`.
- `DeterministicIdGenerator` derives ids from the content path (FNV-1a hash of namespace + parts).
- Adapters read `processedAt` from the IR's own `compilerMetadata.compileTimestamp`, never a clock.
- **Guarantee (unit-tested):** identical inputs + a fixed clock produce a **byte-identical** Creative IR
  and Creative Package (`JSON.stringify` equality).

---

## 6. Worked example

`docs/examples/` contains real, regenerated compiler output for the fictional brand **Northwind
Analytics** (a 30-second, 30 fps launch film):

- `creative-ir-northwind.json` — the compiled Creative IR (1 story, 6 scenes, 13 shots, 20 assets, 900 frames)
- `creative-package-northwind.json` — the assembled Creative Package (all seven adapter outputs)
- `storyboard-northwind.html` — the rendered storyboard

The inputs are the `exampleCreativeBrief()` / `exampleCampaign()` / `exampleBrandBundle()` fixtures
exported from `@creative-factory/creative-ir-compiler`.

---

## 7. Testing

| Suite | Coverage |
| --- | --- |
| `creative-ir/validator.test.ts` | Structural / semantic / compiler rule families; permissive downgrade |
| `creative-ir-compiler/stages/narrative.test.ts` | Six-beat arc, weights, purity |
| `creative-ir-compiler/stages/timing.test.ts` | Frame conservation across scenes/shots/story |
| `creative-ir-compiler/compiler.test.ts` | Integration compile, frame accuracy, **determinism**, referential integrity, error paths |
| `creative-ir-adapters/creative-package.test.ts` | All adapters, HTML self-containment, scene-spec completeness, timeline totals, QA derivation, **determinism**, registry discovery |

`pnpm build`, `pnpm lint`, and `pnpm test` are green across the whole monorepo.

---

## 8. Non-implementation decisions

Sprint 5 deliberately does **not**:

- Implement the Prompt-Translation, Image-Generation, Video-Generation, or Export adapters
  (Sprints 7–12). Their interfaces already exist as stubs in `creative-ir` and are left untouched.
- Call any AI/LLM provider. All stages use deterministic heuristics, matching the Sprint 4 pattern.
- Persist anything to a database. Source ports ship with in-memory implementations only.
- Perform human review/approval logic (Sprint 6).

---

## 9. Entry criteria for Sprint 6

The Creative Package now carries sufficient, provider-neutral information for the Human Review &
Approval Engine to operate on stories, storyboards, scenes, and shots, and for later generation
engines to consume shot-level visual/motion specs and the asset plan.

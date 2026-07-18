# Sprint 10 — QA & Brand Compliance Engine

**Status:** Complete
**Scope:** Judge the generated assets. Run a pluggable rule set over the real generated content,
write verdicts back into the Creative IR, emit `qa.completed`, and recommend the asset-review gate.

---

## 1. What Sprint 10 builds

Sprints 8–9 generated assets and marked them `in-progress`. Sprint 10 is the first sprint that
**judges** the output: it inspects every generated asset against a set of brand-compliance and
technical rules, produces a QA report, writes each asset's `qaStatus` back into the Creative IR,
emits the existing `qa.completed` contract event, and — when QA passes — recommends the
`complete_generation` transition that moves the campaign to the human `ASSET_REVIEW` gate.

```
   Creative IR (with generated AssetOutputs, qaStatus = in-progress)
            │
            ▼
   ┌──────────────────────────────────────────────┐
   │            StandardQaEngine                    │
   │  for each delivered asset:                     │
   │    decode real content → run pluggable rules   │
   │    fold findings → approved / rejected         │
   └───────────────┬────────────────────────────────┘
                   ▼
   QaReport (PASS / FAIL / NEEDS_REVIEW)   ── qa.completed event
   updated Creative IR (qaStatus written)  ── recommended: complete_generation → ASSET_REVIEW
```

Like the review engine, QA returns an outcome; it never forces the transition.

---

## 2. Package

`@creative-factory/qa-engine` (new):

| Module       | Responsibility                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------- |
| `types.ts`   | `QaRule`, `QaFinding`, `AssetQaResult`, `QaReport`                                             |
| `rules.ts`   | Default pluggable rules (content-integrity, dimension-match, brand-palette, prohibited-absent) |
| `engine.ts`  | `StandardQaEngine` — assess → report → write back qaStatus → event → recommend gate            |
| `support.ts` | Injected clock/id ports + `decodeContent` (data-URI decoding for inspection)                   |

---

## 3. Rules inspect the real content

Rules are pure, independently testable, and pluggable — registering a new one extends coverage
without touching the engine. Crucially, because the generated assets are data-URI SVGs, QA decodes
and inspects the **actual bytes**, so compliance is verified, not assumed:

- **content-integrity** (critical): the asset carries resolvable content.
- **dimension-match** (major): output dimensions equal the request specification.
- **brand-palette** (major): a brand color literally appears in the rendered content.
- **prohibited-absent** (major): no prohibited element appears in the rendered content.

Visual-only rules report not-applicable for non-visual assets. A real provider's opaque remote
asset (no data URI) makes content rules report not-applicable rather than failing — the engine
degrades honestly.

An asset is **rejected** if any critical/major rule fails, else **approved**. Overall is **FAIL**
if any asset is rejected, **NEEDS_REVIEW** if only minor issues exist, else **PASS**.

---

## 4. Outcome: write-back, event, and gate recommendation

- **Write-back:** every judged asset's `AssetRequest.qaStatus` is set to `approved`/`rejected` in a
  returned updated Creative IR. Ungenerated requests (e.g. audio) are skipped, not failed.
- **Event:** one `qa.completed` event carries the overall verdict and report id.
- **Transition:** on a non-FAIL result the engine evaluates `complete_generation` against the
  deterministic state machine and, if valid from the campaign's current state, returns it as a
  recommendation (→ `ASSET_REVIEW`). On FAIL it withholds the transition with a reason.

For the Northwind example: 26 assets assessed (13 image + 13 video), all approved, 7 audio skipped
→ **PASS**, recommending the move to human asset review.

---

## 5. Determinism

Time and identity are injected; rules are pure and content-derived. Identical input yields a
byte-identical report, updated Creative IR, and event — unit-tested by `JSON.stringify` equality.

---

## 6. Testing

`engine.test.ts` (7 tests), against a Creative IR that has been compiled and then run through both
image and video generation:

- PASS on brand-compliant assets; correct assessed/skipped counts; recommends `complete_generation`
- Rules run against decoded content (brand-palette, prohibited, dimension findings present & passing)
- `qaStatus` written back for judged assets; audio left `pending`
- A `qa.completed` event carrying the overall verdict
- A tampered dimension drives **FAIL**, rejects the asset, and **withholds** the transition
- **Determinism** across runs
- A custom rule set flows through the pluggable engine

Build, lint, and test are green across the monorepo.

---

## 7. Non-implementation decisions

Sprint 10 did not implement:

- AI/perceptual QA (e.g. aesthetic scoring, semantic checks) — rules are deterministic and
  content/spec-based; a model-backed rule could register behind the same `QaRule` interface
- Accessibility/WCAG contrast analysis (a future rule)
- Automatically applying the recommended transition (returned as a recommendation, mirroring the
  review engine) or opening the human review cycle (Sprint 6 engine's job)
- Audio QA (voiceover/music remain ungenerated) and persistence of QA reports

---

## 8. Entry criteria for Sprint 11

Sprint 11 (Asset Library & Versioning) can now catalog approved assets: each carries provenance, a
QA verdict (`qaStatus`), and content, and the Creative IR records the full generate → QA history —
the basis for versioning, deduplication, and reuse across campaigns.

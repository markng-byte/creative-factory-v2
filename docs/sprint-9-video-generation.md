# Sprint 9 — Video Generation Engine

**Status:** Complete
**Scope:** The second concrete provider behind the Prompt Translation dispatch seam. Renders
deterministic animated (SMIL) video clips for video prompts, records provenance, and writes the
results back into the Creative IR — a direct mirror of Sprint 8.

---

## 1. What Sprint 9 builds

Sprint 8 generated the still key-frames; Sprint 9 generates the moving clips. It consumes video
`PromptRequest`s, renders each into a **self-contained animated SVG** whose motion is driven by the
shot's camera movement, easing, and duration, records an `AssetOutput` with full provenance and
clip metadata, stores the bytes, and writes the outputs back into the canonical Creative IR.

Still no live AI: the synthetic renderer is offline and reproducible, and a real video-generation
API implements the same `PromptProvider` interface to swap in.

```
   Creative IR ──► Prompt Translation ──► video PromptRequests
                                                 │
                                                 ▼
                        ┌────────────────────────────────────────┐
                        │   StandardVideoGenerationEngine          │
                        │   dispatch → SmilVideoProvider            │
                        │   render deterministic animated SVG       │
                        │   → AssetOutput (+ provenance, clip meta) │
                        │   → AssetStore (viewable data URI)        │
                        └───────────────┬──────────────────────────┘
                                        ▼
                updated Creative IR     ── asset.generated events
                (video AssetRequest.deliveredAssets, qaStatus = in-progress)
```

---

## 2. A compiler extension: video is now a planned asset

Previously the Asset Planning Engine (Sprint 5) planned one still image per shot. Sprint 9 extends
it to also plan a **motion clip per shot** (`video` asset type), so the video deliverable is a
first-class planned asset — planned by the compiler, translated by Sprint 7's video target, and
generated here. This keeps asset planning in one place. The committed Northwind example now has 33
asset requests: 13 image key-frames, 13 video clips, and 7 audio (voiceover + music).

The Sprint 7 video prompt target was extended to carry the target dimensions, so the renderer knows
the clip resolution.

---

## 3. Package

`@creative-factory/video-generation` (new) — mirrors `image-generation`:

| Module        | Responsibility                                                                     |
| ------------- | ---------------------------------------------------------------------------------- |
| `renderer.ts` | `renderVideo` — pure deterministic animated SVG; SMIL motion from camera movement  |
| `provider.ts` | `SmilVideoProvider` implementing the Sprint 7 `PromptProvider` seam (video target) |
| `store.ts`    | `AssetStore` / `InMemoryAssetStore`                                                |
| `engine.ts`   | `StandardVideoGenerationEngine` — generate → AssetOutput + provenance → write back |

---

## 4. Animated, viewable, deterministic

`renderVideo` composes an SVG with a SMIL `<animateTransform>` chosen by the shot's camera
movement — a dolly scales, tracking/crane translate, an orbit rotates, a pan drifts — plus a
pulsing accent, over the branded frame. The clip duration and frame rate come from the shot. It
**actually moves in a browser** yet is a pure function: same request in, same bytes out.

See the committed gallery at `docs/examples/generated-videos-northwind.html` (13 clips) — open it in
a browser to watch them animate. Each clip is stored as a `data:image/svg+xml;base64,…` URI.

---

## 5. Write-back & provenance

Each generated clip is attached to its video `AssetRequest.deliveredAssets`, the request's
`qaStatus` advances to `in-progress`, and an updated Creative IR is returned. Image and audio
requests are untouched. `AssetOutput` metadata carries the clip `duration`, `frameCount`, and
`framerate`; provenance records the engine, model (`smil-video-synth-v1`), version, parameters, and
seed. One `asset.generated` event is emitted per clip.

---

## 6. Determinism

Identical input yields a byte-identical updated Creative IR, clip set, and event stream —
unit-tested by `JSON.stringify` equality. The committed gallery and fixtures regenerate byte-for-byte.

---

## 7. Testing

`engine.test.ts` (7 tests), against a real Creative IR compiled from the Northwind fixtures:

- One clip per video request; nothing skipped
- Write-back attaches clips and advances `qaStatus`; image/audio requests untouched
- Clip metadata (duration, frame rate, frame count) and provenance
- Stored SVGs are viewable and **actually animated** (contain `<animate>` markup)
- One `asset.generated` event per clip
- **Determinism** across runs
- The provider satisfies the Sprint 7 dispatch seam (supports `video`, not `image`)

Build, lint, and test are green across the monorepo.

---

## 8. Non-implementation decisions

Sprint 9 did not implement:

- Live AI video generation (a synthetic offline renderer behind the seam; a real video API
  implements the same `PromptProvider`). No API keys, network, or secrets.
- Real encoded video (MP4/WebM) — clips are animated SVG for viewability and determinism; a real
  provider returns encoded bytes through the same `AssetOutput`/store shapes.
- Audio generation (voiceover/music remain planned but ungenerated) and QA execution (Sprint 10).
- Durable object storage (in-memory asset store).

---

## 9. Entry criteria for Sprint 10

The QA & Brand Compliance Engine can now operate on generated assets: image and video
`AssetOutput`s exist on their requests with `qaStatus = in-progress`, carrying provenance and
brand-controlled parameters, and the `qa.completed` contract event already exists to report
results back into the workflow.

# Sprint 8 — Image Generation Engine

**Status:** Complete
**Scope:** The first concrete provider behind the Prompt Translation dispatch seam. Renders
deterministic branded images for image prompts, records provenance, and writes the results back
into the Creative IR.

---

## 1. What Sprint 8 builds

Sprint 7 produced image prompts and defined a dispatch seam it did not cross. Sprint 8 crosses it —
with a **synthetic, offline provider**, not a live API. It consumes image `PromptRequest`s, renders
each into a viewable branded image, records an `AssetOutput` with full provenance, stores the
bytes, and writes the outputs back into the canonical Creative IR.

```
   approved Creative IR ──► Prompt Translation ──► image PromptRequests
                                                          │
                                                          ▼
                                     ┌──────────────────────────────────────┐
                                     │   StandardImageGenerationEngine       │
                                     │   dispatch → SvgImageProvider          │
                                     │   render deterministic branded SVG     │
                                     │   → AssetOutput (+ provenance)         │
                                     │   → AssetStore (viewable data URI)     │
                                     └───────────────┬──────────────────────┘
                                                     ▼
                     updated Creative IR             ── asset.generated events
                     (AssetRequest.deliveredAssets, qaStatus = in-progress)
```

The provider **is** a `PromptProvider` — the exact interface Sprint 7 defined — so replacing the
synthetic renderer with a real diffusion API changes nothing else in the pipeline.

---

## 2. Package

`@creative-factory/image-generation` (new):

| Module        | Responsibility                                                                     |
| ------------- | ---------------------------------------------------------------------------------- |
| `renderer.ts` | `renderImage` — pure deterministic branded SVG from a prompt (palette + seed)      |
| `provider.ts` | `SvgImageProvider` implementing the Sprint 7 `PromptProvider` dispatch seam        |
| `store.ts`    | `AssetStore` / `InMemoryAssetStore` — rendered bytes keyed by AssetOutput id       |
| `engine.ts`   | `StandardImageGenerationEngine` — generate → AssetOutput + provenance → write back |

`@creative-factory/contracts` (extended): a new additive `asset.generated` event contract.

---

## 3. Generation

- **Deterministic & offline.** `renderImage` composes a small SVG from the brand palette (a
  gradient plus a seed-placed accent shape) labelled with the shot and target and a `SYNTHETIC`
  marker. Same prompt in → same bytes out. No network, no secrets.
- **Viewable.** Each image is stored as a `data:image/svg+xml;base64,…` URI, openable directly —
  see the committed gallery at `docs/examples/generated-images-northwind.html` (13 frames).
- **Provenance.** Every `AssetOutput` records `sourceEngine`, `sourceModel` (`svg-synth-v1`),
  `sourceVersion`, the generation `parameters`, and the `seed` — the audit trail the architecture
  requires for reproducible, traceable production.

---

## 4. Write-back into the Creative IR

The engine returns an updated Creative IR in which each generated image is attached to its
`AssetRequest.deliveredAssets` and the request's `qaStatus` advances from `pending` to
`in-progress` (generated, awaiting the Sprint 10 QA engine). Non-image requests are untouched.
The canonical document is therefore the single source of truth for what has been generated. One
`asset.generated` contract event is emitted per output.

---

## 5. Determinism

Time and identity are injected; the renderer's seed comes from the prompt (itself content-derived
in Sprint 7). Identical input yields a byte-identical updated Creative IR, asset set, and event
stream — unit-tested by `JSON.stringify` equality. The committed gallery regenerates byte-for-byte.

---

## 6. Testing

`engine.test.ts` (8 tests), against a real Creative IR compiled from the Northwind fixtures:

- One asset output per image request; nothing skipped
- Write-back attaches assets and advances `qaStatus`; non-image requests untouched
- Full provenance (engine, model, seed) and metadata on each output
- Viewable SVG data URIs retrievable from the store (decodes to real `<svg>` markup)
- One `asset.generated` event per output
- **Determinism** across runs (IR, events, stored bytes)
- The renderer is pure/offline; the provider satisfies the Sprint 7 dispatch seam

Build, lint, and test are green across the monorepo.

---

## 7. Non-implementation decisions

Sprint 8 did not implement:

- Live AI image generation (a synthetic offline renderer stands in behind the seam; a real
  diffusion API implements the same `PromptProvider` to swap in). No API keys or network.
- Raster output (PNG/JPEG) — images are SVG for viewability and determinism; a real provider
  returns raster bytes through the same `AssetOutput`/store shapes.
- Video and voiceover generation (Sprint 9 and later) — this sprint handles image prompts only.
- QA execution (Sprint 10) — generated assets are marked `in-progress`, not yet passed.
- Durable object storage (in-memory asset store).

---

## 8. Entry criteria for Sprint 9

The Video Generation Engine can now follow the identical pattern for `video` prompts: implement a
`PromptProvider` for the video target behind the dispatch seam, produce `AssetOutput`s with
provenance, and write them back into the Creative IR — reusing the asset store and the
`asset.generated` contract.

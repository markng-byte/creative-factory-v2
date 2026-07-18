# Sprint 12 — Export & Publishing Engine

**Status:** Complete
**Scope:** Assemble the finished production package from approved, catalogued assets — manifest,
per-channel bundles, a viewable finished campaign page — publish through a seam, and drive the
campaign to COMPLETED.

---

## 1. What Sprint 12 builds

This is the final stage of the pipeline. It takes a Creative IR whose assets are approved and
catalogued (Sprints 10–11) and assembles a production **ExportPackage**:

- a **manifest** of every deliverable asset with its content hash, provenance, and library
  reference,
- per-aspect-ratio **channel bundles**,
- viewable **deliverables** — a finished campaign page and the manifest,

then **publishes** each bundle through a dispatch seam, records **`ExportMetadata`** back into the
Creative IR, drives the export **workflow transitions** (`start_export` → `complete_export` →
`COMPLETED`), and emits `export.published` and lifecycle events.

```
   Creative IR (approved + catalogued assets, library refs)
            │
            ▼
   ┌──────────────────────────────────────────────┐
   │            StandardExportEngine                │
   │  manifest ← approved assets (+ content hash)   │
   │  bundles  ← group by aspect ratio              │
   │  deliverables ← campaign.html + manifest.json  │
   │  publish each bundle → PublishTarget (dry run) │
   └───────────────┬────────────────────────────────┘
                   ▼
   ExportPackage + viewable finished page   ── export.published events
   updated Creative IR (ExportMetadata)     ── start_export → complete_export → COMPLETED
```

---

## 2. Package

`@creative-factory/export-engine` (new):

| Module           | Responsibility                                                                     |
| ---------------- | ---------------------------------------------------------------------------------- |
| `manifest.ts`    | Build the manifest from approved assets + per-aspect-ratio bundles                 |
| `deliverable.ts` | `assembleCampaignPage` (the finished viewable piece) + `buildManifestJson`         |
| `publish.ts`     | Publish dispatch seam: `PublishTarget` + offline `DryRunPublishTarget`             |
| `engine.ts`      | `StandardExportEngine.export` — package → publish → write back → drive transitions |
| `support.ts`     | Injected clock/id ports, content hashing, aspect-ratio + HTML helpers              |

`@creative-factory/contracts` (extended): a new additive `export.published` event contract.

---

## 3. The finished piece

The capstone deliverable is `campaign.html` — a self-contained page that lays the **actual
generated** key-frames and animated clips out scene-by-scene, in narrative order, with the campaign
theme and call to action. It reads only the Creative IR's approved delivered assets, embeds them as
data URIs, and is deterministic. The committed example is
`docs/examples/final-delivery-northwind.html` — open it in a browser to see the finished Northwind
campaign, animated clips and all.

---

## 4. Publish seam

`PublishTarget` is where the engine would push bundles to a real channel (a CDN, an ad platform, a
CMS). Sprint 12 defines the seam but does not cross it: the default `DryRunPublishTarget` records
where each bundle _would_ be published (`dryrun://…`) — offline and deterministic. A real
integration implements `PublishTarget` to swap in; nothing else changes.

---

## 5. Workflow completion

Given the campaign's current lifecycle state (default `FINAL_APPROVAL`), the engine evaluates the
export transitions against the deterministic state machine and returns the validated chain —
`start_export` (→ `EXPORTING`) then `complete_export` (→ `COMPLETED`) — emitting a
`campaign.lifecycle.transitioned` event for each. It records one `ExportMetadata`
(`exportFormat: production-package`, `status: completed`) into `creativeIR.exports`. This is where a
campaign reaches **COMPLETED** — the end of the lifecycle the workflow engine defined in Sprint 2.

---

## 6. Determinism

Injected clock/id ports and content-derived ids make the whole export reproducible: identical input
yields a byte-identical export package, updated Creative IR, and event stream — unit-tested by
`JSON.stringify` equality. The committed final-delivery page regenerates byte-for-byte.

---

## 7. Testing

`engine.test.ts` (7 tests), against a Creative IR compiled → generated → QA-approved → catalogued:

- Manifest of the 26 approved assets with content hashes and Sprint 11 library references
- Per-aspect-ratio bundles published through the dry-run seam
- The viewable campaign page embeds the real generated media
- `ExportMetadata` recorded back into the Creative IR
- The export transitions drive the campaign to `COMPLETED`
- `export.published` + lifecycle events emitted
- **Determinism** across runs

Build, lint, and test are green across the monorepo.

---

## 8. Non-implementation decisions

Sprint 12 did not implement:

- Live publishing to real channels (the seam is dry-run only; no network or credentials)
- Real packaging formats (ZIP/tar, signed manifests) — deliverables are HTML/JSON; a real target
  produces platform-native artifacts through the same shapes
- Scheduling / staged rollout / rollback of a publish
- Audio in the finished piece (audio assets remain ungenerated)

---

## 9. Entry criteria for Sprint 13

Sprint 13 (Analytics & Optimization) can now observe a completed lifecycle end-to-end: the event
stream (`prompt.generated`, `asset.generated`, `qa.completed`, `asset.cataloged`,
`export.published`, `campaign.lifecycle.transitioned`) plus the Creative IR's full revision, review,
QA, and export history are the raw material for analytics and optimization.

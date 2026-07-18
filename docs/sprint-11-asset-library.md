# Sprint 11 — Asset Library & Versioning

**Status:** Complete
**Scope:** Catalog QA-approved assets into a content-addressed library with version lineage,
deduplication, cross-campaign reuse, and Creative IR link-back.

---

## 1. What Sprint 11 builds

Sprint 10 approved the generated assets. Sprint 11 gives them a home: a **content-addressed asset
library**. Each QA-approved asset output is ingested as an immutable, content-hashed **version** of
a **logical asset** (one per Creative IR asset request). Re-ingesting identical content
**deduplicates** instead of creating a new version; regenerating an asset with new content adds a
new version to its lineage; and content already present — even from another campaign — is recognized
as a **reuse**. Library references are recorded back onto the Creative IR.

```
   Creative IR (assets with qaStatus = approved)
            │
            ▼
   ┌──────────────────────────────────────────────┐
   │           StandardAssetLibrarian               │
   │  for each approved asset output:               │
   │    contentHash(content)                        │
   │    logical key = asset request id              │
   │    exists + same hash  → dedup (no new version)│
   │    exists + new hash    → new version (lineage)│
   │    new logical asset    → version 1            │
   └───────────────┬────────────────────────────────┘
                   ▼
   Asset library (LibraryAsset → version chain)   ── asset.cataloged events
   updated Creative IR (library refs on requests)
```

---

## 2. Package

`@creative-factory/asset-library` (new):

| Module         | Responsibility                                                                |
| -------------- | ----------------------------------------------------------------------------- |
| `types.ts`     | `LibraryAsset`, `LibraryAssetVersion`, `LibraryRef`, `IngestReport`           |
| `library.ts`   | `AssetLibrary` / `InMemoryAssetLibrary` — logical-key + content-hash indexes  |
| `librarian.ts` | `StandardAssetLibrarian.ingest` — content-address, version, dedup, write back |
| `support.ts`   | Injected clock/id ports + `contentHash`                                       |

`@creative-factory/contracts` (extended): a new additive `asset.cataloged` event contract.

---

## 3. Content addressing, versioning & dedup

- **Content-addressed:** every version carries a `contentHash` of its bytes. Identical content
  always hashes the same, which is what makes dedup and reuse possible.
- **Logical asset = one per request:** a `LibraryAsset` groups the versions of a single asset slot
  (its Creative IR asset request). Regenerations of that slot become an ordered **version chain**.
- **Dedup:** ingesting content equal to a logical asset's current latest version creates no new
  version — the existing version is referenced with `deduped: true`.
- **Reuse across campaigns:** when content already exists anywhere in the library, the new version
  records `reusedFrom` the existing version, so provenance of reuse is preserved.

---

## 4. Write-back & events

Each ingested output is recorded back onto its `AssetRequest.metadata.library` in a returned updated
Creative IR — `{ libraryAssetId, versionId, version, contentHash, deduped }` — so the canonical
document points at the catalogued, versioned asset (recorded via the existing untyped `metadata`
field, so no schema change is needed). One `asset.cataloged` event is emitted per ingested output.

Only **approved** assets are considered; pending/ungenerated requests (e.g. audio) are skipped, and
rejected assets are never catalogued.

---

## 5. Determinism

Injected clock/id ports plus content-derived hashes make ingest reproducible: identical input yields
a byte-identical library, updated Creative IR, and event stream — unit-tested by `JSON.stringify`
equality. For the Northwind example, ingest catalogs 26 logical assets (13 image + 13 video), each at
version 1; a second ingest of the same IR dedups all 26 with zero new versions.

---

## 6. Testing

`librarian.test.ts` (7 tests), against a Creative IR compiled → image+video generated → QA-approved:

- Catalogs only approved assets (26), one logical asset per request, each at version 1
- Content-addressed versions with recorded provenance
- Library references written back onto the Creative IR
- **Dedup**: re-ingesting the same IR creates 0 versions, dedups 26
- **Versioning**: regenerating the 13 images with new content adds version 2 to each (videos dedup)
- One `asset.cataloged` event per ingested output
- **Determinism** across runs

Build, lint, and test are green across the monorepo.

---

## 7. Non-implementation decisions

Sprint 11 did not implement:

- Durable storage (in-memory library and content index; a real object store + database implements
  the same `AssetLibrary` interface)
- Physical byte deduplication / blob storage — dedup is by content hash at the catalog level; a real
  store would also collapse the underlying bytes
- Tag search / query API beyond `findByLogicalKey` / `findByContentHash` (tags are recorded)
- Audio assets (ungenerated) and garbage collection / retention policies

---

## 8. Entry criteria for Sprint 12

Sprint 12 (Export & Publishing Engine) can now assemble a production package from catalogued,
versioned, approved assets: each Creative IR request points at a `LibraryAsset` version with a
stable content hash and provenance — the immutable basis for export manifests and publishing.

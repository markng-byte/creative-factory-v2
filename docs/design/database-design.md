# Database Design — Creative Factory Persistence

**Status:** Design (pre-implementation). Companion to `target-architecture.md`; specifies the **S15
persistence layer**. `[placeholder]` marks a decision still to lock (types, retention, sizing).

**Design stance:** event-sourced and immutable. The append-only **event store** is the source of
truth; **IR snapshots** are materialized state per version; everything is **content-addressed** so
dedup and determinism carry through. Postgres holds structured state, a **blob store** holds bytes,
**Redis** holds only ephemera. Each table backs an interface that already exists — see §7.

---

## 1. Stores at a glance

| Store          | Holds                                                                              | Backs                                         |
| -------------- | ---------------------------------------------------------------------------------- | --------------------------------------------- |
| **Postgres**   | events, IR snapshots, campaigns/briefs, library index, reviews, exports, materials | `*Source` · `AssetLibrary` · `ReviewRegistry` |
| **Blob store** | real image/video/upload bytes, content-addressed                                   | `AssetStore`                                  |
| **Redis**      | run queue, gate-wait signals, locks, cache                                         | orchestrator runtime                          |

Conventions: primary keys are the domain's branded string ids (ULID/UUID `[placeholder: pick ULID vs
UUIDv7]`); timestamps are `timestamptz`; large documents are `jsonb`; every table has `created_at`.
Content hashes are `sha256` (matches `ContentHash` in `packages/domain`).

---

## 2. Entity overview

```
campaign ──1:N── brief
   │
   ├──1:N── ir_snapshot            (immutable, versioned; JSONB of the Creative IR)
   ├──1:N── event                  (append-only log; the source of truth)
   ├──1:N── review_cycle ──1:N── comment_thread ──1:N── review_comment
   │                        └──1:N── review_decision
   ├──1:N── library_asset ──1:N── library_asset_version   (content-addressed, dedup/reuse)
   ├──1:N── material               (uploaded reference + extracted descriptors)
   └──1:N── export                 (published bundle + deliverable refs)
```

---

## 3. Postgres schema

Types below are a starting point; `[placeholder]` where a column needs a final decision.

### 3.1 `campaign`

| Column            | Type          | Notes                                                                               |
| ----------------- | ------------- | ----------------------------------------------------------------------------------- |
| `id`              | `text` PK     | campaign id                                                                         |
| `organization_id` | `text`        | tenant `[placeholder: multi-tenant model]`                                          |
| `brand_id`        | `text`        | FK → brand `[placeholder: brand table or external]`                                 |
| `name`            | `text`        |                                                                                     |
| `lifecycle_state` | `text`        | one of `CampaignLifecycleState` (enum `[placeholder: pg enum vs check constraint]`) |
| `created_at`      | `timestamptz` |                                                                                     |
| `updated_at`      | `timestamptz` |                                                                                     |

Serves `CampaignSummaryDto`. Index: `(organization_id, updated_at desc)`.

### 3.2 `brief`

| Column        | Type          | Notes                                                  |
| ------------- | ------------- | ------------------------------------------------------ |
| `id`          | `text` PK     |                                                        |
| `campaign_id` | `text` FK     |                                                        |
| `objective`   | `text`        |                                                        |
| `audience`    | `text`        |                                                        |
| `channels`    | `text[]`      |                                                        |
| `constraints` | `text[]`      |                                                        |
| `payload`     | `jsonb`       | full imported brief `[placeholder: store raw import?]` |
| `updated_at`  | `timestamptz` |                                                        |

Serves `BusinessBriefDto`.

### 3.3 `ir_snapshot` (materialized state)

| Column         | Type          | Notes                                                         |
| -------------- | ------------- | ------------------------------------------------------------- |
| `id`           | `text` PK     |                                                               |
| `campaign_id`  | `text` FK     |                                                               |
| `version`      | `int`         | monotonic per campaign                                        |
| `content_hash` | `text`        | `sha256` of the canonical IR — dedup key                      |
| `stage`        | `text`        | producing stage (compile/generate/qa/…) `[placeholder: enum]` |
| `document`     | `jsonb`       | the Creative IR                                               |
| `created_at`   | `timestamptz` |                                                               |

Immutable — insert-only. Unique `(campaign_id, version)`; index `(campaign_id, content_hash)`.

### 3.4 `event` (append-only — source of truth)

| Column        | Type          | Notes                                                   |
| ------------- | ------------- | ------------------------------------------------------- |
| `id`          | `bigint` PK   | global sequence (identity)                              |
| `campaign_id` | `text` FK     |                                                         |
| `sequence`    | `int`         | monotonic per campaign (ordering + SSE resume cursor)   |
| `name`        | `text`        | one of `CreativeFactoryEventContract` names (see §list) |
| `payload`     | `jsonb`       | the event contract body                                 |
| `occurred_at` | `timestamptz` |                                                         |

Insert-only; never updated/deleted `[placeholder: retention/archival policy]`. Unique
`(campaign_id, sequence)`; index `(campaign_id, id)` for replay + live tail. Event names:
`prompt.generated`, `asset.generated`, `qa.completed`, `asset.cataloged`, `export.published`,
`campaign.lifecycle.transitioned`, `review.completed`.

### 3.5 `library_asset` / `library_asset_version` (content-addressed)

`library_asset` — one logical asset per Creative IR asset request:

| Column                      | Type          | Notes                                     |
| --------------------------- | ------------- | ----------------------------------------- |
| `id`                        | `text` PK     | `LibraryAssetId`                          |
| `logical_key`               | `text`        | the IR asset-request id (groups versions) |
| `campaign_id`               | `text` FK     |                                           |
| `asset_type`                | `text`        |                                           |
| `tags`                      | `text[]`      |                                           |
| `latest_version`            | `int`         |                                           |
| `created_at` / `updated_at` | `timestamptz` |                                           |

`library_asset_version` — immutable version chain:

| Column             | Type          | Notes                            |
| ------------------ | ------------- | -------------------------------- |
| `version_id`       | `text` PK     | `LibraryVersionId`               |
| `library_asset_id` | `text` FK     |                                  |
| `version`          | `int`         |                                  |
| `content_hash`     | `text`        | dedup / cross-campaign reuse key |
| `asset_output_id`  | `text`        |                                  |
| `request_id`       | `text`        |                                  |
| `format`           | `text`        |                                  |
| `blob_url`         | `text`        | pointer into the blob store (§4) |
| `provenance`       | `jsonb`       | from `Provenance`                |
| `reused_from`      | `text` null   | set when content already existed |
| `ingested_at`      | `timestamptz` |                                  |

Index `content_hash` **globally** (cross-campaign reuse). Unique `(library_asset_id, version)`.

### 3.6 `review_cycle` / `comment_thread` / `review_comment` / `review_decision`

`review_cycle`: `id` PK, `campaign_id` FK, `target_kind` (`strategy|storyboard|assets|final`),
`state` (`open|approved|changes_requested|rejected`), `reviewed_ir_version` int, `policy` jsonb
(approval chain), `opened_at`, `closed_at` null. Backs `ReviewRegistry` (`getById`, `listByCampaign`,
`listOpen`). Index `(campaign_id, state)`.

`comment_thread`: `id` PK, `review_cycle_id` FK, `anchor_kind`
(`document|story|storyboard|scene|shot|asset-request`), `anchor_target_id` text, `severity`
(`blocking|major|minor`), `resolved` bool.

`review_comment`: `id` PK, `thread_id` FK, `author` text, `text` text, `suggested_change` text null,
`created_at`.

`review_decision`: `id` PK, `review_cycle_id` FK, `reviewer` text, `decision`
(`APPROVE|REJECT|REQUEST_CHANGES|ESCALATE`), `rationale` text null, `level` int
`[placeholder: multi-level chain columns]`, `decided_at`.

### 3.7 `material` (ingestion)

| Column         | Type          | Notes                                              |
| -------------- | ------------- | -------------------------------------------------- |
| `id`           | `text` PK     |                                                    |
| `campaign_id`  | `text` FK     |                                                    |
| `content_hash` | `text`        | dedup against blob store                           |
| `kind`         | `text`        | image / video / doc `[placeholder: taxonomy]`      |
| `filename`     | `text`        |                                                    |
| `blob_url`     | `text`        | bytes in blob store                                |
| `descriptors`  | `jsonb`       | palette / tags / style from the analysis seam      |
| `rights`       | `jsonb` null  | usage rights / restrictions `[placeholder: model]` |
| `created_at`   | `timestamptz` |                                                    |

### 3.8 `export`

`id` PK, `campaign_id` FK, `ir_version` int, `bundle` jsonb (deliverable manifest), `published_at`,
`target` text `[placeholder: publish-target metadata]`.

---

## 4. Blob store (`AssetStore`)

Content-addressed object storage for real bytes (generated assets + uploaded materials).

- **Key:** `sha256/<hash>` (dedup is automatic — identical bytes, identical key).
- **Backends:** local filesystem in dev; S3-compatible in prod (Decision D2). One interface.
- Postgres rows hold the **hash/URL pointer**, never the bytes.
- `[placeholder: bucket layout, lifecycle rules, max object size, CDN/signed-URL access]`.

---

## 5. Redis (ephemeral only — never source of truth)

| Keyspace              | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `run:queue`           | pipeline run queue (survives multi-day gates) |
| `run:{id}:lock`       | single-writer lock per run                    |
| `gate:{cycleId}:wait` | human-gate wait signal                        |
| `cache:*`             | read-model caches `[placeholder: TTLs]`       |

`[placeholder: persistence config — is Redis durable (AOF) or pure cache here?]`.

---

## 6. Migrations & determinism

- **Migrations:** `[placeholder: pick tool — e.g. node-pg-migrate / Prisma Migrate / Drizzle]`;
  forward-only, checked into `packages/[placeholder: persistence-package-name]`.
- **Determinism preserved:** content-hash ids and injected clock are unchanged; snapshots and events
  are insert-only, so a rebuild from the log reproduces state. The end-to-end determinism test must
  still pass with Postgres-backed ports.
- **Seeds:** the Northwind example loads as a seed for dev/demo `[placeholder: seed script location]`.

---

## 7. Port → table mapping (no engine changes)

| Existing port (in-memory today)                                | Postgres-backed by                            |
| -------------------------------------------------------------- | --------------------------------------------- |
| `CreativeBriefSource` / `CampaignSource` / `BrandTokensSource` | `brief` / `campaign` / `[placeholder: brand]` |
| `AssetLibrary`                                                 | `library_asset(_version)`                     |
| `AssetStore`                                                   | blob store (§4)                               |
| `ReviewRegistry`                                               | `review_cycle` + children                     |
| _(new)_ event store                                            | `event`                                       |
| _(new)_ IR snapshot store                                      | `ir_snapshot`                                 |

Each is "implement the same interface against Postgres" — the engines are untouched.

---

## 8. Open decisions (rolled up)

Id scheme (ULID vs UUIDv7) · tenancy model · enum representation · brand storage (table vs external) ·
event retention/archival · Redis durability · migration tool + package name · blob bucket layout &
access · rights/taxonomy models. Each is marked `[placeholder]` above; the cross-cutting ones (blob
backend = D2, event-store shape = D3) are decided in `target-architecture.md`.

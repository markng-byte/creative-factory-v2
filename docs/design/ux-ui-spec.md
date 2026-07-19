# UX / UI Design Specification — Creative Factory Console

**Status:** Design (pre-implementation). Companion to `target-architecture.md`; scopes the **S18 web
console**. `[placeholder]` marks a decision the team (or a design pass) still owns.

**How to read this:** every screen is specified as _purpose → layout → components → states → data
bindings_. Data bindings name the real DTO/field the UI reads (from `packages/contracts/src/api.ts`
and `packages/domain`), so the prototype and the eventual build stay honest to the system.

---

## 1. Product & principles

**One-line product:** a strategist submits a creative brief, uploads reference materials, watches the
campaign move through its lifecycle in real time, approves or sends back work at the human gates, and
opens the finished, analyzed campaign.

**Design principles**

1. **Instrument, not dashboard.** This drives a deterministic production pipeline; it should read as a
   precise control surface, not a decorative analytics page.
2. **State at a glance.** Lifecycle state, QA verdict, and "needs your decision" must be legible in one
   scan — encoded in form (pill / rail / severity stripe), not just text.
3. **The gate is the loudest thing.** When a run waits on a human, that action outranks everything
   else on screen.
4. **Real content only.** No lorem in any mock; bind to real fields and the worked Northwind example.
5. **Accessible + theme-aware by default** (light/dark, keyboard, reduced-motion).

**Primary persona** — `[placeholder: validate with real user research]`

- **The Strategist / Producer.** Owns a campaign end to end; submits briefs, curates references, makes
  gate decisions, ships deliverables. Cares about: where a run is, what's blocked on them, whether QA
  passed. Not a developer.
- Secondary: **Reviewer / Brand lead** (gate decisions only), **Admin** `[placeholder: scope — brand
config, users, connectors?]`.

---

## 2. Information architecture

```
Console
├── Campaigns            (list / entry point)
│   └── Campaign
│       ├── Overview      (summary + lifecycle state + quick actions)
│       ├── Brief         (view / edit / import)
│       ├── Materials     (upload + ingestion/analysis)
│       ├── Run           (live lifecycle + event feed)   ◄── centerpiece
│       ├── Review        (open human gate, when active)
│       └── Deliverables  (finished campaign page, dashboard, IR)
├── Library              (content-addressed assets, cross-campaign reuse)  [placeholder: v1 or later?]
└── Settings             (brand, users, connectors)                        [placeholder: scope]
```

**Navigation:** persistent left rail (Campaigns / Library / Settings) + a per-campaign sub-nav across
the six campaign views. `[placeholder: mobile/responsive target — is a phone layout in scope for v1?]`

---

## 3. Design system

Anchored to the blueprint identity already used in the design artifact; tune in Figma/tokens later.

### 3.1 Color tokens

| Token        | Light           | Dark            | Use                                           |
| ------------ | --------------- | --------------- | --------------------------------------------- |
| `--ground`   | `#f4f5f2`       | `#10161b`       | app background                                |
| `--surface`  | `#ffffff`       | `#171f26`       | cards, panels                                 |
| `--ink`      | `#1a232b`       | `#e7ece8`       | primary text                                  |
| `--ink-soft` | `#47535d`       | `#a6b0b8`       | secondary text                                |
| `--accent`   | `#2c6b64`       | `#5aa79d`       | primary actions, active state (deep teal)     |
| `--signal`   | `#9c6410`       | `#d59a3f`       | **needs decision** — reserved for human gates |
| `--good`     | `#3a7449`       | `#64a87b`       | done / QA pass                                |
| `--warn`     | `[placeholder]` | `[placeholder]` | changes-requested                             |
| `--critical` | `[placeholder]` | `[placeholder]` | rejected / QA fail / error                    |
| `--pending`  | `#6b7580`       | `#8b949c`       | future / not-yet-reached lifecycle states     |

Semantic colors (good/warn/critical) are **separate from the accent** and never used decoratively.

### 3.2 Type

- **Display/headings:** `[placeholder: confirm face]` — a considered serif or strong sans.
- **Body:** system sans stack.
- **Mono (state names, event names, IDs, counters):** `ui-monospace` stack, tabular figures.
- Type scale: `[placeholder: lock scale, e.g. 12 / 14 / 16 / 20 / 28 / 40]`.

### 3.3 Spacing, radius, elevation

- Spacing scale `[placeholder: e.g. 4-based 4/8/12/16/24/32/48]`.
- Radius: cards `[placeholder]`, pills `999px`.
- Elevation: one soft shadow token for raised surfaces; flat everywhere else.

---

## 4. Screen specifications

### 4.1 Campaigns (list)

- **Purpose:** entry point; see every campaign and its state, jump in, start a new one.
- **Layout:** table/rows, one per campaign; primary "New campaign" action top-right.
- **Components:** row = name · lifecycle-state pill · updated-at · quick action. Filter/sort bar.
- **States:** empty (no campaigns → prominent create), loading (skeleton rows), error.
- **Data bindings:** `CampaignSummaryDto{ name, lifecycleState, updatedAt, brandId }`.

### 4.2 Brief intake + import

- **Purpose:** create or import the brief that seeds a run.
- **Layout:** form with sections (objective, audience, channels, constraints); an **Import** affordance
  for JSON/YAML (`business-brief-importer`).
- **Components:** text fields, channel multi-select `[placeholder: fixed channel list?]`, constraints
  repeater, import drop-zone, "Compile / start run" primary action.
- **States:** draft (autosave `[placeholder: autosave or explicit save?]`), validation errors inline,
  import-parse error with the offending field named.
- **Data bindings:** `BusinessBriefDto{ objective, audience, channels[], constraints[] }`.

### 4.3 Materials — upload + ingestion

- **Purpose:** attach reference materials so they shape output, not just prompt text.
- **Layout:** drag-drop zone + a grid of uploaded materials.
- **Components:** per-material card showing thumbnail, filename, **analysis chips** (extracted palette /
  tags / descriptors), content-hash badge, usage-rights field `[placeholder: rights UI required?]`.
- **States:** uploading (progress), **analyzing** (seam running), analyzed (chips appear), duplicate
  (content-hash match → "reused" badge), unsupported type error.
- **Data bindings:** new `MaterialDto{ id, contentHash, kind, filename, descriptors[] }` (see
  `target-architecture.md` §3.4). `[placeholder: max file size / accepted types]`.

### 4.4 Run — live lifecycle (centerpiece)

- **Purpose:** watch one campaign advance; act when it stops for a human.
- **Layout:** three zones — (a) **lifecycle rail** across the top, (b) **live event feed** (main
  column), (c) **run summary** side panel (counters + current deliverable preview).
- **Lifecycle rail** — the real states, current one active, past done, future pending:
  `DRAFT → BRIEF_READY → STRATEGY_DRAFT → STRATEGY_REVIEW → STORYBOARD_DRAFT → STORYBOARD_REVIEW →
PROMPT_READY → ASSET_GENERATION_PENDING → ASSET_GENERATION_RUNNING → ASSET_REVIEW → FINAL_APPROVAL →
EXPORTING → COMPLETED` (+ `CANCELLED`).
- **Event feed** — reverse-chronological, real event types: `prompt.generated`, `asset.generated`,
  `qa.completed`, `asset.cataloged`, `export.published`, `campaign.lifecycle.transitioned`,
  `review.completed`. Each row: icon by type, human summary, timestamp (mono).
- **Run summary** — counters bound to the run: scenes, shots, assets generated/approved/planned, QA
  verdict + pass-rate, event count. (Northwind: **6 scenes · 13 shots · 26/26 approved of 33 · QA PASS
  100% · 89 events**.)
- **Gate call-out** — when state is `*_REVIEW` / `FINAL_APPROVAL`, a `--signal`-colored banner routes
  to §4.5.
- **States:** running (live updates, subtle motion), waiting-on-gate (signal banner), completed
  (success summary + deliverable links), cancelled/failed `[placeholder: failure UX + retry]`.
- **Data bindings:** lifecycle from `CampaignLifecycleState`; feed from the event stream (SSE);
  counters from the analytics/pipeline summary.
- **Real-time transport:** `[placeholder: SSE vs WebSocket — target-architecture leans SSE]`.

### 4.5 Review — human gate

- **Purpose:** approve, request changes, or reject at one of the four gates, anchored to real content.
- **Layout:** left = the artifact under review (storyboard / assets / final); right = comment threads +
  decision panel.
- **Components:** comment thread anchored to a Creative IR node (`document / story / storyboard / scene
/ shot / asset-request`), severity tag (`blocking / major / minor`), decision panel with
  **Approve / Request changes / Reject / Escalate** + rationale field.
- **States:** open (awaiting decision), multi-level chain in progress `[placeholder: show approval-chain
progress?]`, closed (approved / changes-requested / rejected).
- **Data bindings:** `ReviewDecisionRequest{ reviewCycleId, decision, rationale }`; review target kind
  `strategy|storyboard|assets|final`; anchors + severities from `review-engine` types.

### 4.6 Deliverables

- **Purpose:** open and share the finished outputs.
- **Layout:** cards for **Finished campaign page**, **Analytics dashboard**, **Compiled Creative IR**.
- **Components:** open-in-new / embedded preview, download, copy-link `[placeholder: sharing/permissions
model]`.
- **States:** not-yet-available (run incomplete → disabled with reason), available.
- **Data bindings:** the pipeline result's finished campaign HTML, dashboard HTML, and IR JSON.

---

## 5. Component inventory

Lifecycle rail · state pill · event-feed row · counter/stat tile · gate banner · comment thread ·
decision panel · material card (with analysis chips) · brief form field set · import drop-zone ·
campaign row · deliverable card · toast. `[placeholder: confirm the reusable set + name them for the
component library]`.

---

## 6. Interaction, motion & feedback

- Live updates animate in subtly (new event row fades/slides); **gated by `prefers-reduced-motion`**.
- Every action has an immediate, literal confirmation (button "Approve" → toast "Approved").
- Optimistic vs. confirmed updates: `[placeholder: decide per action — gate decisions likely confirmed]`.

---

## 7. Accessibility & content

- WCAG target `[placeholder: AA?]`; visible keyboard focus; contrast holds in both themes; feed is a
  live region announced to screen readers `[placeholder: politeness level]`.
- **Voice:** name things by what people recognize — "campaign", "brief", "materials", "run",
  "review" — never the system's internals ("IR snapshot", "port", "event contract"). Errors say what
  went wrong and how to fix it.

---

## 8. Open questions (rolled up)

Responsive/mobile scope · autosave model · channel & rights taxonomies · Library and Settings scope in
v1 · failure/retry UX · real-time transport · sharing/permissions · WCAG level · component-library
naming. Each is marked `[placeholder]` above.

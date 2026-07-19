# Design Package — Creative Factory Next Phase

The design-first blueprint for turning the completed engine spine into an operable product. Read in
order:

1. **[Target Architecture](target-architecture.md)** — the system shape: web console, API gateway,
   persistence/event-store, and ingestion; the four horizontal layers; the runtime/blob/event-store
   decisions; and the S15–S18 sprint sequence.
2. **[UX / UI Specification](ux-ui-spec.md)** — the console: personas, information architecture, design
   system (tokens/type/color), screen-by-screen specs with real data bindings, components,
   interaction, and accessibility.
3. **[Database Design](database-design.md)** — the persistence layer: event store, IR snapshots,
   library/review/material/export tables, blob store, Redis, migrations, and the port→table mapping.

`[placeholder]` throughout marks a decision still to lock in. The architecture doc's D1–D3 are the
cross-cutting ones; the UX and DB docs roll their open questions up in a final section each.

All three are documentation only — no engine behavior changes. They are the blueprint the S15–S18
sprints execute against. See `../pipeline-overview.md` for the completed engine spine and
`../roadmap.md` for per-sprint history.

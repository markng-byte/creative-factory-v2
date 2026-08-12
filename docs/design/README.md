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

### Automation & agent integration

For wiring the engine into an external automation stack (Telegram · OpenClaw · Hermes · n8n):

4. **[OpenClaw + Hermes Setup](hermes-openclaw-setup.md)** — installing and configuring the agent
   stack: the gateway, the self-improving brain, the L4 skills + eval-gate pattern, the knowledge base
   (pgvector/Neo4j replacing Google Drive), and human-in-the-loop guardrails.
5. **[Automation Integration](automation-integration.md)** — the integration contracts: the `POST /runs`
   HTTP API, the MCP tool-manifest Hermes calls, sample n8n workflows, and the Telegram approve/reject
   flow. The executable form of the PRD's automation section.

`[placeholder]` throughout marks a decision still to lock in. The architecture doc's D1–D3 are the
cross-cutting ones; the UX and DB docs roll their open questions up in a final section each.

All three are documentation only — no engine behavior changes. They are the blueprint the S15–S18
sprints execute against. See `../pipeline-overview.md` for the completed engine spine and
`../roadmap.md` for per-sprint history.

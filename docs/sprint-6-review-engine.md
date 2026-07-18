# Sprint 6 — Human Review & Approval Engine

**Status:** Complete
**Scope:** Review cycles at the workflow's human gates, multi-level approval chains, anchored
comments, and the review → feedback → recompile loop.

---

## 1. What Sprint 6 builds

Sprints 1–5 produce a Creative Package automatically. Sprint 6 adds the humans: the checkpoints
where reviewers examine the strategy, storyboard, or assets; comment on specific scenes and
shots; approve or request changes; and where those decisions actually move the campaign through
its lifecycle — or send it back for a deterministic recompile.

```
                          ┌───────────────────────────────┐
   Campaign reaches a     │        ReviewCycle (open)      │
   human gate ──────────► │  anchored comment threads      │
   (STRATEGY_REVIEW,      │  multi-level approval chain    │
   STORYBOARD_REVIEW,     └──────────────┬────────────────┘
   ASSET_REVIEW,                         │ decisions fold through the chain
   FINAL_APPROVAL)                       ▼
                    ┌─────────────────────────────────────────────┐
                    │              ReviewOutcome                  │
                    │  • workflow transition (state machine move) │
                    │  • review.completed + lifecycle events      │
                    │  • ReviewFeedback → CompilerRequest         │
                    │  • canonical Creative IR Review record      │
                    └───────────────┬─────────────────────────────┘
              approved              │            changes requested
        ┌───────────────────────────┴─────────────────────────┐
        ▼                                                     ▼
  next lifecycle state                        back to draft + recompile with feedback
  (e.g. PROMPT_READY)                         (recorded in IR revision history)
```

The engine never invents state moves: outcomes are converted to transitions and validated by the
existing deterministic `workflow-engine` state machine, so an approval can never skip a gate.

---

## 2. Package

`@creative-factory/review-engine` (new):

| Module         | Responsibility                                                                              |
| -------------- | ------------------------------------------------------------------------------------------- |
| `types.ts`     | Cycle model: cycles, anchors, threads, decisions, policies, structured feedback             |
| `gates.ts`     | Target kind ↔ workflow gate binding (gate state + approve/changes/reject transitions)       |
| `policy.ts`    | Default multi-level approval chains + `evaluateChain`, the pure decision fold               |
| `anchors.ts`   | Anchor index built from the reviewed Creative IR; structural comment validation             |
| `engine.ts`    | `StandardReviewEngine`: open / comment / resolve / decide / cancel + outcome assembly       |
| `feedback.ts`  | Normalizes unresolved threads into compiler `ReviewFeedback` + `StructuredFeedbackItem`s    |
| `events.ts`    | Builds the existing `review.completed` and `campaign.lifecycle.transitioned` contracts      |
| `ir-review.ts` | Projects a closed cycle onto the canonical `Review` type in `@creative-factory/creative-ir` |
| `registry.ts`  | In-memory cycle storage (same pattern as Sprints 3–5)                                       |
| `support.ts`   | Injected `Clock` and `IdGenerator` ports (deterministic sequential ids)                     |

`@creative-factory/creative-ir-compiler` (extended): `CompileInputs.reviewFeedback` — when a
recompile carries feedback, the pipeline appends a revision record naming the review cycles, so
the document's own history shows the loop.

---

## 3. Approval chains

A policy is an ordered chain of steps, each with an approval type and a quorum:

```
strategy:    creative(1) → brand(1)
storyboard:  creative(1) → brand(1)
assets:      creative(1) → brand(1) → legal(1)
final:       final(1)                          (escalation terminates)
```

Defaults are overridable per cycle. Chain semantics (unit-tested):

- `approve` / `approve-with-changes` count toward the current step's quorum; meeting the last
  step's quorum approves the cycle.
- `request-changes` / `reject` close the cycle immediately from any level.
- `escalate` jumps to the next level, or rejects when the policy terminates on escalation or the
  chain is already at the top.
- A reviewer may decide once per level (`DUPLICATE_REVIEWER` otherwise).

---

## 4. Anchored comments

Comments never float free. Each thread is anchored to a Creative IR node — the document, a
story, storyboard, scene, shot, or asset request — and the anchor is validated against an index
of every node id captured from the exact document under review. Threads carry a severity
(`blocking` / `major` / `minor`), support replies, and can be resolved.

---

## 5. The feedback loop

Closing a cycle as changes-requested yields:

1. **`ReviewFeedback` headers** (review id, closure time, priority = worst unresolved severity)
   in exactly the shape `CompilerRequest.reviewFeedback` has accepted since Sprint 2 — now
   actually consumed: the compiler records the recompilation as revision 2 in the document's
   `revisionHistory`, naming the cycles.
2. **`StructuredFeedbackItem`s** — anchor + severity + text + suggested change — for future
   engines that act on feedback content.

The gate asymmetry is explicit: the state machine defines no "request changes" transition out of
`FINAL_APPROVAL`, so a final-gate changes-request produces `transitionUnavailable` and the
campaign stays at the gate for a fresh cycle; only reject maps to `cancel`.

---

## 6. Determinism

As with Sprint 5, time and identity are injected (`Clock`, `IdGenerator`). The sequential id
generator makes identical operation sequences produce byte-identical cycles, outcomes, and event
streams — asserted by a `JSON.stringify` equality test.

---

## 7. Testing

| Suite                 | Coverage                                                                                                                                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `policy.test.ts` (11) | Policy validation; chain progression, quorum, short-circuits, escalation both behaviors                                                                                                                                                                          |
| `engine.test.ts` (8)  | Gate-state enforcement; anchor validation; **full loop** (comment → request-changes → transition + events + feedback → recompile revision); multi-level approval to `PROMPT_READY`; duplicate-reviewer guard; final-gate asymmetry; determinism; registry facade |

The integration tests drive the engine against a real Creative IR compiled by the Sprint 5
compiler from the Northwind example fixtures.

---

## 8. Non-implementation decisions

Sprint 6 did not implement:

- A review UI (backend engine only, per the sprint decision; a dashboard is future work)
- Notifications, email, or reviewer assignment/identity management (no auth exists yet)
- Database persistence (in-memory registry, consistent with Sprints 3–5)
- Compiler interpretation of feedback _content_ (feedback is recorded and threaded into
  revision history; acting on directives like "shorten scene 3" is deferred)
- Asset generation or QA execution (Sprints 7–10)

---

## 9. Entry criteria for Sprint 7

The Prompt Translation Engine can now assume: an approved Creative Package exists behind the
`PROMPT_READY` state, every approval that led there is recorded as canonical `Review` data, and
any rework loop passes structured feedback through recompilation with full revision history.

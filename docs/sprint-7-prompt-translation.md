# Sprint 7 — Prompt Translation Engine

**Status:** Complete
**Scope:** Translate an approved Creative IR into provider-neutral prompt packages for image,
video, and voiceover generation — the system's designated point of provider coupling, with a
dispatch seam but no live AI calls.

---

## 1. What Sprint 7 builds

Sprints 1–6 produce and approve a Creative Package. Sprint 7 turns the approved creative into the
_prompts_ that the generation engines will actually run: one ready-to-send `PromptRequest` per
required asset, assembled into a deterministic `PromptPackage`.

This is the point the architecture always earmarked for provider coupling. Sprint 7 defines that
seam but does not cross it: translation is pure and offline; a real provider (a diffusion API, a
TTS service) is addressed only through the `dispatch` seam, which defaults to an offline dry run.

```
   approved Creative IR
   (assetRequests + shot/scene specs)
            │
            ▼
   ┌─────────────────────────────────────────────┐
   │      StandardPromptTranslationEngine         │
   │  resolve asset → owning shot/scene/story     │
   │  route by asset type to a PromptTarget:      │
   │     image · video · voiceover(audio)         │
   └───────────────┬─────────────────────────────┘
                   ▼
        PromptPackage (deterministic)          ── prompt.generated events
        image / video / voiceover requests
                   │
                   ▼  (optional, explicit)
        dispatch seam → PromptProvider
        default: DryRunProvider (offline)  ── real provider plugs in here (Sprint 8+)
```

---

## 2. Package

`@creative-factory/prompt-translation` (new):

| Module                 | Responsibility                                                                    |
| ---------------------- | --------------------------------------------------------------------------------- |
| `types.ts`             | `PromptPackage`, `PromptRequest`, `PromptTargetKind`                              |
| `target.ts`            | `PromptTarget` interface + `ResolvedContext`; brand-control and negative helpers  |
| `targets/image.ts`     | Diffusion-style image prompt from a shot's visual spec                            |
| `targets/video.ts`     | Video prompt from a shot's motion + visual spec (handles `video`, `animation`)    |
| `targets/voiceover.ts` | Audio target: TTS prompt from the scene voiceover, music brief from the mood      |
| `engine.ts`            | `StandardPromptTranslationEngine`: resolve → route → assemble → events → dispatch |
| `provider.ts`          | Dispatch seam: `PromptProvider` + offline `DryRunProvider`                        |
| `adapter.ts`           | `StandardPromptTranslationAdapter` implementing the `prompt-translation` stub     |
| `support.ts`           | Deterministic hashing + injected `Clock`/`IdGenerator`                            |

---

## 3. Targets

Targets are pluggable and pure — registering a new one adds an asset kind without touching the
engine, the same principle as the Creative IR adapter registry.

- **Image** (`image.diffusion`): affirmative prompt from shot type, composition, lighting, color
  grade, subject, and environment; negative prompt from brand prohibitions; parameters include
  aspect ratio, dimensions, sampler settings, and a content-derived seed.
- **Video** (`video.generative`): the visual description plus explicit camera movement, easing,
  duration in frames, and frame rate.
- **Voiceover/audio** (`audio`): voiceover requests → TTS prompt (script, language, pacing,
  emotional tone); music-bed requests → music brief from the campaign mood. Both are the audio
  target, distinguished by `target` (`audio.voiceover` vs `audio.music`), so nothing is dropped.

Every request carries `brandControls` (primary/accent hex, font) and a `sourceHash` fingerprint
of the Creative IR nodes it derives from.

---

## 4. The provider seam

`PromptProvider` is the one interface in the whole system meant to touch a vendor. The default
`DryRunProvider` prepares the exact payload that _would_ be sent and returns it — deterministically,
with no network — so tests and CI stay hermetic. A future sprint supplies a live provider by
implementing `PromptProvider`; the engine, targets, and package format do not change.

Translation never calls the seam. `engine.dispatch(package)` is a separate, explicit step.

---

## 5. Creative IR adapter integration

`StandardPromptTranslationAdapter` implements the `PromptTranslationAdapter` interface that has
existed as a stub in `@creative-factory/creative-ir` since Sprint 2, so the engine plugs straight
into the Sprint 5 adapter registry and Creative Package flow, emitting a `prompt-package.json`
artifact. Its `processedAt` is taken from the IR's compile timestamp, keeping adapter output
deterministic.

---

## 6. Determinism

As with Sprints 5–6, time and identity are injected and ids/seeds derive from content (FNV-1a).
Identical Creative IR yields a byte-identical `PromptPackage` and event stream — unit-tested by
`JSON.stringify` equality.

---

## 7. Testing

`engine.test.ts` (10 tests), driven against a real Creative IR compiled from the Northwind
fixtures:

- Every asset request is translated (nothing silently dropped); unsupported types are reported as
  `unhandled`
- Correct routing by asset type; image/voiceover counts reconcile to the asset total
- Image prompt content, brand controls, seed, and negative prompt
- Voiceover vs music split within the audio target
- One `prompt.generated` event per request, hashes reconciled
- **Determinism** (byte-identical package across runs)
- Dispatch seam: offline dry-run prepares all payloads; unsupported target kinds are skipped
- The Creative IR adapter contract (validate + transform → `prompt-package.json`)

Build, lint, and test are green across the monorepo.

---

## 8. Non-implementation decisions

Sprint 7 did not implement:

- Live AI provider calls (the seam is defined and dry-run only, per the sprint decision); no API
  keys, network, or secrets are introduced
- Actual asset generation (Sprints 8–9) — this sprint produces prompts, not images/video/audio
- A vendor-specific prompt dialect beyond the neutral target formats (a real binding maps these to
  a concrete API at dispatch time)
- Persistence of prompt packages (returned in-memory / emitted as an adapter artifact)

---

## 9. Entry criteria for Sprint 8

The Image Generation Engine can now consume `PromptRequest`s of kind `image` — each a
self-contained, brand-controlled, seeded prompt tied to a shot and asset request — and implement a
concrete `PromptProvider` behind the existing dispatch seam to actually generate assets.

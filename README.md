# Creative Factory Monorepo

Enterprise AI Creative Factory — building the canonical model layer and provider-neutral architecture for autonomous creative production.

## Vision

**Creative Factory** is a modular, provider-neutral platform for generating broadcast-quality creative content at scale. Every creative artifact is represented as **Creative Intermediate Representation (Creative IR)** — a machine-readable, versioned contract that all engines consume and produce.

**Key Architecture Principle**: Business Brief → Creative IR → Production Outputs (never Business Brief → Prompts)

## Stack

| Layer           | Technology              |
| --------------- | ----------------------- |
| Package manager | pnpm workspaces         |
| Task runner     | Turborepo               |
| Web app         | Next.js 15 (App Router) |
| API             | FastAPI (Python 3.12)   |
| Linting         | ESLint 9 (flat config)  |
| Formatting      | Prettier                |
| JS testing      | Vitest                  |
| Python testing  | pytest                  |
| Containers      | Docker + Compose        |
| CI              | GitHub Actions          |

## Repository layout

```
creative-factory/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # FastAPI backend
├── packages/
│   ├── domain/              # Domain layer + brand types (typed IDs, entities, events, brands)
│   ├── contracts/           # API/event contracts
│   ├── creative-ir/         # Creative IR canonical model + compiler/adapter/validator interfaces
│   ├── creative-ir-compiler/# Deterministic Creative IR Compiler (nine planning stages)
│   ├── creative-ir-adapters/# Output adapters + Creative Package assembler
│   ├── review-engine/       # Human review cycles, approval chains, feedback loop
│   ├── prompt-translation/  # Creative IR → image/video/voiceover prompt packages
│   ├── image-generation/    # Synthetic image provider + generation write-back
│   ├── video-generation/    # Synthetic animated-video provider + generation write-back
│   ├── qa-engine/           # Brand-compliance QA over generated assets
│   ├── workflow-engine/     # Campaign lifecycle state machine
│   ├── brand-engine/        # Brand engine orchestrator (interfaces)
│   ├── brand-importers/     # Pluggable brand package importers (JSON, YAML, Markdown)
│   ├── brand-validator/     # Brand package validation
│   ├── brand-tokenizer/     # Brand profile → design tokens
│   ├── brand-registry/      # Brand profile storage & retrieval
│   ├── shared-kernel/       # Shared utilities
│   ├── env-config/          # Zod env validation (web)
│   ├── eslint-config/       # Shared ESLint config
│   ├── prettier-config/     # Shared Prettier config
│   └── tsconfig/            # Shared TypeScript configs
├── infra/                  # Infrastructure as Code
├── docs/
│   ├── creative-ir-specification.md   # Complete Creative IR specification
│   ├── creative-ir-schema.json        # JSON Schema for validation
│   ├── sprint-3-brand-engine.md       # Brand Engine architecture
│   ├── roadmap.md                     # Product roadmap
│   ├── examples/
│   │   └── brand-package-acme.yaml    # Example brand package
│   └── architecture/                  # Architecture decision records
├── .github/workflows/       # CI pipelines
├── docker-compose.yml
└── turbo.json
```

## Creative Intermediate Representation (Creative IR)

**Creative IR** is the canonical, machine-readable representation of every creative artifact. It is:

- **Single Source of Truth** between all engines
- **Automatically Generated** from Business Brief, Brand Package, Campaign Package, and Review Feedback
- **Never User-Edited** directly (marketing users work through UIs)
- **Provider-Neutral** (no AI provider coupling in the specification)
- **Versioned and Stable** for cross-engine integration

### Why Creative IR?

Without a canonical model, services either:

- ❌ Couple directly to provider APIs (GitHub Copilot, Claude, Midjourney, etc.)
- ❌ Develop proprietary internal models (incompatible, inefficient)
- ❌ Pass unstructured prompts between systems (lossy, non-deterministic)

Creative IR enables:

- ✅ Provider-neutral service architecture
- ✅ Deterministic, auditable creative production
- ✅ Easy addition of new adapters and output formats
- ✅ Consistent quality across all engines

### Phases

1. **Business Brief** → [Brand Engine] → Brand Config
2. **Campaign Context** → [Campaign Engine] → Creative Brief
3. **Creative Brief + Brand + Campaign** → **[Creative IR Compiler]** → **Creative IR** (canonical model)
4. **Creative IR** → [Output Adapters] → Production Artifacts:
   - Storyboard HTML
   - Scene Specifications
   - Prompt Packages (for Prompt Translation Engine)
   - Image Generation Requests
   - Video Generation Requests
   - QA Specifications
   - Export Packages

### Documentation

- [Creative IR Specification](docs/creative-ir-specification.md) — Full model definition and design principles
- [Creative IR JSON Schema](docs/creative-ir-schema.json) — Machine-readable validation schema
- [Sprint 2 Architecture](docs/architecture/sprint-2-domain-contracts-workflow.md) — Technical implementation details
- [Sprint 5 — Creative IR Compiler](docs/sprint-5-creative-ir-compiler.md) — Compiler stages, adapters, and the Creative Package
- [Sprint 6 — Review Engine](docs/sprint-6-review-engine.md) — Human gates, approval chains, and the feedback loop
- [Sprint 7 — Prompt Translation](docs/sprint-7-prompt-translation.md) — Prompt packages for image/video/voiceover and the provider seam
- [Sprint 8 — Image Generation](docs/sprint-8-image-generation.md) — Concrete provider, deterministic renderer, and asset write-back ([gallery](docs/examples/generated-images-northwind.html))
- [Sprint 9 — Video Generation](docs/sprint-9-video-generation.md) — Animated-SVG clips per shot, write-back and provenance ([gallery](docs/examples/generated-videos-northwind.html))
- [Sprint 10 — QA & Brand Compliance](docs/sprint-10-qa-engine.md) — Pluggable rules over real asset content, verdicts, and the review-gate recommendation
- Worked example: [`docs/examples/creative-ir-northwind.json`](docs/examples/creative-ir-northwind.json) → [`creative-package-northwind.json`](docs/examples/creative-package-northwind.json)

## Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.12+
- Docker (optional)

## Getting started

### 1. Install JavaScript dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

### 3. Run development servers

```bash
# All apps via Turborepo
pnpm dev

# Or individually
pnpm --filter @creative-factory/web dev
cd apps/api && pip install -e ".[dev]" && uvicorn creative_factory_api.main:app --reload
```

- Web: http://localhost:3000
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

### 4. Run tests

```bash
pnpm test
cd apps/api && pytest
```

### 5. Lint and format

```bash
pnpm lint
pnpm format
```

## Docker

```bash
# App services only
docker compose up --build

# With postgres + redis (dev profile)
docker compose -f docker-compose.dev.yml up --build
```

## Environment management

| File                    | Purpose                          |
| ----------------------- | -------------------------------- |
| `.env.example`          | Root reference for all variables |
| `apps/web/.env.example` | Next.js public/server env        |
| `apps/api/.env.example` | FastAPI pydantic-settings        |

Client-safe variables use the `NEXT_PUBLIC_` prefix. Secrets must never be committed.

## Shared packages

Build packages before consuming in apps (Turbo handles this in `pnpm build`):

```bash
pnpm --filter @creative-factory/shared-kernel build
```

Workspace imports use the `@creative-factory/*` scope.

## CI

GitHub Actions runs on push/PR to `main` and `develop`:

- **js**: install, lint, typecheck, test, build
- **python**: ruff, mypy, pytest
- **docker**: build API and web images (push only)

## License

UNLICENSED — private project scaffold.

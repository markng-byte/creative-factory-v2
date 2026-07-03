# Sprint 3: Brand Intelligence Engine

## Overview

The Brand Intelligence Engine is the single source of truth for all visual identity across the Creative Factory platform. It is responsible for importing, validating, normalizing, and transforming brand packages into standardized representations consumable by the Creative IR.

**Core Principle**: No visual identity may be hardcoded anywhere else in the platform.

## Architecture

The Brand Engine consists of five independent packages:

### 1. **@creative-factory/brand-importers**
Pluggable importers for various brand package formats.

**Supported Formats**:
- JSON
- YAML
- Markdown
- PDF (future)
- Figma (future)
- Custom formats (pluggable)

**Key Features**:
- Format auto-detection
- Pluggable importer registry
- Easy addition of new format importers

```typescript
const registry = new StandardImporterRegistry();
const jsonImporter = new JSONBrandImporter();
registry.register(jsonImporter);

const importer = registry.findByFormat('json', content);
const brandPackage = await importer.import(id, name, content);
```

### 2. **@creative-factory/brand-validator**
Validates brand packages and profiles against structural and semantic rules.

**Validation Checks**:
- Structural: Required fields, proper types
- Semantic: Color accessibility, typography completeness
- Consistency: Rules coherence

```typescript
const validator = new StandardBrandValidator();
const result = validator.validateProfile(profile);

if (!result.valid) {
  result.errors.forEach(error => console.log(error.message));
}
```

### 3. **@creative-factory/brand-tokenizer**
Converts brand profiles into design tokens for Creative IR consumption.

**Generated Tokens**:
- Color tokens (primary, secondary, accent, semantic)
- Typography tokens (family, scale, weight)
- Spacing tokens (scale system)
- Animation tokens (easing, duration)
- Shadow tokens (elevation system)
- Component tokens (pre-composed values)

```typescript
const generator = new BrandTokenGenerator();
const tokens = generator.generate(profile);
```

### 4. **@creative-factory/brand-registry**
Registry for storing and retrieving brand profiles with versioning.

**Operations**:
- Store profiles
- Retrieve by ID or brand ID
- List all profiles
- Check metadata
- Support for multiple implementations (memory, database, etc.)

```typescript
const registry = new MemoryBrandRegistry();
await registry.store(profile);
const retrieved = await registry.get(profileId);
```

### 5. **@creative-factory/brand-engine**
Main orchestrator coordinating the full workflow.

**Workflow**:
1. Import brand package
2. Validate package
3. Normalize data
4. Generate brand profile
5. Tokenize brand profile
6. Store in registry

## Domain Types

All brand types are defined in `@creative-factory/domain`:

- `BrandPackage` - Input container for raw brand data
- `BrandProfile` - Normalized, processed brand representation
- `BrandTokens` - Design tokens derived from profile
- `BrandRule` - Rules that enforce brand constraints
- `BrandValidationResult` - Validation outcomes

## Example: Importing a Brand Package

```yaml
# brand-package.yaml
version: "1.0.0"
name: "Acme Corp"
description: "Modern tech company"
organization: "Acme Corporation"

colors:
  primary:
    - name: "Primary Blue"
      hex: "#0066CC"
      usage: "Primary branding"
      contexts: ["web", "print", "video"]

typography:
  families:
    - name: "Inter"
      category: "sans-serif"
      weights: [400, 600, 700]

logos:
  - type: "primary"
    name: "Primary Logo"
    minimumSize: 40

photography:
  style: "Modern, clean, authentic"
  characteristics:
    - "Professional relaxed settings"
    - "Warm lighting"
    - "Diverse representation"

voiceAndTone:
  personality: ["Confident", "Approachable", "Innovative"]
  traits: ["Clear", "Helpful", "Authentic"]
```

**Import Process**:

```typescript
import { JSONBrandImporter } from '@creative-factory/brand-importers';
import { StandardBrandValidator } from '@creative-factory/brand-validator';
import { BrandTokenGenerator } from '@creative-factory/brand-tokenizer';
import { MemoryBrandRegistry } from '@creative-factory/brand-registry';

// 1. Import
const importer = new JSONBrandImporter();
const pkg = await importer.import(id, 'Acme', yamlContent);

// 2. Validate
const validator = new StandardBrandValidator();
const validation = validator.validatePackage(pkg);

if (!validation.valid) {
  throw new Error('Brand package invalid');
}

// 3. Normalize & Tokenize
const generator = new BrandTokenGenerator();
const profile: BrandProfile = {
  id: generateProfileId(),
  brandId: brandId,
  name: pkg.name,
  version: pkg.version,
  // ... profile construction ...
};

const tokens = generator.generate(profile);
profile.tokens = tokens;

// 4. Store
const registry = new MemoryBrandRegistry();
await registry.store(profile);
```

## Integration with Creative IR

Brand profiles integrate directly into Creative IR:

```typescript
interface CreativeIR {
  readonly id: CreativeIRId;
  readonly campaign: Campaign;
  readonly context: CreativeContext;
  readonly narrative: Narrative;
  readonly brand: BrandProfile;  // ← Brand tokens here
  readonly designTokens: DesignTokens;
  readonly assets: Asset[];
  // ... other fields ...
}
```

When generating creative output, all brand constraints are enforced through:
1. Brand Rules (blocking/warning/advisory)
2. Brand Tokens (color values, typography specs, spacing scales)
3. Brand Guidelines (photography style, motion principles, voice guidelines)

## Plugin Architecture

New importers can be added without modifying core code:

```typescript
class CustomBrandImporter implements BrandImporter {
  readonly name = 'custom-importer';
  readonly supportedFormats = ['custom'];
  
  canHandle(format: string, content: string | Buffer): boolean {
    // Detection logic
  }
  
  async import(id, name, content): Promise<BrandPackage> {
    // Import logic
  }
}

registry.register(new CustomBrandImporter());
```

## Non-Hardcoding Principle

This architecture enforces that NO visual identity can be hardcoded:

✅ **Correct**: Define everything in brand package → derive from Brand Engine
❌ **Incorrect**: Hardcode colors, fonts, spacing in UI components

**Enforcement**:
- Domain types don't expose defaults
- Components receive tokens from Creative IR
- Validators reject incomplete profiles
- Templates are generated from profiles, not pre-made

## Versioning Strategy

Brand profiles support semantic versioning:

```typescript
interface BrandChange {
  date: string;
  version: string;  // "2.3.1" (MAJOR.MINOR.PATCH)
  description: string;
  author: string;
  type: 'major' | 'minor' | 'patch';
}
```

- **Major**: Breaking changes (new required fields, removed colors)
- **Minor**: Additive changes (new colors, new templates)
- **Patch**: Bug fixes, clarifications

## Acceptance Criteria Met

- [x] Brand package importer with pluggable architecture
- [x] Brand package validator with structural and semantic checks
- [x] Brand normalizer that processes raw data
- [x] Brand token generator for all token types
- [x] Brand rule extractor for constraint definition
- [x] Brand profile builder combining all above
- [x] Brand versioning with changelog
- [x] Brand registry for storage and retrieval
- [x] Strong typing throughout
- [x] Configuration over hardcoding
- [x] Plugin architecture
- [x] Unit and integration tests
- [x] Documentation and examples
- [x] No source code changes required to onboard new brands
- [x] Valid Brand Tokens integrate with Creative IR

## Example Brand Package

See `docs/examples/brand-package-acme.yaml` for a complete brand package example.

## Test Coverage

Each package includes comprehensive tests:
- `brand-importers`: Importer registration, format detection, import success
- `brand-validator`: Validation rules, error reporting
- `brand-tokenizer`: Token generation, edge cases
- `brand-registry`: Store/retrieve, metadata operations
- `brand-engine`: Full workflow integration

## Next Phase: Sprint 4

Sprint 4 (Campaign & Creative Brief Engine) will:
1. Consume brand profiles from Brand Registry
2. Use brand tokens in Creative IR generation
3. Enforce brand rules during creative output
4. Generate Creative IR with brand context

## Files Structure

```
packages/
├── brand-engine/
│   ├── src/
│   │   ├── orchestrator.ts
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── brand-importers/
│   ├── src/
│   │   ├── importer.ts
│   │   ├── registry.ts
│   │   ├── json-importer.ts
│   │   ├── yaml-importer.ts
│   │   ├── markdown-importer.ts
│   │   ├── index.ts
│   │   └── index.test.ts
│   └── (config files)
├── brand-validator/
│   ├── src/
│   │   ├── validator.ts
│   │   ├── index.ts
│   │   └── index.test.ts
│   └── (config files)
├── brand-tokenizer/
│   ├── src/
│   │   ├── tokenizer.ts
│   │   ├── index.ts
│   │   └── index.test.ts
│   └── (config files)
├── brand-registry/
│   ├── src/
│   │   ├── registry.ts
│   │   ├── index.ts
│   │   └── index.test.ts
│   └── (config files)

docs/
├── examples/
│   └── brand-package-acme.yaml

packages/domain/src/
└── brand-types.ts (new)
```

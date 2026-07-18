/**
 * Prompt Translation adapter.
 *
 * Implements the `PromptTranslationAdapter` interface declared (as a stub) in
 * `@creative-factory/creative-ir`, so the Prompt Translation Engine plugs directly into the
 * Sprint 5 adapter registry and Creative Package flow. This is the adapter the architecture
 * always earmarked as "where provider coupling happens" — though here it still only *prepares*
 * prompts; dispatch stays behind the engine's seam.
 */

import type {
  AdapterCapability,
  AdapterOptions,
  AdapterOutput,
  AdapterValidationResult,
  CreativeIR,
  PromptTranslationAdapter,
} from '@creative-factory/creative-ir';
import { StandardPromptTranslationEngine } from './engine.js';
import { DeterministicIdGenerator, FixedClock, type Clock, type IdGenerator } from './support.js';

export class StandardPromptTranslationAdapter implements PromptTranslationAdapter {
  readonly name = 'prompt-translation' as const;
  readonly version = '1.0.0';
  readonly supportedOutputFormats = ['json'];
  readonly capabilities: AdapterCapability[] = [
    { feature: 'image-prompts', level: 'required' },
    { feature: 'video-prompts', level: 'required' },
    { feature: 'voiceover-prompts', level: 'optional' },
  ];

  async transform(creativeIR: CreativeIR, options: AdapterOptions): Promise<AdapterOutput> {
    // Deterministic clock/ids: the adapter output tracks the IR, not wall-clock time.
    const clock: Clock = new FixedClock(creativeIR.compilerMetadata.compileTimestamp);
    const ids: IdGenerator = new DeterministicIdGenerator('prompt-adapter');
    const engine = new StandardPromptTranslationEngine({ clock, ids });

    const { promptPackage, unhandled } = engine.translate(creativeIR);
    const content = JSON.stringify(promptPackage, null, 2);

    return {
      artifacts: [
        {
          name: 'prompt-package.json',
          format: 'json',
          content,
          mimeType: 'application/json',
          size: Buffer.byteLength(content, 'utf8'),
        },
      ],
      metadata: {
        adapterName: this.name,
        adapterVersion: this.version,
        processedAt: creativeIR.compilerMetadata.compileTimestamp,
        transformRules: ['image-target', 'video-target', 'voiceover-target'],
        customizations: { includeMetadata: options.includeMetadata },
      },
      warnings:
        unhandled.length > 0
          ? [`${unhandled.length} asset request(s) had no matching prompt target`]
          : [],
    };
  }

  validate(creativeIR: CreativeIR): AdapterValidationResult {
    if (creativeIR.assetRequests.length === 0) {
      return {
        isValid: false,
        errors: [
          {
            code: 'NO_ASSET_REQUESTS',
            message: 'Creative IR declares no asset requests to translate into prompts',
            severity: 'critical',
          },
        ],
        warnings: [],
      };
    }
    return { isValid: true, errors: [], warnings: [] };
  }
}

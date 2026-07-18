/**
 * Provider dispatch seam.
 *
 * This is the one place in the system where a real AI provider is finally addressed. Sprint 7
 * defines the seam but does not cross it: translation produces `PromptRequest`s only, and the
 * default `DryRunProvider` simply records what *would* be sent — deterministically, with no
 * network. A future sprint supplies a live provider (e.g. a diffusion or TTS API) by implementing
 * `PromptProvider`; nothing else in the engine changes.
 */

import type { PromptRequest, PromptTargetKind } from './types.js';

export interface DispatchResult {
  readonly requestId: string;
  readonly targetKind: PromptTargetKind;
  readonly provider: string;
  readonly status: 'prepared' | 'submitted' | 'skipped';
  /** For dry runs: the exact payload that would be sent, so it can be inspected/tested. */
  readonly preparedPayload: Readonly<Record<string, unknown>>;
}

export interface PromptProvider {
  readonly name: string;
  supports(targetKind: PromptTargetKind): boolean;
  dispatch(request: PromptRequest): Promise<DispatchResult>;
}

/**
 * The default provider: prepares the payload but sends nothing. Deterministic and offline — safe
 * to run in tests and CI. Proves the seam without coupling to any vendor.
 */
export class DryRunProvider implements PromptProvider {
  readonly name = 'dry-run';

  supports(): boolean {
    return true;
  }

  async dispatch(request: PromptRequest): Promise<DispatchResult> {
    return {
      requestId: request.id,
      targetKind: request.targetKind,
      provider: this.name,
      status: 'prepared',
      preparedPayload: {
        target: request.target,
        prompt: request.prompt,
        negativePrompt: request.negativePrompt,
        parameters: request.parameters,
        brandControls: request.brandControls,
      },
    };
  }
}

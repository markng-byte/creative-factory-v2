/**
 * Prompt target adapters.
 *
 * A `PromptTarget` translates one resolved asset request into a `PromptRequest` for a specific
 * asset kind. Targets are pluggable: registering a new one adds a new asset kind without
 * touching the engine, mirroring the Creative IR adapter registry pattern.
 *
 * Targets are pure: they read the resolved Creative IR context and emit a request. They never
 * contact a provider — that happens only through the dispatch seam.
 */

import type {
  AssetRequest,
  AssetType,
  BrandTokens,
  CreativeContext,
  Scene,
  Shot,
  Story,
} from '@creative-factory/creative-ir';
import type { IdGenerator } from './support.js';
import type { PromptRequest, PromptTargetKind } from './types.js';

/** Everything a target needs to translate a single asset request. */
export interface ResolvedContext {
  readonly creativeIRId: string;
  readonly assetRequest: AssetRequest;
  readonly shot?: Shot;
  readonly scene?: Scene;
  readonly story?: Story;
  readonly brandTokens: BrandTokens;
  readonly creativeContext: CreativeContext;
  readonly ids: IdGenerator;
}

export interface PromptTarget {
  readonly kind: PromptTargetKind;
  readonly name: string;
  handles(assetType: AssetType, context: ResolvedContext): boolean;
  translate(context: ResolvedContext): PromptRequest | undefined;
}

/** Brand controls surfaced on every prompt so a provider binding can enforce them. */
export function brandControls(brand: BrandTokens): Record<string, string> {
  const primary = brand.primaryColors[0]?.hex ?? '#000000';
  const accent = brand.accentColors[0]?.hex ?? primary;
  const font = brand.typography[0]?.fontFamily ?? 'sans-serif';
  return {
    brandName: brand.brandName,
    primaryColor: primary,
    accentColor: accent,
    fontFamily: font,
  };
}

/** Negative-prompt terms lifted from brand guidelines and prohibited visuals. */
export function negativeTerms(context: ResolvedContext): string[] {
  const terms = new Set<string>();
  for (const element of context.creativeContext.brandGuidelines.prohibitedElements) {
    terms.add(element);
  }
  for (const prohibited of context.brandTokens.prohibitedElements) {
    terms.add(prohibited.description);
  }
  return [...terms].sort();
}

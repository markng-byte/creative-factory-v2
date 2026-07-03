/**
 * Brand Engine Package
 *
 * Orchestrates the import, validation, normalization, and tokenization of brand packages.
 */

export const BRAND_ENGINE_PACKAGE = '@creative-factory/brand-engine' as const;
export const BRAND_ENGINE_VERSION = '1.0.0' as const;

export * from './orchestrator.js';

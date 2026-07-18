/**
 * @creative-factory/asset-library
 *
 * Asset Library & Versioning (Sprint 11). Ingests QA-approved assets from a Creative IR into a
 * content-addressed library: each approved asset output becomes an immutable, content-hashed
 * version of a logical asset (keyed by its request), with deduplication, cross-campaign reuse
 * detection, and version lineage. Library references are recorded back onto the Creative IR, and
 * an `asset.cataloged` event is emitted per ingested output. Deterministic; no AI provider.
 *
 * @packageDocumentation
 */

export const ASSET_LIBRARY_PACKAGE = '@creative-factory/asset-library' as const;

// Librarian
export {
  StandardAssetLibrarian,
  ASSET_LIBRARY_VERSION,
  type AssetLibrarianDependencies,
  type IngestResult,
} from './librarian.js';

// Library store
export { InMemoryAssetLibrary, type AssetLibrary, type ContentIndexEntry } from './library.js';

// Model
export type {
  IngestReport,
  LibraryAsset,
  LibraryAssetId,
  LibraryAssetVersion,
  LibraryRef,
  LibraryVersionId,
} from './types.js';

// Support
export {
  DeterministicIdGenerator,
  FixedClock,
  SystemClock,
  contentHash,
  fnv1a,
  type Clock,
  type IdGenerator,
} from './support.js';

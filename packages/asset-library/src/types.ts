/**
 * Asset Library model.
 *
 * A `LibraryAsset` is a logical asset (one per Creative IR asset request) whose regenerations are
 * captured as an ordered chain of immutable `LibraryAssetVersion`s. Versions are content-addressed:
 * ingesting identical bytes deduplicates to the existing version rather than creating a new one,
 * and the same content appearing in another campaign is recognized as a reuse. Everything here is
 * plain, serializable data.
 */

import type { Provenance } from '@creative-factory/creative-ir';

export type LibraryAssetId = string & { readonly __brand: 'LibraryAssetId' };
export type LibraryVersionId = string & { readonly __brand: 'LibraryVersionId' };

export interface LibraryAssetVersion {
  readonly versionId: LibraryVersionId;
  readonly version: number;
  readonly contentHash: string;
  readonly assetOutputId: string;
  readonly requestId: string;
  readonly format: string;
  readonly url: string;
  readonly provenance: Provenance;
  readonly ingestedAt: string;
  /** Set when this content already existed (dedup / cross-campaign reuse). */
  readonly reusedFrom?: LibraryVersionId;
}

export interface LibraryAsset {
  readonly id: LibraryAssetId;
  /** The logical key that groups versions — the Creative IR asset request id. */
  readonly logicalKey: string;
  readonly campaignId: string;
  readonly assetType: string;
  readonly tags: readonly string[];
  readonly versions: readonly LibraryAssetVersion[];
  readonly latestVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** The reference recorded back onto the Creative IR for a single ingested asset output. */
export interface LibraryRef {
  readonly assetOutputId: string;
  readonly libraryAssetId: LibraryAssetId;
  readonly versionId: LibraryVersionId;
  readonly version: number;
  readonly contentHash: string;
  readonly deduped: boolean;
}

export interface IngestReport {
  readonly campaignId: string;
  readonly creativeIRId: string;
  readonly ingestedAt: string;
  /** Approved outputs considered for ingest. */
  readonly considered: number;
  /** New versions created. */
  readonly created: number;
  /** Outputs whose content already existed (deduped). */
  readonly deduped: number;
  /** Approved requests skipped (no delivered assets). */
  readonly skipped: number;
  readonly refs: readonly LibraryRef[];
}

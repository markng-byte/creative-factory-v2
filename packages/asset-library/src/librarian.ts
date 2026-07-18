/**
 * Standard Asset Librarian.
 *
 * Ingests the QA-approved assets of a Creative IR into a content-addressed library: each approved
 * asset output becomes an immutable, content-hashed version of a logical asset (keyed by its asset
 * request). Re-ingesting identical content deduplicates instead of creating a new version, and
 * content already present — even from another campaign — is recognized as a reuse. The librarian
 * records a library reference back onto each request in a returned updated Creative IR and emits an
 * `asset.cataloged` event per ingested output.
 *
 * Deterministic: injected clock/id ports and content-derived ids make ingest reproducible.
 */

import type { AssetOutput, AssetRequest, CreativeIR } from '@creative-factory/creative-ir';
import type { AssetCatalogedContract } from '@creative-factory/contracts';
import { InMemoryAssetLibrary, type AssetLibrary } from './library.js';
import {
  DeterministicIdGenerator,
  SystemClock,
  contentHash,
  type Clock,
  type IdGenerator,
} from './support.js';
import type {
  IngestReport,
  LibraryAsset,
  LibraryAssetId,
  LibraryAssetVersion,
  LibraryRef,
  LibraryVersionId,
} from './types.js';

export const ASSET_LIBRARY_VERSION = '1.0.0' as const;

export interface AssetLibrarianDependencies {
  readonly library?: AssetLibrary;
  readonly clock?: Clock;
  readonly ids?: IdGenerator;
}

export interface IngestResult {
  readonly creativeIR: CreativeIR;
  readonly report: IngestReport;
  readonly events: readonly AssetCatalogedContract[];
  readonly library: AssetLibrary;
}

export class StandardAssetLibrarian {
  private readonly library: AssetLibrary;
  private readonly clock: Clock;
  private readonly ids: IdGenerator;

  constructor(deps: AssetLibrarianDependencies = {}) {
    this.library = deps.library ?? new InMemoryAssetLibrary();
    this.clock = deps.clock ?? new SystemClock();
    this.ids = deps.ids ?? new DeterministicIdGenerator();
  }

  ingest(creativeIR: CreativeIR): IngestResult {
    const campaignId = creativeIR.campaign.id;
    const brandId = creativeIR.brandTokens.brandId;
    const ingestedAt = this.clock.now();

    const refs: LibraryRef[] = [];
    const events: AssetCatalogedContract[] = [];
    const refsByRequest = new Map<string, LibraryRef[]>();
    let considered = 0;
    let created = 0;
    let deduped = 0;
    let skipped = 0;

    for (const request of creativeIR.assetRequests) {
      if (request.qaStatus !== 'approved') {
        continue;
      }
      if (request.deliveredAssets.length === 0) {
        skipped += 1;
        continue;
      }
      const logicalKey = String(request.id);
      for (const output of request.deliveredAssets) {
        considered += 1;
        const ref = this.ingestOutput(request, output, logicalKey, campaignId, brandId, ingestedAt);
        refs.push(ref);
        refsByRequest.set(logicalKey, [...(refsByRequest.get(logicalKey) ?? []), ref]);
        if (ref.deduped) {
          deduped += 1;
        } else {
          created += 1;
        }
        events.push(this.event(campaignId, ref, ingestedAt));
      }
    }

    const report: IngestReport = {
      campaignId,
      creativeIRId: String(creativeIR.id),
      ingestedAt,
      considered,
      created,
      deduped,
      skipped,
      refs,
    };

    return {
      creativeIR: writeBack(creativeIR, refsByRequest, ingestedAt),
      report,
      events,
      library: this.library,
    };
  }

  private ingestOutput(
    request: AssetRequest,
    output: AssetOutput,
    logicalKey: string,
    campaignId: string,
    brandId: string,
    ingestedAt: string,
  ): LibraryRef {
    const hash = contentHash(output.url);
    const globalExisting = this.library.findByContentHash(hash);
    const existingAsset = this.library.findByLogicalKey(logicalKey);

    // Exact re-ingest of the current latest content → deduplicate, no new version.
    if (existingAsset) {
      const latest = existingAsset.versions[existingAsset.versions.length - 1];
      if (latest && latest.contentHash === hash) {
        return this.ref(output, existingAsset.id, latest.versionId, latest.version, hash, true);
      }
    }

    const isReuse = globalExisting !== undefined;
    const version = existingAsset ? existingAsset.latestVersion + 1 : 1;
    const versionId = this.ids.generate('libver', logicalKey, version, hash) as LibraryVersionId;
    const newVersion: LibraryAssetVersion = {
      versionId,
      version,
      contentHash: hash,
      assetOutputId: output.id,
      requestId: logicalKey,
      format: output.format,
      url: output.url,
      provenance: output.provenance,
      ingestedAt,
      reusedFrom: globalExisting?.versionId,
    };

    let assetId: LibraryAssetId;
    if (existingAsset) {
      assetId = existingAsset.id;
      this.library.save({
        ...existingAsset,
        versions: [...existingAsset.versions, newVersion],
        latestVersion: version,
        updatedAt: ingestedAt,
      });
    } else {
      assetId = this.ids.generate('libasset', logicalKey) as LibraryAssetId;
      const asset: LibraryAsset = {
        id: assetId,
        logicalKey,
        campaignId,
        assetType: request.assetType,
        tags: [request.assetType, `campaign:${campaignId}`, `brand:${brandId}`],
        versions: [newVersion],
        latestVersion: version,
        createdAt: ingestedAt,
        updatedAt: ingestedAt,
      };
      this.library.save(asset);
    }

    this.library.indexContent(hash, { libraryAssetId: assetId, versionId });
    return this.ref(output, assetId, versionId, version, hash, isReuse);
  }

  private ref(
    output: AssetOutput,
    libraryAssetId: LibraryAssetId,
    versionId: LibraryVersionId,
    version: number,
    hash: string,
    deduped: boolean,
  ): LibraryRef {
    return {
      assetOutputId: output.id,
      libraryAssetId,
      versionId,
      version,
      contentHash: hash,
      deduped,
    };
  }

  private event(campaignId: string, ref: LibraryRef, occurredAt: string): AssetCatalogedContract {
    return {
      id: this.ids.generate('evt', ref.versionId, ref.assetOutputId),
      name: 'asset.cataloged',
      version: 1,
      occurredAt,
      aggregateId: campaignId,
      correlationId: String(ref.libraryAssetId),
      payload: {
        campaignId,
        libraryAssetId: String(ref.libraryAssetId),
        versionId: String(ref.versionId),
        version: ref.version,
        contentHash: ref.contentHash,
        deduped: ref.deduped,
      },
    };
  }
}

function writeBack(
  creativeIR: CreativeIR,
  refsByRequest: ReadonlyMap<string, LibraryRef[]>,
  updatedAt: string,
): CreativeIR {
  if (refsByRequest.size === 0) {
    return creativeIR;
  }
  const assetRequests: AssetRequest[] = creativeIR.assetRequests.map((request) => {
    const refs = refsByRequest.get(String(request.id));
    if (!refs) {
      return request;
    }
    return {
      ...request,
      metadata: {
        ...request.metadata,
        library: refs.map((ref) => ({
          assetOutputId: ref.assetOutputId,
          libraryAssetId: String(ref.libraryAssetId),
          versionId: String(ref.versionId),
          version: ref.version,
          contentHash: ref.contentHash,
          deduped: ref.deduped,
        })),
      },
    };
  });
  return { ...creativeIR, assetRequests, updatedAt };
}

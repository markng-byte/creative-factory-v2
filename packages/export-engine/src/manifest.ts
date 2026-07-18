/**
 * Manifest & bundle assembly.
 *
 * Walks the approved, catalogued assets of a Creative IR into a flat manifest, carrying each
 * asset's content hash, provenance, and library reference (from the Sprint 11 link-back). Entries
 * are grouped into per-aspect-ratio channel bundles.
 */

import type { AssetOutput, AssetRequest, CreativeIR } from '@creative-factory/creative-ir';
import { aspectRatioOf, contentHash } from './support.js';
import type { ChannelBundle, ExportManifest, ManifestEntry } from './types.js';

interface LibraryRefLike {
  readonly assetOutputId?: unknown;
  readonly libraryAssetId?: unknown;
  readonly version?: unknown;
  readonly contentHash?: unknown;
}

export function buildManifest(creativeIR: CreativeIR): ExportManifest {
  const entries: ManifestEntry[] = [];
  const byType: Record<string, number> = {};

  for (const request of creativeIR.assetRequests) {
    if (request.qaStatus !== 'approved' || request.deliveredAssets.length === 0) {
      continue;
    }
    const libraryRefs = readLibraryRefs(request);
    for (const output of request.deliveredAssets) {
      const ref = libraryRefs.get(output.id);
      entries.push(toEntry(request, output, ref));
      byType[request.assetType] = (byType[request.assetType] ?? 0) + 1;
    }
  }

  return { totalAssets: entries.length, byType, entries };
}

export function buildBundles(manifest: ExportManifest): ChannelBundle[] {
  const byAspect = new Map<string, ManifestEntry[]>();
  for (const entry of manifest.entries) {
    byAspect.set(entry.aspectRatio, [...(byAspect.get(entry.aspectRatio) ?? []), entry]);
  }
  return [...byAspect.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([aspectRatio, entries]) => ({
      bundleId: `bundle-${aspectRatio.replace(':', 'x')}`,
      channel: aspectRatio,
      aspectRatio,
      entries,
    }));
}

function toEntry(
  request: AssetRequest,
  output: AssetOutput,
  ref: LibraryRefLike | undefined,
): ManifestEntry {
  const aspectRatio = aspectRatioOf(output.metadata.width, output.metadata.height);
  return {
    assetRequestId: String(request.id),
    assetType: request.assetType,
    shotId: String(request.shotId),
    format: output.format,
    aspectRatio,
    url: output.url,
    contentHash: typeof ref?.contentHash === 'string' ? ref.contentHash : contentHash(output.url),
    libraryAssetId: typeof ref?.libraryAssetId === 'string' ? ref.libraryAssetId : undefined,
    version: typeof ref?.version === 'number' ? ref.version : undefined,
    sourceEngine: output.provenance.sourceEngine,
  };
}

function readLibraryRefs(request: AssetRequest): Map<string, LibraryRefLike> {
  const map = new Map<string, LibraryRefLike>();
  const refs = request.metadata['library'];
  if (Array.isArray(refs)) {
    for (const raw of refs) {
      const ref = raw as LibraryRefLike;
      if (typeof ref.assetOutputId === 'string') {
        map.set(ref.assetOutputId, ref);
      }
    }
  }
  return map;
}

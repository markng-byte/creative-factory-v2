/**
 * Asset library store.
 *
 * In-memory storage for logical assets plus a content-hash index that powers deduplication and
 * cross-campaign reuse. A real implementation (object store + database) satisfies the same
 * interface.
 */

import type { LibraryAsset, LibraryAssetId, LibraryVersionId } from './types.js';

export interface ContentIndexEntry {
  readonly libraryAssetId: LibraryAssetId;
  readonly versionId: LibraryVersionId;
}

export interface AssetLibrary {
  save(asset: LibraryAsset): void;
  getAsset(id: LibraryAssetId): LibraryAsset | undefined;
  findByLogicalKey(logicalKey: string): LibraryAsset | undefined;
  findByContentHash(contentHash: string): ContentIndexEntry | undefined;
  indexContent(contentHash: string, entry: ContentIndexEntry): void;
  list(): LibraryAsset[];
}

export class InMemoryAssetLibrary implements AssetLibrary {
  private readonly assets = new Map<string, LibraryAsset>();
  private readonly byLogicalKey = new Map<string, string>();
  private readonly byContent = new Map<string, ContentIndexEntry>();

  save(asset: LibraryAsset): void {
    this.assets.set(String(asset.id), asset);
    this.byLogicalKey.set(asset.logicalKey, String(asset.id));
  }

  getAsset(id: LibraryAssetId): LibraryAsset | undefined {
    return this.assets.get(String(id));
  }

  findByLogicalKey(logicalKey: string): LibraryAsset | undefined {
    const id = this.byLogicalKey.get(logicalKey);
    return id ? this.assets.get(id) : undefined;
  }

  findByContentHash(contentHash: string): ContentIndexEntry | undefined {
    return this.byContent.get(contentHash);
  }

  indexContent(contentHash: string, entry: ContentIndexEntry): void {
    if (!this.byContent.has(contentHash)) {
      this.byContent.set(contentHash, entry);
    }
  }

  list(): LibraryAsset[] {
    return [...this.assets.values()].sort((a, b) => a.logicalKey.localeCompare(b.logicalKey));
  }
}

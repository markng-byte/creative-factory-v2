/**
 * Asset store.
 *
 * Holds the rendered image bytes (as data URIs) keyed by AssetOutput id, so generated assets can
 * be retrieved and viewed. In-memory, matching the registry pattern used across the monorepo; a
 * real object store implements the same interface.
 */

export interface StoredAsset {
  readonly assetOutputId: string;
  readonly contentType: string;
  readonly dataUri: string;
}

export interface AssetStore {
  put(asset: StoredAsset): void;
  get(assetOutputId: string): StoredAsset | undefined;
  list(): StoredAsset[];
}

export class InMemoryAssetStore implements AssetStore {
  private readonly assets = new Map<string, StoredAsset>();

  put(asset: StoredAsset): void {
    this.assets.set(asset.assetOutputId, asset);
  }

  get(assetOutputId: string): StoredAsset | undefined {
    return this.assets.get(assetOutputId);
  }

  list(): StoredAsset[] {
    return [...this.assets.values()].sort((a, b) => a.assetOutputId.localeCompare(b.assetOutputId));
  }
}

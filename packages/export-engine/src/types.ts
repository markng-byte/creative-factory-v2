/**
 * Export model.
 *
 * The engine assembles an `ExportPackage` from the approved, catalogued assets of a Creative IR: a
 * `ExportManifest` (every deliverable asset with content hash + provenance + library reference),
 * per-aspect-ratio `ChannelBundle`s, and viewable `ExportDeliverable`s (a finished campaign page
 * and the manifest). Bundles are published through the dispatch seam. Everything here is plain,
 * serializable data.
 */

export interface ManifestEntry {
  readonly assetRequestId: string;
  readonly assetType: string;
  readonly shotId?: string;
  readonly sceneId?: string;
  readonly format: string;
  readonly aspectRatio: string;
  readonly url: string;
  readonly contentHash: string;
  readonly libraryAssetId?: string;
  readonly version?: number;
  readonly sourceEngine: string;
}

export interface ExportManifest {
  readonly totalAssets: number;
  readonly byType: Readonly<Record<string, number>>;
  readonly entries: readonly ManifestEntry[];
}

export interface ChannelBundle {
  readonly bundleId: string;
  readonly channel: string;
  readonly aspectRatio: string;
  readonly entries: readonly ManifestEntry[];
}

export interface ExportDeliverable {
  readonly name: string;
  readonly format: string;
  readonly mimeType: string;
  readonly size: number;
  readonly content: string;
}

export interface PublishResult {
  readonly bundleId: string;
  readonly channel: string;
  readonly target: string;
  readonly status: 'published' | 'skipped';
  readonly location: string;
}

export interface ExportPackage {
  readonly packageId: string;
  readonly packageVersion: string;
  readonly campaignId: string;
  readonly creativeIRId: string;
  readonly generatedAt: string;
  readonly engineVersion: string;
  readonly manifest: ExportManifest;
  readonly bundles: readonly ChannelBundle[];
  readonly deliverables: readonly ExportDeliverable[];
  readonly published: readonly PublishResult[];
}

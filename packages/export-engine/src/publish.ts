/**
 * Publish dispatch seam.
 *
 * Publishing to a real channel is the one place the export engine would touch an external service.
 * Sprint 12 defines the seam but does not cross it: the default `DryRunPublishTarget` records where
 * each bundle *would* be published — deterministically, offline. A real channel integration (a CDN,
 * an ad platform, a CMS) implements `PublishTarget` to swap in; nothing else changes.
 */

import type { ChannelBundle, PublishResult } from './types.js';

export interface PublishTarget {
  readonly name: string;
  supports(channel: string): boolean;
  publish(bundle: ChannelBundle, campaignId: string): Promise<PublishResult>;
}

export const DRY_RUN_TARGET_NAME = 'dry-run' as const;

export class DryRunPublishTarget implements PublishTarget {
  readonly name = DRY_RUN_TARGET_NAME;

  supports(): boolean {
    return true;
  }

  async publish(bundle: ChannelBundle, campaignId: string): Promise<PublishResult> {
    return {
      bundleId: bundle.bundleId,
      channel: bundle.channel,
      target: this.name,
      status: 'published',
      location: `dryrun://${campaignId}/${bundle.channel}/${bundle.bundleId}`,
    };
  }
}

import { describe, expect, it } from 'vitest';
import {
  CONTRACTS_PACKAGE,
  EVENT_CONTRACT_NAMES,
  type CampaignLifecycleTransitionedContract,
  type HealthResponse,
} from './index.js';

describe('contracts package', () => {
  it('keeps health response compatibility from Sprint 1', () => {
    const health: HealthResponse = {
      status: 'ok',
      service: 'api',
      version: '0.0.0',
    };

    expect(CONTRACTS_PACKAGE).toBe('@creative-factory/contracts');
    expect(health.status).toBe('ok');
  });

  it('defines versioned event envelope contracts', () => {
    const event: CampaignLifecycleTransitionedContract = {
      id: 'event-1',
      name: 'campaign.lifecycle.transitioned',
      version: 1,
      occurredAt: '2026-01-01T00:00:00.000Z',
      aggregateId: 'campaign-1',
      payload: {
        campaignId: 'campaign-1',
        from: 'DRAFT',
        to: 'BRIEF_READY',
        reason: 'Brief submitted',
      },
    };

    expect(event.payload.to).toBe('BRIEF_READY');
    expect(EVENT_CONTRACT_NAMES).toContain('review.completed');
  });
});

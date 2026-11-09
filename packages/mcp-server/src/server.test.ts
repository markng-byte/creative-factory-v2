import { describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  InMemoryBrandTokensSource,
  InMemoryCampaignSource,
  InMemoryCreativeBriefSource,
  exampleBrandBundle,
  exampleCampaign,
  exampleCreativeBrief,
} from '@creative-factory/creative-ir-compiler';
import { SvgImageProvider } from '@creative-factory/image-generation';
import type { PromptProvider, PromptRequest } from '@creative-factory/prompt-translation';
import { createCreativeFactoryMcpServer, type StoredRun } from './server.js';

class PaidImageProvider implements PromptProvider {
  readonly name = 'paid-image-api';
  readonly calls: string[] = [];
  private readonly inner = new SvgImageProvider();
  supports(kind: Parameters<PromptProvider['supports']>[0]) {
    return this.inner.supports(kind);
  }
  async dispatch(request: PromptRequest) {
    this.calls.push(request.id);
    return { ...(await this.inner.dispatch(request)), provider: this.name };
  }
}

async function connect(imageProvider?: PromptProvider) {
  const brand = exampleBrandBundle();
  const store = new Map<string, StoredRun>();
  const server = createCreativeFactoryMcpServer({
    briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
    campaigns: new InMemoryCampaignSource([exampleCampaign()]),
    brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
    defaults: {
      briefId: exampleCreativeBrief().id,
      campaignId: exampleCampaign().id,
      brandId: brand.brandTokens.brandId,
    },
    store,
    imageProvider,
  });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  const client = new Client({ name: 'growth-test', version: '0' });
  await client.connect(b);
  const call = async (name: string, args: Record<string, unknown>) => {
    const r = await client.callTool({ name, arguments: args });
    const text = (r.content as { text: string }[])[0]!.text;
    let body: Record<string, any>;
    try {
      body = JSON.parse(text) as Record<string, any>;
    } catch {
      body = { raw: text }; // SDK input-validation errors are plain text
    }
    return { isError: r.isError === true, body };
  };
  return { call, store };
}

describe('creative-factory MCP server', () => {
  it('compiles a Creative IR into STORYBOARD_REVIEW and returns the storyboard (Growth contract)', async () => {
    const { call, store } = await connect();
    const r = await call('compile_creative_ir', {
      hook_id: 'H1',
      hook_text: 'Hong Kong company in 2 days.',
      jurisdiction: 'Hong Kong',
      validation_mode: 'STRICT',
    });
    expect(r.isError).toBe(false);
    expect(typeof r.body.creative_ir_id).toBe('string');
    expect(r.body.storyboard.scenes.length).toBeGreaterThan(0);
    expect(store.get(r.body.creative_ir_id)?.ir.campaign.lifecycleState).toBe('STORYBOARD_REVIEW');
  });

  it('analyzes a stored IR read-only (step 7) and refuses an unknown id', async () => {
    const { call } = await connect();
    const { body } = await call('compile_creative_ir', { hook_id: 'H1', hook_text: 'x' });
    await call('run_creative_pipeline', {
      creative_ir_id: body.creative_ir_id,
      steps: ['translate', 'generate', 'qa'],
      approved_by: 'mark',
    });
    const r = await call('analyze_campaign', { creative_ir_id: body.creative_ir_id });
    expect(r.isError).toBe(false);
    expect(r.body.assets.generated).toBe(26);
    expect(r.body.quality).toMatchObject({ assessed: 26, passed: 26, failed: 0, pass_rate: 1 });
    expect(Array.isArray(r.body.recommendations)).toBe(true);
    expect((await call('analyze_campaign', { creative_ir_id: 'nope' })).isError).toBe(true);
  });

  it('runs translate, generate, qa only with approved_by; returns qa_status and assets (Growth contract)', async () => {
    const { call, store } = await connect();
    const { body } = await call('compile_creative_ir', { hook_id: 'H1', hook_text: 'x' });
    const refused = await call('run_creative_pipeline', {
      creative_ir_id: body.creative_ir_id,
      steps: ['translate', 'generate', 'qa'],
    });
    expect(refused.isError).toBe(true);
    const ran = await call('run_creative_pipeline', {
      creative_ir_id: body.creative_ir_id,
      steps: ['translate', 'generate', 'qa'],
      validation_mode: 'STRICT',
      approved_by: 'mark',
    });
    expect(ran.isError).toBe(false);
    expect(['PASS', 'FAIL', 'NEEDS_REVIEW']).toContain(ran.body.qa_status);
    expect(ran.body.assets.some((x: { kind: string }) => x.kind === 'image')).toBe(true);
    expect(ran.body.assets.some((x: { kind: string }) => x.kind === 'video')).toBe(true);
    expect(store.get(body.creative_ir_id)?.approvedBy).toBe('mark');
  });

  it('a paid provider is called only after approval moved the IR to PROMPT_READY', async () => {
    const paid = new PaidImageProvider();
    const { call } = await connect(paid);
    const { body } = await call('compile_creative_ir', { hook_id: 'H1', hook_text: 'x' });
    expect(paid.calls).toEqual([]);
    await call('run_creative_pipeline', {
      creative_ir_id: body.creative_ir_id,
      steps: ['generate'],
      approved_by: 'mark',
    });
    expect(paid.calls.length).toBeGreaterThan(0);
  });

  it('validate_brand_qa and export_channel_bundle; export is dry run and needs a passing QA', async () => {
    const { call } = await connect();
    expect((await call('export_channel_bundle', { creative_ir_id: 'nope' })).body.error_code).toBe(
      'IR_NOT_FOUND',
    );
    const { body } = await call('compile_creative_ir', { hook_id: 'H1', hook_text: 'x' });
    expect(
      (await call('export_channel_bundle', { creative_ir_id: body.creative_ir_id })).body
        .error_code,
    ).toBe('QA_NOT_PASSED');
    await call('run_creative_pipeline', {
      creative_ir_id: body.creative_ir_id,
      steps: ['generate'],
      approved_by: 'mark',
    });
    const qa = await call('validate_brand_qa', { creative_ir_id: body.creative_ir_id });
    expect(qa.body.assessed).toBeGreaterThan(0);
    const exported = await call('export_channel_bundle', { creative_ir_id: body.creative_ir_id });
    if (qa.body.qa_status === 'PASS') {
      expect(exported.body.published).toBe(false);
      expect(exported.body.bundles.length).toBeGreaterThan(0);
    } else {
      expect(exported.body.error_code).toBe('QA_NOT_PASSED');
    }
  });
});

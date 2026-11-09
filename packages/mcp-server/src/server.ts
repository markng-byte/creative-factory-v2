/**
 * Creative Factory MCP server.
 *
 * Exposes the pipeline as the four tools the One IBC Growth Workspace calls (spec sections 7, 9):
 *
 *   compile_creative_ir    Brief + campaign + brand -> Creative IR; the campaign is put in
 *                          STORYBOARD_REVIEW and the storyboard is returned for human review.
 *   run_creative_pipeline  translate -> generate (image + video) -> qa. Requires `approved_by`,
 *                          the person who approved the storyboard in Growth; only then does the IR
 *                          move to PROMPT_READY, so the generation engines' storyboard gate opens.
 *   validate_brand_qa      Brand-compliance QA on the stored IR.
 *   export_channel_bundle  Catalogue, then channel bundles via the dry-run publish target only: preparing a bundle
 *                          never publishes anything (publishing always needs a human).
 *   analyze_campaign       Step 7: read-only analytics report and heuristic recommendations for a stored IR.
 *
 * Compiled IRs live in an injected store (in memory by default) between calls.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  ValidationMode,
  type CampaignLifecycleState,
  type CreativeIR,
} from '@creative-factory/creative-ir';
import {
  StandardCreativeIRCompiler,
  type BrandTokensSource,
  type CampaignSource,
  type CreativeBriefSource,
} from '@creative-factory/creative-ir-compiler';
import {
  StandardPromptTranslationEngine,
  type PromptProvider,
} from '@creative-factory/prompt-translation';
import { StandardImageGenerationEngine } from '@creative-factory/image-generation';
import { StandardVideoGenerationEngine } from '@creative-factory/video-generation';
import { StandardQaEngine, type QaReport } from '@creative-factory/qa-engine';
import { DryRunPublishTarget, StandardExportEngine } from '@creative-factory/export-engine';
import { InMemoryAssetLibrary, StandardAssetLibrarian } from '@creative-factory/asset-library';
import { StandardAnalyticsEngine } from '@creative-factory/analytics-engine';

export interface StoredRun {
  readonly hookId: string;
  readonly hookText: string;
  readonly jurisdiction: string | null;
  ir: CreativeIR;
  approvedBy?: string;
  qa?: QaReport;
}

export interface CreativeFactoryMcpDeps {
  readonly briefs: CreativeBriefSource;
  readonly campaigns: CampaignSource;
  readonly brands: BrandTokensSource;
  /** Used when a call does not name a brief, campaign or brand. */
  readonly defaults: {
    readonly briefId: string;
    readonly campaignId: string;
    readonly brandId: string;
  };
  readonly store?: Map<string, StoredRun>;
  /** Paid providers plug in here; the engines' storyboard gate holds them until approval. */
  readonly imageProvider?: PromptProvider;
  readonly videoProvider?: PromptProvider;
}

const ok = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value) }],
});
const fail = (code: string) => ({
  content: [{ type: 'text' as const, text: JSON.stringify({ error_code: code }) }],
  isError: true,
});
const withState = (ir: CreativeIR, lifecycleState: CampaignLifecycleState): CreativeIR => ({
  ...ir,
  campaign: { ...ir.campaign, lifecycleState },
});
const mode = (m?: string) =>
  m === 'PERMISSIVE' ? ValidationMode.PERMISSIVE : ValidationMode.STRICT;

export function createCreativeFactoryMcpServer(deps: CreativeFactoryMcpDeps): McpServer {
  const store = deps.store ?? new Map<string, StoredRun>();
  const server = new McpServer({ name: 'creative-factory', version: '0.1.0' });

  server.registerTool(
    'compile_creative_ir',
    {
      description:
        'Compile a Creative IR for a hook and return its storyboard for human review. Nothing is generated.',
      inputSchema: {
        hook_id: z.string().min(1).max(64),
        hook_text: z.string().min(1).max(500),
        jurisdiction: z.string().max(64).nullish(),
        validation_mode: z.enum(['STRICT', 'PERMISSIVE']).optional(),
        brief_id: z.string().max(128).optional(),
        campaign_id: z.string().max(128).optional(),
        brand_id: z.string().max(128).optional(),
      },
    },
    async (a) => {
      try {
        const compiler = new StandardCreativeIRCompiler({
          briefs: deps.briefs,
          campaigns: deps.campaigns,
          brands: deps.brands,
        });
        const { creativeIR } = await compiler.compile({
          creativeBriefId: a.brief_id ?? deps.defaults.briefId,
          campaignId: a.campaign_id ?? deps.defaults.campaignId,
          brandId: a.brand_id ?? deps.defaults.brandId,
          validationMode: mode(a.validation_mode),
        });
        const ir = withState(creativeIR, 'STORYBOARD_REVIEW');
        store.set(ir.id, {
          hookId: a.hook_id,
          hookText: a.hook_text,
          jurisdiction: a.jurisdiction ?? null,
          ir,
        });
        const board = ir.stories[0]?.storyboards[0];
        return ok({
          creative_ir_id: ir.id,
          storyboard: {
            title: board?.title ?? a.hook_text,
            scenes: (board?.scenes ?? []).map((s) =>
              `${s.title}: ${s.narrativeText}`.slice(0, 300),
            ),
          },
        });
      } catch {
        return fail('COMPILE_FAILED');
      }
    },
  );

  server.registerTool(
    'run_creative_pipeline',
    {
      description:
        'After a human approved the storyboard: translate, generate image and video, QA. Requires approved_by.',
      inputSchema: {
        creative_ir_id: z.string().min(1),
        steps: z.array(z.enum(['translate', 'generate', 'qa'])).min(1),
        validation_mode: z.enum(['STRICT', 'PERMISSIVE']).optional(),
        approved_by: z.string().min(1).max(120),
      },
    },
    async (a) => {
      const run = store.get(a.creative_ir_id);
      if (!run) return fail('IR_NOT_FOUND');
      try {
        run.approvedBy = a.approved_by;
        let ir = withState(run.ir, 'PROMPT_READY');
        const assets: { asset_id: string; kind: 'image' | 'video' }[] = [];
        if (a.steps.includes('translate')) new StandardPromptTranslationEngine().translate(ir);
        if (a.steps.includes('generate')) {
          const images = await new StandardImageGenerationEngine({
            provider: deps.imageProvider,
          }).generate(ir);
          const videos = await new StandardVideoGenerationEngine({
            provider: deps.videoProvider,
          }).generate(images.creativeIR);
          assets.push(
            ...images.outputs.map((o) => ({ asset_id: o.id, kind: 'image' as const })),
            ...videos.outputs.map((o) => ({ asset_id: o.id, kind: 'video' as const })),
          );
          ir = videos.creativeIR;
        }
        let qaStatus: string | null = null;
        if (a.steps.includes('qa')) {
          const qa = new StandardQaEngine().run(ir);
          run.qa = qa.report;
          ir = qa.creativeIR;
          qaStatus = qa.report.overall;
        }
        run.ir = ir;
        return ok({
          run_id: `${a.creative_ir_id}:${store.size}:${assets.length}`,
          qa_status: qaStatus ?? 'NOT_RUN',
          assets,
        });
      } catch (e) {
        return fail((e as { code?: string }).code ?? 'PIPELINE_FAILED');
      }
    },
  );

  server.registerTool(
    'validate_brand_qa',
    {
      description: 'Brand-compliance QA on a stored Creative IR.',
      inputSchema: { creative_ir_id: z.string().min(1) },
    },
    async (a) => {
      const run = store.get(a.creative_ir_id);
      if (!run) return fail('IR_NOT_FOUND');
      const qa = new StandardQaEngine().run(run.ir);
      run.qa = qa.report;
      run.ir = qa.creativeIR; // QA writes asset qaStatus back; export only bundles approved assets
      return ok({
        qa_status: qa.report.overall,
        assessed: qa.report.assessed,
        passed: qa.report.passed,
        failed: qa.report.failed,
        skipped: qa.report.skipped,
      });
    },
  );

  server.registerTool(
    'export_channel_bundle',
    {
      description:
        'Prepare channel bundles for a QA-passed Creative IR. Dry run only: nothing is published.',
      inputSchema: { creative_ir_id: z.string().min(1), channel: z.string().max(64).optional() },
    },
    async (a) => {
      const run = store.get(a.creative_ir_id);
      if (!run) return fail('IR_NOT_FOUND');
      if (run.qa?.overall !== 'PASS') return fail('QA_NOT_PASSED');
      // Same order as the standard pipeline: catalogue the QA'd assets, then export.
      const cataloged = new StandardAssetLibrarian({ library: new InMemoryAssetLibrary() }).ingest(
        run.ir,
      );
      const exported = await new StandardExportEngine({ target: new DryRunPublishTarget() }).export(
        cataloged.creativeIR,
        { lifecycleState: 'FINAL_APPROVAL' },
      );
      const bundles = exported.exportPackage.bundles.filter(
        (b) => !a.channel || b.channel === a.channel,
      );
      return ok({
        package_id: exported.exportPackage.packageId,
        published: false,
        bundles: bundles.map((b) => ({
          bundle_id: b.bundleId,
          channel: b.channel,
          aspect_ratio: b.aspectRatio,
          entries: b.entries.length,
        })),
      });
    },
  );

  server.registerTool(
    'analyze_campaign',
    {
      description:
        'Step 7: analytics report and deterministic recommendations for a stored Creative IR. Read only.',
      inputSchema: { creative_ir_id: z.string().min(1) },
    },
    async (a) => {
      const run = store.get(a.creative_ir_id);
      if (!run) return fail('IR_NOT_FOUND');
      const { report, recommendations } = new StandardAnalyticsEngine().analyze(run.ir);
      return ok({
        report_id: report.reportId,
        assets: {
          total: report.assets.total,
          generated: report.assets.generated,
          approved: report.assets.approved,
          rejected: report.assets.rejected,
          pending: report.assets.pending,
        },
        quality: {
          assessed: report.quality.assessed,
          passed: report.quality.passed,
          failed: report.quality.failed,
          pass_rate: report.quality.passRate,
        },
        recommendations: recommendations.map((r) => ({
          severity: r.severity,
          category: r.category,
          message: r.message,
        })),
      });
    },
  );

  return server;
}

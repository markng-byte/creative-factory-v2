/**
 * HTTP entry point (MCP Streamable HTTP, stateless). Compiled IRs are kept in one in-process store
 * shared across requests. Environment:
 *   PORT (default 8787), CF_MCP_TOKEN (optional Bearer token; set it whenever the port is reachable),
 *   CF_DEFAULT_BRIEF_ID, CF_DEFAULT_CAMPAIGN_ID, CF_DEFAULT_BRAND_ID.
 * Sources default to the worked example; production wiring swaps in plugin / Google Sheets sources.
 */

import { createServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  InMemoryBrandTokensSource,
  InMemoryCampaignSource,
  InMemoryCreativeBriefSource,
  exampleBrandBundle,
  exampleCampaign,
  exampleCreativeBrief,
} from '@creative-factory/creative-ir-compiler';
import { createCreativeFactoryMcpServer, type StoredRun } from './server.js';

const brand = exampleBrandBundle();
const store = new Map<string, StoredRun>();
const deps = {
  briefs: new InMemoryCreativeBriefSource([exampleCreativeBrief()]),
  campaigns: new InMemoryCampaignSource([exampleCampaign()]),
  brands: new InMemoryBrandTokensSource(new Map([[brand.brandTokens.brandId, brand]])),
  defaults: {
    briefId: process.env['CF_DEFAULT_BRIEF_ID'] ?? exampleCreativeBrief().id,
    campaignId: process.env['CF_DEFAULT_CAMPAIGN_ID'] ?? exampleCampaign().id,
    brandId: process.env['CF_DEFAULT_BRAND_ID'] ?? brand.brandTokens.brandId,
  },
  store,
};
const token = process.env['CF_MCP_TOKEN'];

createServer(async (req, res) => {
  if (token && req.headers.authorization !== `Bearer ${token}`) {
    res.writeHead(401).end();
    return;
  }
  const server = createCreativeFactoryMcpServer(deps);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res);
}).listen(Number(process.env['PORT'] ?? 8787), '127.0.0.1');

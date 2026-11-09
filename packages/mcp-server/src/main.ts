/**
 * HTTP entry point (MCP Streamable HTTP, stateless). Compiled IRs are kept in one in-process store
 * shared across requests. Environment:
 *   PORT (default 8787), CF_MCP_TOKEN (optional Bearer token; set it whenever the port is reachable),
 *   sources: see sources.ts (CF_BRANDS_DIR, CF_SHEET_ID + tab gids, CF_DEFAULT_*_ID); unset means the
 *   worked example.
 */

import { createServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { buildSources } from './sources.js';
import { createCreativeFactoryMcpServer, type StoredRun } from './server.js';

const store = new Map<string, StoredRun>();
const deps = { ...buildSources(process.env), store };
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

# @creative-factory/mcp-server

MCP server (Streamable HTTP) exposing the pipeline to the One IBC Growth Workspace as four tools. Contract: `growth-workspace/docs/context/hop-dong-mcp.md`.

| Tool                    | Does                                                    | Notes                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compile_creative_ir`   | Compile a Creative IR for a hook; return the storyboard | Campaign set to `STORYBOARD_REVIEW`; nothing generated                                                                                                     |
| `run_creative_pipeline` | translate, generate (image + video), qa                 | Requires `approved_by` (who approved the storyboard in Growth); only then the IR moves to `PROMPT_READY` and the generation engines' storyboard gate opens |
| `validate_brand_qa`     | Brand-compliance QA on the stored IR                    | Writes asset QA status back                                                                                                                                |
| `export_channel_bundle` | Catalogue, then channel bundles                         | Dry-run publish target only; needs QA `PASS`; never publishes                                                                                              |

Run: `pnpm --filter @creative-factory/mcp-server build && PORT=8787 CF_MCP_TOKEN=... node packages/mcp-server/dist/main.js`. Listens on 127.0.0.1. Set `CF_MCP_TOKEN` whenever the port is reachable by anything else; Growth sends it as `Authorization: Bearer` (`CREATIVE_MCP_TOKEN`).

Sources default to the worked example. Production wiring swaps in the brand plugins (`FileSystemBrandTokensSource`) and Google Sheets sources once those PRs are merged; `CF_DEFAULT_BRIEF_ID`, `CF_DEFAULT_CAMPAIGN_ID`, `CF_DEFAULT_BRAND_ID` choose the defaults. Compiled IRs are kept in memory; a restart drops them (Growth keeps its own copy of the storyboard and decisions).

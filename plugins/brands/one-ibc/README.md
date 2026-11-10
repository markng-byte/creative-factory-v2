# Brand plugin: One IBC (Offshore Company Corp)

Source: One IBC Growth Workspace spec v0.3.2, section 7 ("checked in code, $0 token").

- `brand.json`: a `BrandTokensBundle` loaded by `FileSystemBrandTokensSource` (brandId `brand-one-ibc`).
- `rules.json`: copy limits and colour share used by QA: Hook + first sentence under 125 characters, headline at most 40, description at most 30; background `#F0F0F2`; red `#8B0000` about 10%.

Provisional (not in the spec, confirm with Team Content): the ink colour `#1B1B1B`, the `Inter` typeface, the logo set (empty for now). The banned word list in `voiceAndTone.doNotUse` mirrors the spec's proposed list and is provisional until Mark confirms it; the brand name "Offshore Company Corp" itself is exempt from the word "offshore".

## Profile `CF_PROFILE=one-ibc`

Start the MCP server with `CF_PROFILE=one-ibc` to use this plugin plus a provisional One IBC brief and campaign (`packages/mcp-server/src/one-ibc.ts`) as defaults, instead of the Northwind worked example:

- Call to action: "Nhắn One IBC qua WhatsApp", never with a real phone number (Team MKT adds the WhatsApp number when publishing).
- Copy limits and colours from the spec are written into the brief as blocking constraints.
- Labelled "Tạm" (provisional, not in the spec): tone of voice, audience, logo (none yet).
- The hook from Growth Workspace becomes the core message (see `hook-brief.ts`).

Replace the provisional brief and campaign by entering the real ones in the Google Sheet (`CF_SHEET_ID`, `CF_BRIEFS_GID`, `CF_CAMPAIGNS_GID`) and pointing `CF_DEFAULT_BRIEF_ID`, `CF_DEFAULT_CAMPAIGN_ID` at them. No code change needed.

Known gap: the narrative stage's connective phrases ("Setup: We open in the audience's world") are English templates in code; the brief content inside them is Vietnamese.

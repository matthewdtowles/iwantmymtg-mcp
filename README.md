# iwantmymtg-mcp

[![npm version](https://img.shields.io/npm/v/iwantmymtg-mcp)](https://www.npmjs.com/package/iwantmymtg-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![smithery badge](https://smithery.ai/badge/matthewdtowles/iwantmymtg-mcp)](https://smithery.ai/servers/matthewdtowles/iwantmymtg-mcp)

An [MCP](https://modelcontextprotocol.io) server for [I Want My MTG](https://iwantmymtg.net). Exposes IWMM's API as tools so Claude Desktop, Claude Code, Cursor, and other MCP clients can search Magic: The Gathering cards/sets and manage a user's collection conversationally.

> Status: v0 scaffold. The set of tools below is the v1 surface; coverage will expand to match the API.

![Demo: Claude Code answering four collection queries via the iwmm MCP server](assets/four-queries-demo.gif)

## What you can do

- **Anonymous (no key):** search cards, look up a card by set+number, get current prices and 30-day price history, list sets and their cards, list sealed products.
- **Authenticated (with an IWMM API key):** list and update your inventory.

More authenticated tools (transactions, portfolio breakdowns, price alerts, notifications) are coming - see the [project roadmap](https://github.com/matthewdtowles/i-want-my-mtg/blob/main/ROADMAP.md#43-mcp-server--agentic-ai-integration).

## Install

Requires Node 20+.

```bash
npx iwantmymtg-mcp
```

Or install globally if you prefer:

```bash
npm install -g iwantmymtg-mcp
iwantmymtg-mcp
```

## Claude Desktop

Add to `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`; Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "iwmm": {
      "command": "npx",
      "args": ["-y", "iwantmymtg-mcp"],
      "env": {
        "IWMM_API_KEY": "iwm_live_..."
      }
    }
  }
}
```

`IWMM_API_KEY` is optional - read-only tools work without it. Create a key at https://iwantmymtg.net/user/api-keys.

## Claude Code

Add to `.mcp.json` in your project (or `~/.claude/.mcp.json` globally):

```json
{
  "mcpServers": {
    "iwmm": {
      "command": "npx",
      "args": ["-y", "iwantmymtg-mcp"],
      "env": { "IWMM_API_KEY": "iwm_live_..." }
    }
  }
}
```

## Cursor

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "iwmm": {
      "command": "npx",
      "args": ["-y", "iwantmymtg-mcp"],
      "env": { "IWMM_API_KEY": "iwm_live_..." }
    }
  }
}
```

After saving, restart Cursor and confirm `iwmm` appears under **Settings -> Features -> MCP Servers**.

## Example prompts

- "Search for Lightning Bolt printings and show me the cheapest one."
- "What's the price history of Bloodbraid Elf from Modern Horizons 3?"
- "Add 4 copies of Lightning Bolt LEA to my inventory."
- "What sealed products are available for MH3?"

See [`examples/`](https://github.com/matthewdtowles/iwantmymtg-mcp/tree/main/examples) for walkthroughs of common flows (card lookup, inventory, transactions, portfolio insights, price alerts).

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `IWMM_API_KEY` | _(unset)_ | Personal API key. Required only for authenticated tools. |
| `IWMM_BASE_URL` | `https://iwantmymtg.net` | Override for self-hosted or local-dev IWMM instances. |

## Local development

```bash
npm install
npm run build
node dist/index.js
```

Or with `tsx` for live reload:

```bash
npm install
npx tsx src/index.ts
```

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

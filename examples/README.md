# Examples

Example flows for using `iwantmymtg-mcp` from an MCP client (Claude Desktop, Claude Code, Cursor). Each file describes one common use case: what to type, which tools fire, and what to expect back.

Screenshots and full conversation transcripts will be added as we capture them. Until then, these read like a manual test checklist - useful both as a demo and as a smoke test after upgrading.

## Flows

- [Card lookup and pricing](./card-lookup.md) - search, get current price, see 30-day history. **No API key required.**
- [Inventory management](./inventory.md) - add cards, list what you own, adjust quantities, remove cards.
- [Transactions and cost basis](./transactions.md) - record buys/sells, see cost basis per card.
- [Portfolio insights](./portfolio.md) - summary, history, breakdowns. *Most endpoints are Premium-gated.*
- [Price alerts](./price-alerts.md) - create an alert, manage existing alerts.
- [Sealed products](./sealed-products.md) - browse boosters/bundles/precons by set.
- [Selling and buy-lists](./sell-and-buy-list.md) - buylist offers, market sell value, want-list, cash-vs-credit.

For the full, always-current list of every tool, see [`docs/TOOLS.md`](../docs/TOOLS.md).

## Conventions

- Lines starting with `>` are what you type to the LLM.
- `[tool: foo]` notes the MCP tool the LLM should pick. The LLM may chain several tools to answer one prompt.
- Premium-gated tools return an upgrade message via `ApiError` when called without an active subscription; the LLM should relay that message verbatim.

# Transactions and cost basis

Requires `IWMM_API_KEY`.

## Record a buy

> I bought 4 Lightning Bolt LEA for $1200 each on 2026-04-15. Log that.

`[tool: record_transaction]` with `type: "buy"`, quantity, unit price, and date.

## Record a sell

> I sold 2 of my Force of Will EMA for $80 each yesterday.

`[tool: record_transaction]` with `type: "sell"`.

## List transactions

> Show me everything I've bought or sold this year.

`[tool: list_transactions]` with date filters.

## Cost basis

> What's my average cost on Lightning Bolt LEA?

`[tool: get_cost_basis]` for the specific card.

# Portfolio insights

Requires `IWMM_API_KEY`. **Most endpoints in this section require an active Premium subscription** - non-subscribers will see an upgrade prompt instead of data. The summary endpoint is free.

## Summary (free)

> What's my collection worth?

`[tool: get_portfolio_summary]`. Returns total value, card count, and basic stats. Available to all users.

## History (Premium)

> Show me how my portfolio value has changed over the last 90 days.

`[tool: get_portfolio_history]`. Premium-gated; free users get an upgrade message.

## Breakdown (Premium)

> Break down my collection by set.

`[tool: get_portfolio_breakdown]` with `by: "set"`. Also supports `by: "rarity"` and `by: "type"`.

## Cash flow (Premium)

> How much have I spent vs. sold each month this year?

`[tool: get_cash_flow]`.

## Realized gains (Premium)

> What are my realized gains so far this year?

`[tool: get_realized_gains]`.

## Card performance (Premium)

> Which of my cards have appreciated the most?

`[tool: get_card_performance]`.

## Force a refresh

> Recalculate my portfolio now.

`[tool: refresh_portfolio]`. Useful after bulk imports.

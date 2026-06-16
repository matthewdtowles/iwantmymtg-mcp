# Card lookup and pricing

No API key required for any of this.

## Search and identify a printing

> Find all printings of Lightning Bolt and tell me which is the cheapest right now.

`[tool: search_cards]` -> `[tool: get_card_prices]` per result. The LLM should sort by `normal` price and surface the set + collector number alongside the price.

## Get a specific card

> Look up Bloodbraid Elf from Modern Horizons 3, slot 230.

`[tool: get_card]` with `setCode: "MH3"`, `number: "230"`.

## Price history

> Show me how Force of Will from Eternal Masters has moved over the last 30 days.

`[tool: get_card_price_history]`. Note: history is daily for the last 7 days, then weekly out to 28 days, then monthly beyond - so older points are sparser.

## Set price history

> How has the value of Modern Horizons 3 moved over the last 90 days?

`[tool: get_set_price_history]` with `code: "MH3"` and optional `days`. This is the set's aggregate value over time; for one card use `get_card_price_history`.

## Sealed products in a set

> What sealed products are available for Modern Horizons 3?

`[tool: get_sealed_products]` with `setCode: "MH3"`. Returns boosters, bundles, precons with current pricing.

> Show me the detail and price for that collector booster box.

`[tool: get_sealed_product]` with the product's `uuid` (from the list above).

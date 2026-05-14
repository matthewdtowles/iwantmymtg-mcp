# Sealed products

No API key required for browsing. Adding sealed product to your inventory is Premium-gated.

## Browse by set

> What sealed products exist for Lord of the Rings: Tales of Middle-earth?

`[tool: get_sealed_products]` with `setCode: "LTR"`. Returns boosters, bundles, collector boosters, precons.

## Compare set sealed pricing

> Which Modern Horizons set has the cheapest collector booster box right now?

`[tool: search_sets]` to enumerate MH printings, then `[tool: get_sealed_products]` per set, filter to collector booster boxes, sort by price.

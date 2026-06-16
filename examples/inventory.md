# Inventory management

Requires `IWMM_API_KEY`. Create one at https://iwantmymtg.net/user/api-keys.

## Add cards

> Add 4 copies of Lightning Bolt from Alpha (LEA) to my inventory.

`[tool: add_inventory]` with the card UUID. The LLM may call `[tool: search_cards]` first to resolve the UUID.

## List what you own

> What Modern Horizons 3 cards do I have?

`[tool: list_inventory]` with a set filter. Paginate if the result set is large.

## Adjust quantities

> Bump my Lightning Bolt LEA quantity to 6.

`[tool: update_inventory]`. Alternatively `[tool: get_inventory_quantities]` first to confirm the current count.

## Remove cards

> Remove my Bloodbraid Elf MH3 230 from inventory.

`[tool: remove_inventory]`.

## Import / export a CSV

> Import my collection from this CSV: <pasted text>

`[tool: import_inventory_cards]`. Native header is `name,set_code,number[,quantity][,foil]`; Moxfield, Archidekt, Deckbox, and TCGPlayer exports are auto-detected. Returns saved/deleted/skipped counts and per-row errors.

> Export my whole inventory as CSV.

`[tool: export_inventory]`. The output reimports cleanly via `import_inventory_cards`.

## Sealed products (boxes, bundles, precons)

Sealed inventory is tracked separately from loose cards, keyed by sealed product UUID (get one from `[tool: get_sealed_products]` for a set, or `[tool: get_sealed_product]` for detail).

> How many sealed MH3 collector boxes do I own?

`[tool: list_sealed_inventory]`.

> Set my MH3 collector booster box count to 2.

`[tool: set_sealed_inventory]` with the product UUID and `quantity: 2` (it sets the absolute quantity). Adding and updating both go through this tool. **Writes are Premium-gated.** Remove a product with `[tool: remove_sealed_inventory]`.

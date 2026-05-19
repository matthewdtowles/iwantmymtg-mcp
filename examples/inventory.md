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

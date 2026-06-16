# Selling and buy-lists

Buylist (sell-to-vendor) pricing, what your collection is worth to sell, a
want-list, and a cash-vs-store-credit recommendation.

Only the first flow works without a key. The rest require `IWMM_API_KEY` —
create one at https://iwantmymtg.net/user/api-keys.

## What does a vendor pay for a card?

> What's the best buylist offer on Ragavan from Modern Horizons 2?

`[tool: get_card_buylist]` with `setCode: "MH2"`, `setNumber: "138"`. Offers are
grouped by finish (normal/foil/etched), best first, with the top offer per finish
marked. **No API key required.** This is sell-to-vendor pricing; for retail (buy)
prices use `[tool: get_card_prices]`.

## What's my collection worth to sell?

> What's my whole collection worth if I sold it to a vendor right now, and who pays most?

`[tool: get_market_sell_value]`. Matches every owned card against current buylist
offers, picks the best per item (capped by the vendor's buy quantity), groups by
vendor, and totals it.

## Manage a buy-list (want-list)

> Add 2 foil Ragavan MH2 to my buy list.

`[tool: add_buy_list]` with the card UUID (the LLM resolves it via
`[tool: search_cards]` first). `add_buy_list` increments; use
`[tool: update_buy_list]` to set an absolute quantity (0 removes the row) and
`[tool: remove_buy_list]` to delete one.

> What's on my buy list?

`[tool: list_buy_list]`.

> Import my want-list from this Moxfield CSV: <pasted text>

`[tool: import_buy_list]`. The native header is `name,set_code,number[,quantity][,foil]`;
Moxfield, Archidekt, Deckbox, and TCGPlayer exports are auto-detected.

## Cash or store credit?

> If I sell toward my buy list, am I better off taking cash or store credit?

`[tool: get_cash_vs_credit]`. Compares the cash payout for your inventory against
taking store credit (worth a bonus %, default +30%) and spending it on your buy
list. Pass a `bonus` fraction to model a different store (e.g. `0.5` for +50%).
Returns the recommendation, the credit advantage, out-of-pocket each way, and the
priced buy-list lines.

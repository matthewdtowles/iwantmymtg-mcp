import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { tools, toolsByName } from "../src/tools/index.js";

type FetchCall = { url: string; init: RequestInit };

// Valid UUIDs for schemas that validate cardId with z.string().uuid().
const CARD_ID = "00000000-0000-0000-0000-0000000000aa";
const CARD_ID_2 = "00000000-0000-0000-0000-0000000000bb";

let calls: FetchCall[];
const originalFetch = globalThis.fetch;

async function captureFetch(input: RequestInfo | URL, init?: RequestInit): Promise<FetchCall> {
  // openapi-fetch passes a single Request; the body lives on the Request itself.
  if (input instanceof Request) {
    const body = input.body ? await input.clone().text() : undefined;
    return {
      url: input.url,
      init: { method: input.method, headers: input.headers, body },
    };
  }
  return { url: String(input), init: init ?? {} };
}

function setup() {
  calls = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(await captureFetch(input, init));
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  process.env.IWMM_API_KEY = "iwm_live_test";
  delete process.env.IWMM_BASE_URL;
}

beforeEach(setup);
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.IWMM_API_KEY;
});

async function call(name: string, input: unknown) {
  const tool = toolsByName[name];
  assert.ok(tool, `tool ${name} not registered`);
  // Parse through the schema like the server does, so defaults, coercions,
  // and refinements are exercised and handlers see production-shaped input.
  await tool.handler(tool.inputSchema.parse(input));
  assert.equal(calls.length, 1, `${name} should make exactly one HTTP call`);
  return {
    url: new URL(calls[0].url),
    method: calls[0].init.method ?? "GET",
    headers: new Headers(calls[0].init.headers),
    body: calls[0].init.body,
  };
}

describe("tool registry", () => {
  it("registers each tool under a unique name", () => {
    const names = tools.map((t) => t.name);
    assert.equal(new Set(names).size, names.length, "duplicate tool names");
    assert.equal(tools.length, Object.keys(toolsByName).length);
  });

  it("every tool has a non-empty description and zod input schema", () => {
    for (const t of tools) {
      assert.ok(t.name, `tool missing name`);
      assert.ok(t.description && t.description.length > 10, `${t.name}: description too short`);
      assert.ok(t.inputSchema, `${t.name}: no inputSchema`);
      assert.equal(typeof t.handler, "function", `${t.name}: handler is not a function`);
    }
  });

  // The auto-generated docs/TOOLS.md buckets tools by whether the description
  // ends with "Requires IWMM_API_KEY". Keep that signal trustworthy: a tool
  // declares the requirement iff it is not in this read-only set. A new
  // authenticated tool that forgets the phrase (or puts it mid-description, or
  // a new read-only tool) trips this test.
  it("authenticated tools declare the API-key requirement in their description", () => {
    const readOnly = new Set([
      "search_cards",
      "get_card",
      "get_card_prices",
      "get_card_price_history",
      "search_sets",
      "get_set",
      "list_set_cards",
      "get_sealed_products",
      "get_sealed_product",
      "get_set_price_history",
      "get_card_buylist",
    ]);
    for (const t of tools) {
      const declares = /Requires IWMM_API_KEY\.?\s*$/i.test(t.description);
      assert.equal(
        declares,
        !readOnly.has(t.name),
        `${t.name}: description ${declares ? "declares" : "omits"} the API-key requirement, ` +
          `but it is ${readOnly.has(t.name) ? "read-only" : "authenticated"}`,
      );
    }
  });
});

describe("read-only tools", () => {
  it("search_cards: GET /api/v1/cards with query params, no auth", async () => {
    const r = await call("search_cards", { q: "bolt", rarity: "rare", limit: 5 });
    assert.equal(r.url.pathname, "/api/v1/cards");
    assert.equal(r.url.searchParams.get("q"), "bolt");
    assert.equal(r.url.searchParams.get("rarity"), "rare");
    assert.equal(r.url.searchParams.get("limit"), "5");
    assert.equal(r.headers.has("Authorization"), false);
  });

  it("get_card: GET /api/v1/cards/{setCode}/{number}", async () => {
    const r = await call("get_card", { setCode: "lea", setNumber: "161" });
    assert.equal(r.url.pathname, "/api/v1/cards/lea/161");
    assert.equal(r.method, "GET");
  });

  it("get_card_prices: appends /prices to the card path", async () => {
    const r = await call("get_card_prices", { setCode: "mh3", setNumber: "12a" });
    assert.equal(r.url.pathname, "/api/v1/cards/mh3/12a/prices");
  });

  it("get_card_price_history: appends /price-history", async () => {
    const r = await call("get_card_price_history", { setCode: "lea", setNumber: "161" });
    assert.equal(r.url.pathname, "/api/v1/cards/lea/161/price-history");
  });

  it("search_sets: GET /api/v1/sets", async () => {
    const r = await call("search_sets", { page: 2, limit: 25 });
    assert.equal(r.url.pathname, "/api/v1/sets");
    assert.equal(r.url.searchParams.get("page"), "2");
    assert.equal(r.url.searchParams.get("limit"), "25");
  });

  it("get_set: GET /api/v1/sets/{code}", async () => {
    const r = await call("get_set", { code: "mh3" });
    assert.equal(r.url.pathname, "/api/v1/sets/mh3");
  });

  it("list_set_cards: GET /api/v1/sets/{code}/cards, code not in query", async () => {
    const r = await call("list_set_cards", { code: "mh3", rarity: "mythic", limit: 20 });
    assert.equal(r.url.pathname, "/api/v1/sets/mh3/cards");
    assert.equal(r.url.searchParams.has("code"), false);
    assert.equal(r.url.searchParams.get("rarity"), "mythic");
  });

  it("get_sealed_products: GET /api/v1/sets/{code}/sealed-products", async () => {
    const r = await call("get_sealed_products", { code: "mh3" });
    assert.equal(r.url.pathname, "/api/v1/sets/mh3/sealed-products");
  });
});

describe("inventory tools", () => {
  it("list_inventory: GET /api/v1/inventory with Bearer auth", async () => {
    const r = await call("list_inventory", { page: 1 });
    assert.equal(r.url.pathname, "/api/v1/inventory");
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("get_inventory_quantities: GET with cardIds joined", async () => {
    const r = await call("get_inventory_quantities", {
      cardIds: [CARD_ID, CARD_ID_2],
    });
    assert.equal(r.url.pathname, "/api/v1/inventory/quantities");
    assert.equal(r.url.searchParams.get("cardIds"), `${CARD_ID},${CARD_ID_2}`);
  });

  it("add_inventory: POST with items array body", async () => {
    const items = [{ cardId: CARD_ID, quantity: 4, isFoil: false }];
    const r = await call("add_inventory", { items });
    assert.equal(r.method, "POST");
    assert.equal(r.url.pathname, "/api/v1/inventory");
    assert.equal(r.body, JSON.stringify(items));
  });

  it("update_inventory: PATCH with items array body", async () => {
    const items = [{ cardId: CARD_ID, quantity: 2, isFoil: true }];
    const r = await call("update_inventory", { items });
    assert.equal(r.method, "PATCH");
    assert.equal(r.body, JSON.stringify(items));
  });

  it("remove_inventory: DELETE with object body", async () => {
    const r = await call("remove_inventory", { cardId: CARD_ID, isFoil: false });
    assert.equal(r.method, "DELETE");
    assert.equal(r.body, JSON.stringify({ cardId: CARD_ID, isFoil: false }));
  });
});

describe("transaction tools", () => {
  it("list_transactions: GET with filters", async () => {
    const r = await call("list_transactions", { type: "BUY", sort: "TX_DATE" });
    assert.equal(r.url.pathname, "/api/v1/transactions");
    assert.equal(r.url.searchParams.get("type"), "BUY");
    assert.equal(r.url.searchParams.get("sort"), "TX_DATE");
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("record_transaction: POST with full body", async () => {
    const input = {
      cardId: "abc",
      type: "BUY" as const,
      quantity: 1,
      pricePerUnit: 5,
      isFoil: false,
      date: "2026-05-13",
    };
    const r = await call("record_transaction", input);
    assert.equal(r.method, "POST");
    assert.equal(r.body, JSON.stringify(input));
  });

  it("update_transaction: PUT /api/v1/transactions/{id} with patch body", async () => {
    const r = await call("update_transaction", { id: 42, patch: { quantity: 3 } });
    assert.equal(r.method, "PUT");
    assert.equal(r.url.pathname, "/api/v1/transactions/42");
    assert.equal(r.body, JSON.stringify({ quantity: 3 }));
  });

  it("delete_transaction: DELETE /api/v1/transactions/{id}", async () => {
    const r = await call("delete_transaction", { id: 7 });
    assert.equal(r.method, "DELETE");
    assert.equal(r.url.pathname, "/api/v1/transactions/7");
  });

  it("get_cost_basis: by cardId", async () => {
    const r = await call("get_cost_basis", { cardId: "abc", isFoil: false });
    assert.equal(r.url.pathname, "/api/v1/transactions/cost-basis/abc");
    assert.equal(r.url.searchParams.get("isFoil"), "false");
  });

  it("get_cost_basis: by setCode + setNumber", async () => {
    const r = await call("get_cost_basis", { setCode: "lea", setNumber: "161", isFoil: true });
    assert.equal(r.url.pathname, "/api/v1/transactions/cost-basis/lea/161");
    assert.equal(r.url.searchParams.get("isFoil"), "true");
  });
});

describe("portfolio tools", () => {
  it("get_portfolio_summary: GET /api/v1/portfolio", async () => {
    const r = await call("get_portfolio_summary", {});
    assert.equal(r.url.pathname, "/api/v1/portfolio");
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("get_portfolio_history: GET /api/v1/portfolio/history with days", async () => {
    const r = await call("get_portfolio_history", { days: 90 });
    assert.equal(r.url.pathname, "/api/v1/portfolio/history");
    assert.equal(r.url.searchParams.get("days"), "90");
  });

  it("get_portfolio_breakdown: GET with by", async () => {
    const r = await call("get_portfolio_breakdown", { by: "set" });
    assert.equal(r.url.pathname, "/api/v1/portfolio/breakdown");
    assert.equal(r.url.searchParams.get("by"), "set");
  });

  it("get_portfolio_breakdown: forwards the colors superset filter", async () => {
    const r = await call("get_portfolio_breakdown", { by: "color", colors: "W,U" });
    assert.equal(r.url.searchParams.get("by"), "color");
    assert.equal(r.url.searchParams.get("colors"), "W,U");
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("get_portfolio_breakdown: drops colors for non-color dimensions", async () => {
    const r = await call("get_portfolio_breakdown", { by: "set", colors: "W,U" });
    assert.equal(r.url.searchParams.has("colors"), false);
  });

  it("get_portfolio_breakdown_cards: GET /api/v1/portfolio/breakdown/cards with by + key", async () => {
    const r = await call("get_portfolio_breakdown_cards", {
      by: "rarity",
      key: "mythic",
    });
    assert.equal(r.url.pathname, "/api/v1/portfolio/breakdown/cards");
    assert.equal(r.url.searchParams.get("by"), "rarity");
    assert.equal(r.url.searchParams.get("key"), "mythic");
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("get_card_performance: GET /api/v1/portfolio/performance", async () => {
    const r = await call("get_card_performance", { type: "worst", limit: 5 });
    assert.equal(r.url.pathname, "/api/v1/portfolio/performance");
    assert.equal(r.url.searchParams.get("type"), "worst");
    assert.equal(r.url.searchParams.get("limit"), "5");
  });

  it("get_cash_flow: GET /api/v1/portfolio/cash-flow", async () => {
    const r = await call("get_cash_flow", {});
    assert.equal(r.url.pathname, "/api/v1/portfolio/cash-flow");
  });

  it("get_realized_gains: GET /api/v1/portfolio/realized-gains", async () => {
    const r = await call("get_realized_gains", {});
    assert.equal(r.url.pathname, "/api/v1/portfolio/realized-gains");
  });

  it("refresh_portfolio: POST /api/v1/portfolio/refresh", async () => {
    const r = await call("refresh_portfolio", {});
    assert.equal(r.method, "POST");
    assert.equal(r.url.pathname, "/api/v1/portfolio/refresh");
  });
});

describe("deck tools", () => {
  const cardId = "00000000-0000-0000-0000-000000000003";

  it("list_decks: GET /api/v1/decks with auth", async () => {
    const r = await call("list_decks", {});
    assert.equal(r.url.pathname, "/api/v1/decks");
    assert.equal(r.method, "GET");
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("get_deck: GET /api/v1/decks/{id}", async () => {
    const r = await call("get_deck", { deckId: 12 });
    assert.equal(r.url.pathname, "/api/v1/decks/12");
    assert.equal(r.method, "GET");
  });

  it("create_deck: POST /api/v1/decks with name + format", async () => {
    const r = await call("create_deck", { name: "Mono Red", format: "modern" });
    assert.equal(r.method, "POST");
    assert.equal(r.url.pathname, "/api/v1/decks");
    assert.deepEqual(JSON.parse(r.body as string), { name: "Mono Red", format: "modern" });
  });

  it("import_deck: POST /api/v1/decks/import with the decklist text", async () => {
    const r = await call("import_deck", { name: "Burn", text: "4 Lightning Bolt" });
    assert.equal(r.method, "POST");
    assert.equal(r.url.pathname, "/api/v1/decks/import");
    assert.equal(JSON.parse(r.body as string).text, "4 Lightning Bolt");
  });

  it("update_deck: PATCH /api/v1/decks/{id}", async () => {
    const r = await call("update_deck", { deckId: 5, name: "Renamed" });
    assert.equal(r.method, "PATCH");
    assert.equal(r.url.pathname, "/api/v1/decks/5");
    assert.equal(JSON.parse(r.body as string).name, "Renamed");
  });

  it("delete_deck: DELETE /api/v1/decks/{id}", async () => {
    const r = await call("delete_deck", { deckId: 5 });
    assert.equal(r.method, "DELETE");
    assert.equal(r.url.pathname, "/api/v1/decks/5");
  });

  it("add_deck_card: POST /api/v1/decks/{id}/cards, defaulting board + quantity", async () => {
    const r = await call("add_deck_card", { deckId: 5, cardId });
    assert.equal(r.method, "POST");
    assert.equal(r.url.pathname, "/api/v1/decks/5/cards");
    assert.deepEqual(JSON.parse(r.body as string), {
      cardId,
      isSideboard: false,
      quantity: 1,
    });
  });

  it("set_deck_card_quantity: PATCH /api/v1/decks/{id}/cards with absolute quantity", async () => {
    const r = await call("set_deck_card_quantity", {
      deckId: 5,
      cardId,
      isSideboard: true,
      quantity: 0,
    });
    assert.equal(r.method, "PATCH");
    assert.equal(r.url.pathname, "/api/v1/decks/5/cards");
    assert.deepEqual(JSON.parse(r.body as string), {
      cardId,
      isSideboard: true,
      quantity: 0,
    });
  });

  it("remove_deck_card: DELETE /api/v1/decks/{id}/cards", async () => {
    const r = await call("remove_deck_card", { deckId: 5, cardId, isSideboard: false });
    assert.equal(r.method, "DELETE");
    assert.equal(r.url.pathname, "/api/v1/decks/5/cards");
    assert.deepEqual(JSON.parse(r.body as string), { cardId, isSideboard: false });
  });

  it("deck_missing_to_buy_list: POST /api/v1/decks/{id}/missing-to-buy-list", async () => {
    const r = await call("deck_missing_to_buy_list", { deckId: 5 });
    assert.equal(r.method, "POST");
    assert.equal(r.url.pathname, "/api/v1/decks/5/missing-to-buy-list");
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });
});

describe("price alert tools", () => {
  it("list_price_alerts: GET /api/v1/price-alerts", async () => {
    const r = await call("list_price_alerts", {});
    assert.equal(r.url.pathname, "/api/v1/price-alerts");
  });

  it("create_price_alert: POST with body", async () => {
    const r = await call("create_price_alert", { cardId: CARD_ID, increasePct: 10 });
    assert.equal(r.method, "POST");
    assert.equal(r.body, JSON.stringify({ cardId: CARD_ID, increasePct: 10 }));
  });

  it("update_price_alert: PATCH /api/v1/price-alerts/{id} with patch body excluding id", async () => {
    const r = await call("update_price_alert", { id: 1, isActive: false });
    assert.equal(r.method, "PATCH");
    assert.equal(r.url.pathname, "/api/v1/price-alerts/1");
    assert.equal(r.body, JSON.stringify({ isActive: false }));
  });

  it("update_price_alert: rejects a patch with no fields", () => {
    assert.throws(
      () => toolsByName["update_price_alert"].inputSchema.parse({ id: 1 }),
      /at least one/i,
    );
  });

  it("delete_price_alert: DELETE /api/v1/price-alerts/{id}", async () => {
    const r = await call("delete_price_alert", { id: 1 });
    assert.equal(r.method, "DELETE");
    assert.equal(r.url.pathname, "/api/v1/price-alerts/1");
  });
});

describe("notification tools", () => {
  it("list_notifications: GET /api/v1/notifications", async () => {
    const r = await call("list_notifications", {});
    assert.equal(r.url.pathname, "/api/v1/notifications");
  });

  it("get_unread_notification_count: GET /api/v1/notifications/unread-count", async () => {
    const r = await call("get_unread_notification_count", {});
    assert.equal(r.url.pathname, "/api/v1/notifications/unread-count");
  });

  it("mark_notification_read: PATCH /api/v1/notifications/{id}/read", async () => {
    const r = await call("mark_notification_read", { id: 1 });
    assert.equal(r.method, "PATCH");
    assert.equal(r.url.pathname, "/api/v1/notifications/1/read");
  });

  it("mark_all_notifications_read: PATCH /api/v1/notifications/read-all", async () => {
    const r = await call("mark_all_notifications_read", {});
    assert.equal(r.method, "PATCH");
    assert.equal(r.url.pathname, "/api/v1/notifications/read-all");
  });
});

describe("sell tools", () => {
  it("get_card_buylist: GET /api/v1/cards/{setCode}/{number}/buylist, no auth", async () => {
    const r = await call("get_card_buylist", { setCode: "lea", setNumber: "161" });
    assert.equal(r.url.pathname, "/api/v1/cards/lea/161/buylist");
    assert.equal(r.method, "GET");
    assert.equal(r.headers.has("Authorization"), false);
  });

  it("get_market_sell_value: GET /api/v1/inventory/sell with auth", async () => {
    const r = await call("get_market_sell_value", {});
    assert.equal(r.url.pathname, "/api/v1/inventory/sell");
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("get_cash_vs_credit: GET /api/v1/optimizer with auth, default has no bonus param", async () => {
    const r = await call("get_cash_vs_credit", {});
    assert.equal(r.url.pathname, "/api/v1/optimizer");
    assert.equal(r.url.searchParams.has("bonus"), false);
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("get_cash_vs_credit: serializes the bonus fraction as a query param", async () => {
    const r = await call("get_cash_vs_credit", { bonus: 0.5 });
    assert.equal(r.url.searchParams.get("bonus"), "0.5");
  });
});

describe("buy-list tools", () => {
  it("list_buy_list: GET /api/v1/buy-list with auth", async () => {
    const r = await call("list_buy_list", {});
    assert.equal(r.url.pathname, "/api/v1/buy-list");
    assert.equal(r.method, "GET");
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("add_buy_list: POST /api/v1/buy-list, defaulting isFoil/quantity", async () => {
    const r = await call("add_buy_list", { cardId: CARD_ID });
    assert.equal(r.method, "POST");
    assert.equal(r.url.pathname, "/api/v1/buy-list");
    assert.deepEqual(JSON.parse(r.body as string), {
      cardId: CARD_ID,
      isFoil: false,
      quantity: 1,
    });
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("update_buy_list: PATCH /api/v1/buy-list with the absolute quantity", async () => {
    const r = await call("update_buy_list", { cardId: CARD_ID, isFoil: true, quantity: 0 });
    assert.equal(r.method, "PATCH");
    assert.equal(r.url.pathname, "/api/v1/buy-list");
    assert.deepEqual(JSON.parse(r.body as string), {
      cardId: CARD_ID,
      isFoil: true,
      quantity: 0,
    });
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("remove_buy_list: DELETE /api/v1/buy-list", async () => {
    const r = await call("remove_buy_list", { cardId: CARD_ID });
    assert.equal(r.method, "DELETE");
    assert.equal(r.url.pathname, "/api/v1/buy-list");
    assert.deepEqual(JSON.parse(r.body as string), { cardId: CARD_ID, isFoil: false });
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("import_buy_list: POST /api/v1/buy-list/import with the CSV text", async () => {
    const r = await call("import_buy_list", { text: "name\nLightning Bolt" });
    assert.equal(r.method, "POST");
    assert.equal(r.url.pathname, "/api/v1/buy-list/import");
    assert.deepEqual(JSON.parse(r.body as string), { text: "name\nLightning Bolt" });
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });
});

describe("sealed product read tools", () => {
  it("get_sealed_product: GET /api/v1/sealed-products/{uuid}, no auth", async () => {
    const uuid = "00000000-0000-0000-0000-000000000001";
    const r = await call("get_sealed_product", { uuid });
    assert.equal(r.url.pathname, `/api/v1/sealed-products/${uuid}`);
    assert.equal(r.method, "GET");
    assert.equal(r.headers.has("Authorization"), false);
  });

  it("get_set_price_history: GET /api/v1/sets/{code}/price-history, days as query, no auth", async () => {
    const r = await call("get_set_price_history", { code: "mh3", days: 90 });
    assert.equal(r.url.pathname, "/api/v1/sets/mh3/price-history");
    assert.equal(r.url.searchParams.get("days"), "90");
    assert.equal(r.headers.has("Authorization"), false);
  });

  it("get_set_price_history: omits the days param when not given", async () => {
    const r = await call("get_set_price_history", { code: "mh3" });
    assert.equal(r.url.searchParams.has("days"), false);
  });
});

describe("inventory CSV tools", () => {
  it("import_inventory_cards: POST /api/v1/inventory/import/cards (multipart) with auth", async () => {
    const r = await call("import_inventory_cards", { text: "name\nLightning Bolt" });
    assert.equal(r.method, "POST");
    assert.equal(r.url.pathname, "/api/v1/inventory/import/cards");
    assert.match(r.headers.get("content-type") ?? "", /multipart\/form-data/);
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("export_inventory: GET /api/v1/inventory/export with auth", async () => {
    const r = await call("export_inventory", {});
    assert.equal(r.method, "GET");
    assert.equal(r.url.pathname, "/api/v1/inventory/export");
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });
});

describe("sealed inventory tools", () => {
  it("list_sealed_inventory: GET /api/v1/inventory/sealed with auth", async () => {
    const r = await call("list_sealed_inventory", { page: 1 });
    assert.equal(r.url.pathname, "/api/v1/inventory/sealed");
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("set_sealed_inventory: POST /api/v1/inventory/sealed with the absolute quantity", async () => {
    const r = await call("set_sealed_inventory", {
      sealedProductUuid: "00000000-0000-0000-0000-000000000002",
      quantity: 3,
    });
    assert.equal(r.method, "POST");
    assert.equal(r.url.pathname, "/api/v1/inventory/sealed");
    assert.deepEqual(JSON.parse(r.body as string), {
      sealedProductUuid: "00000000-0000-0000-0000-000000000002",
      quantity: 3,
    });
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("remove_sealed_inventory: DELETE /api/v1/inventory/sealed", async () => {
    const r = await call("remove_sealed_inventory", {
      sealedProductUuid: "00000000-0000-0000-0000-000000000002",
    });
    assert.equal(r.method, "DELETE");
    assert.equal(r.url.pathname, "/api/v1/inventory/sealed");
    assert.deepEqual(JSON.parse(r.body as string), {
      sealedProductUuid: "00000000-0000-0000-0000-000000000002",
    });
    assert.equal(r.headers.get("Authorization"), "Bearer iwm_live_test");
  });
});

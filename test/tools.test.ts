import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { tools, toolsByName } from "../src/tools/index.js";

type FetchCall = { url: string; init: RequestInit };

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
  // Skip schema parsing - we trust zod and want to assert handler wiring directly.
  await tool.handler(input as never);
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
      cardIds: ["aaa-1", "bbb-2"],
    });
    assert.equal(r.url.pathname, "/api/v1/inventory/quantities");
    assert.equal(r.url.searchParams.get("cardIds"), "aaa-1,bbb-2");
  });

  it("add_inventory: POST with items array body", async () => {
    const items = [{ cardId: "abc", quantity: 4, isFoil: false }];
    const r = await call("add_inventory", { items });
    assert.equal(r.method, "POST");
    assert.equal(r.url.pathname, "/api/v1/inventory");
    assert.equal(r.body, JSON.stringify(items));
  });

  it("update_inventory: PATCH with items array body", async () => {
    const items = [{ cardId: "abc", quantity: 2, isFoil: true }];
    const r = await call("update_inventory", { items });
    assert.equal(r.method, "PATCH");
    assert.equal(r.body, JSON.stringify(items));
  });

  it("remove_inventory: DELETE with object body", async () => {
    const r = await call("remove_inventory", { cardId: "abc", isFoil: false });
    assert.equal(r.method, "DELETE");
    assert.equal(r.body, JSON.stringify({ cardId: "abc", isFoil: false }));
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

describe("price alert tools", () => {
  it("list_price_alerts: GET /api/v1/price-alerts", async () => {
    const r = await call("list_price_alerts", {});
    assert.equal(r.url.pathname, "/api/v1/price-alerts");
  });

  it("create_price_alert: POST with body", async () => {
    const r = await call("create_price_alert", { cardId: "abc", increasePct: 10 });
    assert.equal(r.method, "POST");
    assert.equal(r.body, JSON.stringify({ cardId: "abc", increasePct: 10 }));
  });

  it("update_price_alert: PATCH /api/v1/price-alerts/{id} with patch body excluding id", async () => {
    const r = await call("update_price_alert", { id: "alert-1", isActive: false });
    assert.equal(r.method, "PATCH");
    assert.equal(r.url.pathname, "/api/v1/price-alerts/alert-1");
    assert.equal(r.body, JSON.stringify({ isActive: false }));
  });

  it("delete_price_alert: DELETE /api/v1/price-alerts/{id}", async () => {
    const r = await call("delete_price_alert", { id: "alert-1" });
    assert.equal(r.method, "DELETE");
    assert.equal(r.url.pathname, "/api/v1/price-alerts/alert-1");
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
    const r = await call("mark_notification_read", { id: "n-1" });
    assert.equal(r.method, "PATCH");
    assert.equal(r.url.pathname, "/api/v1/notifications/n-1/read");
  });

  it("mark_all_notifications_read: PATCH /api/v1/notifications/read-all", async () => {
    const r = await call("mark_all_notifications_read", {});
    assert.equal(r.method, "PATCH");
    assert.equal(r.url.pathname, "/api/v1/notifications/read-all");
  });
});

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { handleCallTool, listTools } from "../src/server.js";

const originalFetch = globalThis.fetch;

/** Stub the network with a single canned response for the next call. */
function stubFetch(response: Response) {
  globalThis.fetch = (async () => response.clone()) as typeof fetch;
}

beforeEach(() => {
  process.env.IWMM_API_KEY = "iwm_live_test";
  delete process.env.IWMM_BASE_URL;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.IWMM_API_KEY;
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("listTools", () => {
  it("appends the auth suffix only for requiresAuth tools and emits annotations", () => {
    const { tools } = listTools();
    const search = tools.find((t) => t.name === "search_cards");
    const del = tools.find((t) => t.name === "delete_deck");
    assert.ok(search && del);
    assert.doesNotMatch(search.description, /Requires IWMM_API_KEY/);
    assert.match(del.description, /Requires IWMM_API_KEY\.$/);
    assert.equal(search.annotations.readOnlyHint, true);
    assert.equal(del.annotations.destructiveHint, true);
  });
});

describe("handleCallTool", () => {
  it("unknown tool -> isError with the tool name", async () => {
    const res = await handleCallTool("does_not_exist", {});
    assert.equal(res.isError, true);
    assert.match(res.content[0].text, /Unknown tool: does_not_exist/);
  });

  it("invalid arguments -> isError naming the tool", async () => {
    // get_card requires setCode + setNumber; {} fails the schema.
    const res = await handleCallTool("get_card", {});
    assert.equal(res.isError, true);
    assert.match(res.content[0].text, /Invalid arguments for get_card/);
  });

  it("object result -> pretty-printed JSON", async () => {
    stubFetch(json({ id: "x", name: "Bolt" }));
    const res = await handleCallTool("get_card", { setCode: "lea", setNumber: "161" });
    assert.equal(res.isError, undefined);
    assert.match(res.content[0].text, /"name": "Bolt"/);
  });

  it("undefined result (204) -> 'OK', not an empty text field (B1 regression)", async () => {
    stubFetch(new Response(null, { status: 204 }));
    const res = await handleCallTool("refresh_portfolio", {});
    assert.equal(res.isError, undefined);
    assert.equal(res.content[0].text, "OK");
  });

  it("string result -> passed through unencoded (CSV export)", async () => {
    const csv = "id,name\n1,Lightning Bolt";
    stubFetch(new Response(csv, { status: 200, headers: { "content-type": "text/csv" } }));
    const res = await handleCallTool("export_inventory", {});
    assert.equal(res.isError, undefined);
    assert.equal(res.content[0].text, csv);
  });

  it("thrown ApiError -> isError with a formatted message", async () => {
    stubFetch(new Response("boom", { status: 500 }));
    const res = await handleCallTool("search_cards", { q: "bolt" });
    assert.equal(res.isError, true);
    assert.match(res.content[0].text, /500/);
  });
});

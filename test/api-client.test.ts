import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { apiFetch, ApiError } from "../src/api-client.js";

type FetchCall = { url: string; init: RequestInit };

let calls: FetchCall[];
let nextResponse: Response;
const originalFetch = globalThis.fetch;

function mockResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  const status = init.status ?? 200;
  const headers = new Headers(init.headers);
  if (body === undefined || status === 204) {
    return new Response(null, { status, headers });
  }
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return new Response(text, { status, headers });
}

beforeEach(() => {
  calls = [];
  nextResponse = mockResponse({ ok: true });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });
    return nextResponse;
  }) as typeof fetch;
  delete process.env.IWMM_BASE_URL;
  delete process.env.IWMM_API_KEY;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("apiFetch", () => {
  it("issues a GET against the default base URL and parses JSON", async () => {
    nextResponse = mockResponse({ hello: "world" });
    const out = await apiFetch<{ hello: string }>({ path: "/api/v1/cards" });
    assert.equal(out.hello, "world");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://iwantmymtg.net/api/v1/cards");
    assert.equal(calls[0].init.method ?? "GET", "GET");
    const headers = new Headers(calls[0].init.headers);
    assert.equal(headers.get("Accept"), "application/json");
    assert.match(headers.get("User-Agent") ?? "", /^iwantmymtg-mcp\//);
  });

  it("honors IWMM_BASE_URL override", async () => {
    process.env.IWMM_BASE_URL = "http://localhost:3000";
    await apiFetch({ path: "/api/v1/sets" });
    assert.equal(calls[0].url, "http://localhost:3000/api/v1/sets");
  });

  it("serializes query params and skips undefined/null/empty", async () => {
    await apiFetch({
      path: "/api/v1/cards",
      query: { q: "bolt", limit: 10, page: undefined, foo: null as never, bar: "" },
    });
    const url = new URL(calls[0].url);
    assert.equal(url.searchParams.get("q"), "bolt");
    assert.equal(url.searchParams.get("limit"), "10");
    assert.equal(url.searchParams.has("page"), false);
    assert.equal(url.searchParams.has("foo"), false);
    assert.equal(url.searchParams.has("bar"), false);
  });

  it("returns undefined for 204 responses", async () => {
    nextResponse = mockResponse(undefined, { status: 204 });
    const out = await apiFetch({ path: "/api/v1/inventory", method: "DELETE", authenticated: false });
    assert.equal(out, undefined);
  });

  it("throws ApiError on non-2xx with status, body, and rate-limit headers", async () => {
    nextResponse = mockResponse(
      { error: "rate limited" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": "1700000000",
        },
      },
    );
    await assert.rejects(
      apiFetch({ path: "/api/v1/cards" }),
      (err: unknown) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 429);
        assert.match(err.body, /rate limited/);
        assert.equal(err.rateLimit?.limit, "100");
        assert.equal(err.rateLimit?.remaining, "0");
        assert.equal(err.rateLimit?.reset, "1700000000");
        return true;
      },
    );
  });

  it("attaches Bearer auth header when authenticated and IWMM_API_KEY is set", async () => {
    process.env.IWMM_API_KEY = "iwm_live_test";
    await apiFetch({ path: "/api/v1/inventory", authenticated: true });
    const headers = new Headers(calls[0].init.headers);
    assert.equal(headers.get("Authorization"), "Bearer iwm_live_test");
  });

  it("throws when authenticated request has no API key configured", async () => {
    await assert.rejects(
      apiFetch({ path: "/api/v1/inventory", authenticated: true }),
      /requires an API key/,
    );
    assert.equal(calls.length, 0, "no HTTP request should be made");
  });

  it("stringifies JSON body and sets Content-Type for POST", async () => {
    process.env.IWMM_API_KEY = "iwm_live_test";
    await apiFetch({
      path: "/api/v1/inventory",
      method: "POST",
      body: [{ cardId: "abc", quantity: 2, isFoil: false }],
      authenticated: true,
    });
    assert.equal(calls[0].init.method, "POST");
    const headers = new Headers(calls[0].init.headers);
    assert.equal(headers.get("Content-Type"), "application/json");
    assert.equal(
      calls[0].init.body,
      JSON.stringify([{ cardId: "abc", quantity: 2, isFoil: false }]),
    );
  });

  it("does not set Content-Type when body is omitted", async () => {
    await apiFetch({ path: "/api/v1/cards", method: "GET" });
    const headers = new Headers(calls[0].init.headers);
    assert.equal(headers.get("Content-Type"), null);
    assert.equal(calls[0].init.body, undefined);
  });
});

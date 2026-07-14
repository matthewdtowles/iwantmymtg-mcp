import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { apiClient, ApiError, AUTH_HEADERS, unwrap } from "../src/api-client.js";

type FetchCall = { request: Request; body?: string };

let calls: FetchCall[];
let nextResponse: () => Response;
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
  nextResponse = () => mockResponse({ ok: true });
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    // openapi-fetch always calls fetch with a single Request.
    const request = input as Request;
    const body = request.body ? await request.clone().text() : undefined;
    calls.push({ request, body });
    return nextResponse();
  }) as typeof fetch;
  delete process.env.IWMM_BASE_URL;
  delete process.env.IWMM_API_KEY;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("apiClient", () => {
  it("issues a GET against the default base URL and parses JSON", async () => {
    nextResponse = () => mockResponse({ hello: "world" });
    const { data, error } = await apiClient.GET("/api/v1/cards");
    assert.equal(error, undefined);
    assert.equal((data as { hello: string }).hello, "world");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].request.url, "https://iwantmymtg.net/api/v1/cards");
    assert.equal(calls[0].request.method, "GET");
    assert.equal(calls[0].request.headers.get("Accept"), "application/json");
    assert.match(calls[0].request.headers.get("User-Agent") ?? "", /^iwantmymtg-mcp\//);
  });

  it("honors IWMM_BASE_URL override", async () => {
    process.env.IWMM_BASE_URL = "http://localhost:3000";
    await apiClient.GET("/api/v1/sets");
    assert.equal(calls[0].request.url, "http://localhost:3000/api/v1/sets");
  });

  it("serializes query params and skips undefined", async () => {
    await apiClient.GET("/api/v1/cards", {
      params: { query: { q: "bolt", limit: 10, page: undefined } as never },
    });
    const url = new URL(calls[0].request.url);
    assert.equal(url.searchParams.get("q"), "bolt");
    assert.equal(url.searchParams.get("limit"), "10");
    assert.equal(url.searchParams.has("page"), false);
  });

  it("returns undefined data for 204 responses without throwing", async () => {
    process.env.IWMM_API_KEY = "iwm_live_test";
    nextResponse = () => mockResponse(undefined, { status: 204 });
    const { data, error } = await apiClient.DELETE("/api/v1/inventory", {
      body: { cardId: "abc", isFoil: false } as never,
      headers: AUTH_HEADERS,
    });
    assert.equal(error, undefined);
    assert.equal(data, undefined);
  });

  it("throws ApiError on non-2xx with status, body, and rate-limit headers", async () => {
    process.env.IWMM_API_KEY = "iwm_live_test";
    nextResponse = () =>
      mockResponse(
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
    await assert.rejects(apiClient.GET("/api/v1/cards"), (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 429);
      assert.match(err.body, /rate limited/);
      assert.equal(err.rateLimit?.limit, "100");
      assert.equal(err.rateLimit?.remaining, "0");
      assert.equal(err.rateLimit?.reset, "1700000000");
      return true;
    });
  });

  it("attaches Bearer auth when AUTH_HEADERS is set and IWMM_API_KEY is configured", async () => {
    process.env.IWMM_API_KEY = "iwm_live_test";
    await apiClient.GET("/api/v1/inventory", { headers: AUTH_HEADERS });
    assert.equal(calls[0].request.headers.get("Authorization"), "Bearer iwm_live_test");
    // The sentinel header is consumed, not forwarded.
    assert.equal(calls[0].request.headers.get("X-IWMM-Auth"), null);
  });

  it("throws when an authenticated request has no API key configured", async () => {
    await assert.rejects(
      apiClient.GET("/api/v1/inventory", { headers: AUTH_HEADERS }),
      /requires an API key/,
    );
    assert.equal(calls.length, 0, "no HTTP request should be made");
  });

  it("stringifies JSON body and sets Content-Type for POST", async () => {
    process.env.IWMM_API_KEY = "iwm_live_test";
    const items = [{ cardId: "abc", quantity: 2, isFoil: false }];
    await apiClient.POST("/api/v1/inventory", {
      body: items as never,
      headers: AUTH_HEADERS,
    });
    assert.equal(calls[0].request.method, "POST");
    assert.equal(calls[0].request.headers.get("Content-Type"), "application/json");
    assert.equal(calls[0].body, JSON.stringify(items));
  });
});

describe("unwrap", () => {
  it("returns data when there is no error", () => {
    assert.equal(unwrap("value", undefined), "value");
  });

  it("rethrows an ApiError unchanged", () => {
    const apiErr = new ApiError(404, "not found");
    assert.throws(
      () => unwrap(undefined, apiErr),
      (err) => err === apiErr,
    );
  });

  it("wraps a non-Error throw in an Error", () => {
    assert.throws(() => unwrap(undefined, "boom"), /boom/);
  });
});

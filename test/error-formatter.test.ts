import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ApiError } from "../src/api-client.js";
import { formatApiError, formatError, extractApiMessage } from "../src/error-formatter.js";

describe("extractApiMessage", () => {
  it("returns the message field from a NestJS-style error body", () => {
    const body = JSON.stringify({ statusCode: 403, message: "Active subscription required.", error: "Forbidden" });
    assert.equal(extractApiMessage(body), "Active subscription required.");
  });

  it("joins array messages (validation errors)", () => {
    const body = JSON.stringify({ message: ["name must be a string", "set must be uppercase"] });
    assert.equal(extractApiMessage(body), "name must be a string; set must be uppercase");
  });

  it("falls back to the error field when message is absent", () => {
    const body = JSON.stringify({ error: "Bad Request" });
    assert.equal(extractApiMessage(body), "Bad Request");
  });

  // The IWMM web API's actual error envelope (post W1 overhaul): every error
  // response is { success: false, error: "<message>" } with no `message` field,
  // so the domain message must come through the `error` fallback.
  it("reads the message from the IWMM { success, error } envelope", () => {
    const body = JSON.stringify({ success: false, error: "Card with set code X and number 1 not found" });
    assert.equal(extractApiMessage(body), "Card with set code X and number 1 not found");
  });

  it("returns undefined for non-JSON bodies", () => {
    assert.equal(extractApiMessage("plain text"), undefined);
  });

  it("returns undefined for empty bodies", () => {
    assert.equal(extractApiMessage(""), undefined);
  });
});

describe("formatApiError", () => {
  it("returns an auth-setup hint for 401", () => {
    const err = new ApiError(401, JSON.stringify({ message: "Unauthorized" }));
    const out = formatApiError(err);
    assert.match(out, /Not authenticated/);
    assert.match(out, /IWMM_API_KEY/);
    assert.match(out, /\/user\/api-keys/);
  });

  it("returns an upgrade prompt for 403 with the API's reason", () => {
    const err = new ApiError(
      403,
      JSON.stringify({ statusCode: 403, message: "Active subscription required.", error: "Forbidden" }),
    );
    const out = formatApiError(err);
    assert.match(out, /Active subscription required\./);
    assert.match(out, /Premium subscription/);
    assert.match(out, /\/pricing/);
  });

  it("returns an upgrade prompt for 402 even without a parseable body", () => {
    const err = new ApiError(402, "");
    const out = formatApiError(err);
    assert.match(out, /Premium subscription required\./);
    assert.match(out, /\/pricing/);
  });

  it("formats 429 with reset time", () => {
    const err = new ApiError(429, JSON.stringify({ message: "Too many requests" }), {
      limit: "60",
      remaining: "0",
      reset: "2026-05-14T03:45:00Z",
    });
    const out = formatApiError(err);
    assert.match(out, /Rate limit exceeded/);
    assert.match(out, /2026-05-14T03:45:00Z/);
  });

  it("falls back to status + raw body for unknown statuses", () => {
    const err = new ApiError(500, "internal boom");
    const out = formatApiError(err);
    assert.match(out, /500/);
    assert.match(out, /internal boom/);
  });
});

describe("formatError", () => {
  it("delegates ApiError to formatApiError", () => {
    const err = new ApiError(403, JSON.stringify({ message: "nope" }));
    assert.equal(formatError(err), formatApiError(err));
  });

  it("returns Error.message for other errors", () => {
    assert.equal(formatError(new Error("network down")), "network down");
  });

  it("stringifies non-Error throws", () => {
    assert.equal(formatError("string thrown"), "string thrown");
  });
});

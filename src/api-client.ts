import createClient, { type Middleware } from "openapi-fetch";
import { config, requireApiKey } from "./config.js";
import type { paths } from "./generated/api-types.js";
import { VERSION } from "./version.js";

const USER_AGENT = `iwantmymtg-mcp/${VERSION}`;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly rateLimit?: {
      limit?: string;
      remaining?: string;
      reset?: string;
    },
  ) {
    super(`IWMM API ${status}: ${body}`);
    this.name = "ApiError";
  }
}

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    request.headers.set("User-Agent", USER_AGENT);
    request.headers.set("Accept", "application/json");
    // Tools opt in by setting `X-IWMM-Auth: required` via init.headers
    if (request.headers.get("X-IWMM-Auth") === "required") {
      request.headers.delete("X-IWMM-Auth");
      request.headers.set("Authorization", `Bearer ${requireApiKey()}`);
    }
    return request;
  },
  async onResponse({ response }) {
    if (!response.ok) {
      const text = await response.clone().text();
      throw new ApiError(response.status, text, {
        limit: response.headers.get("X-RateLimit-Limit") ?? undefined,
        remaining: response.headers.get("X-RateLimit-Remaining") ?? undefined,
        reset: response.headers.get("X-RateLimit-Reset") ?? undefined,
      });
    }
    return response;
  },
};

type ApiClient = ReturnType<typeof createClient<paths>>;

// Lazy so tests can stub `globalThis.fetch` after module load, and so config
// changes (baseUrl, etc.) are picked up at call time.
function buildClient(): ApiClient {
  const client = createClient<paths>({
    baseUrl: config.baseUrl,
    fetch: (...args) => globalThis.fetch(...args),
  });
  client.use(authMiddleware);
  return client;
}

// Memoized so we don't rebuild the client (and re-register middleware) on every
// property access (A3). `fetch` is indirected through `globalThis.fetch` at call
// time, so test stubbing still works; we rebuild only if `config.baseUrl`
// changes, which keeps the "config picked up at call time" contract.
let cached: { client: ApiClient; baseUrl: string } | undefined;
function getClient(): ApiClient {
  if (!cached || cached.baseUrl !== config.baseUrl) {
    cached = { client: buildClient(), baseUrl: config.baseUrl };
  }
  return cached.client;
}

export const apiClient: ApiClient = new Proxy({} as ApiClient, {
  get(_, prop) {
    return Reflect.get(getClient(), prop);
  },
});

/** Header sentinel that the auth middleware swaps for a Bearer token. */
export const AUTH_HEADERS = { "X-IWMM-Auth": "required" } as const;

/**
 * Unwrap an openapi-fetch `{ data, error }` result. HTTP failures are already
 * thrown as `ApiError` by the response middleware, so `error` here only carries
 * non-HTTP failures (e.g. network errors).
 */
export function unwrap<T>(data: T | undefined, error: unknown): T {
  if (error) throw error instanceof Error ? error : new Error(String(error));
  return data as T;
}

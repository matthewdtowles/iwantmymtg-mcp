import createClient, { type Middleware } from "openapi-fetch";
import { config, requireApiKey } from "./config.js";
import type { paths } from "./generated/api-types.js";

const USER_AGENT = "iwantmymtg-mcp/0.2.0";

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

export const apiClient: ApiClient = new Proxy({} as ApiClient, {
  get(_, prop) {
    const client = buildClient();
    return Reflect.get(client, prop);
  },
});

/** Header sentinel that the auth middleware swaps for a Bearer token. */
export const AUTH_HEADERS = { "X-IWMM-Auth": "required" } as const;

/**
 * Legacy untyped fetch helper. Existing tools use this; new code should prefer
 * `apiClient.GET/POST/...` against the generated `paths` types.
 */
export interface ApiRequest {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  authenticated?: boolean;
}

export async function apiFetch<T = unknown>(req: ApiRequest): Promise<T> {
  const url = new URL(req.path, config.baseUrl);
  if (req.query) {
    for (const [k, v] of Object.entries(req.query)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": USER_AGENT,
  };

  if (req.authenticated) {
    headers["Authorization"] = `Bearer ${requireApiKey()}`;
  }

  if (req.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method: req.method ?? "GET",
    headers,
    body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text, {
      limit: res.headers.get("X-RateLimit-Limit") ?? undefined,
      remaining: res.headers.get("X-RateLimit-Remaining") ?? undefined,
      reset: res.headers.get("X-RateLimit-Reset") ?? undefined,
    });
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

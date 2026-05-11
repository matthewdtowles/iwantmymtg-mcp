import { config } from "./config.js";

export interface ApiRequest {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  authenticated?: boolean;
}

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
    "User-Agent": "iwmm-mcp-server/0.0.1",
  };

  if (req.authenticated) {
    const { requireApiKey } = await import("./config.js");
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

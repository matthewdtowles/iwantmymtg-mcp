import { ApiError } from "./api-client.js";

export function formatError(err: unknown): string {
  if (err instanceof ApiError) {
    return formatApiError(err);
  }
  return err instanceof Error ? err.message : String(err);
}

export function formatApiError(err: ApiError): string {
  const apiMessage = extractApiMessage(err.body);

  if (err.status === 401) {
    return `Not authenticated. Set IWMM_API_KEY to your iwm_live_... key from https://iwantmymtg.net/user/api-keys.`;
  }

  if (err.status === 402 || err.status === 403) {
    const detail = apiMessage ?? "Premium subscription required.";
    return `${detail} This feature requires an active IWMM Premium subscription. Upgrade at https://iwantmymtg.net/pricing.`;
  }

  if (err.status === 429) {
    const rl = err.rateLimit;
    const resetNote = rl?.reset ? ` Resets at ${rl.reset}.` : "";
    return `Rate limit exceeded.${resetNote} ${apiMessage ?? ""}`.trim();
  }

  const rl = err.rateLimit;
  const rateNote =
    rl?.remaining !== undefined
      ? ` (rate limit: ${rl.remaining}/${rl.limit} remaining, resets ${rl.reset ?? "?"})`
      : "";
  return `IWMM API responded ${err.status}${rateNote}: ${apiMessage ?? err.body}`;
}

export function extractApiMessage(body: string): string | undefined {
  if (!body) return undefined;
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed?.message === "string") return parsed.message;
    if (Array.isArray(parsed?.message)) return parsed.message.join("; ");
    if (typeof parsed?.error === "string") return parsed.error;
  } catch {
    // Body wasn't JSON; fall through.
  }
  return undefined;
}

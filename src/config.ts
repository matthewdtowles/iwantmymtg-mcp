// Reads env lazily so callers and tests see live values rather than a snapshot
// taken at import time.
export const config = {
  get baseUrl(): string {
    return process.env.IWMM_BASE_URL ?? "https://iwantmymtg.net";
  },
  get apiKey(): string | undefined {
    return process.env.IWMM_API_KEY;
  },
};

export function requireApiKey(): string {
  if (!config.apiKey) {
    throw new Error(
      "This tool requires an API key. Set IWMM_API_KEY in your MCP client config. " +
        "Create a key at https://iwantmymtg.net/user/api-keys.",
    );
  }
  return config.apiKey;
}

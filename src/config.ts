export const config = {
  baseUrl: process.env.IWMM_BASE_URL ?? "https://iwantmymtg.net",
  apiKey: process.env.IWMM_API_KEY,
} as const;

export function requireApiKey(): string {
  if (!config.apiKey) {
    throw new Error(
      "This tool requires an API key. Set IWMM_API_KEY in your MCP client config. " +
        "Create a key at https://iwantmymtg.net/user/api-keys.",
    );
  }
  return config.apiKey;
}

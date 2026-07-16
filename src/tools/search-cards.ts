import { z } from "zod";
import { apiClient, unwrap } from "../api-client.js";
import { formatEnum, limitParam, pageParam } from "./schemas.js";
import { defineTool } from "./types.js";

export const searchCardsInputSchema = {
  q: z
    .string()
    .optional()
    .describe(
      "Substring to search card name + flavor name. Optional; omit to filter purely by setCode/rarity/type/format.",
    ),
  setCode: z.string().optional().describe("3-5 character set code (e.g. 'lea', 'mh3')."),
  rarity: z.enum(["common", "uncommon", "rare", "mythic"]).optional().describe("Filter by rarity."),
  type: z
    .string()
    .optional()
    .describe("Substring match against card type line (e.g. 'Goblin', 'Instant')."),
  format: formatEnum
    .optional()
    .describe("Filter to cards with a legality entry in this format (e.g. 'modern', 'commander')."),
  legality: z
    .enum(["legal", "banned", "restricted"])
    .optional()
    .describe("Used with 'format'. Defaults to 'legal' when format is set."),
  page: pageParam.optional().describe("1-based page index."),
  limit: limitParam.optional().describe("Page size (max 100)."),
};

export async function searchCards(input: Record<string, unknown>) {
  // zod validates the query at the tool boundary; the generated spec now types
  // these query params, so the validated input flows through without a cast.
  const { data, error } = await apiClient.GET("/api/v1/cards", {
    params: { query: input },
  });
  return unwrap(data, error);
}

export const searchCardsTool = defineTool({
  name: "search_cards",
  requiresAuth: false,
  readOnly: true,
  description:
    "Search Magic: The Gathering cards by name (substring), set code, rarity, type, or format legality. Returns a paginated list with prices and basic metadata. Use this for catalog lookups; for a specific printing prefer get_card with set+number.",
  inputSchema: z
    .object(searchCardsInputSchema)
    .refine((v) => v.format !== undefined || v.legality === undefined, {
      message: "legality can only be used together with format",
      path: ["legality"],
    }),
  handler: searchCards,
});

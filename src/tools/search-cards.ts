import { z } from "zod";
import { apiFetch } from "../api-client.js";

export const searchCardsInputSchema = {
  q: z
    .string()
    .optional()
    .describe("Substring to search card name + flavor name. Optional; omit to filter purely by setCode/rarity/type/format."),
  setCode: z.string().optional().describe("3-5 character set code (e.g. 'lea', 'mh3')."),
  rarity: z
    .enum(["common", "uncommon", "rare", "mythic"])
    .optional()
    .describe("Filter by rarity."),
  type: z
    .string()
    .optional()
    .describe("Substring match against card type line (e.g. 'Goblin', 'Instant')."),
  format: z
    .string()
    .optional()
    .describe("Filter to cards with a legality entry in this format (e.g. 'modern', 'commander')."),
  legality: z
    .enum(["legal", "banned", "restricted"])
    .optional()
    .describe("Used with 'format'. Defaults to 'legal' when format is set."),
  page: z.number().int().min(1).optional().describe("1-based page index."),
  limit: z.number().int().min(1).max(100).optional().describe("Page size (max 100)."),
};

export async function searchCards(input: Record<string, unknown>) {
  return apiFetch({
    path: "/api/v1/cards",
    query: input as Record<string, string | number | undefined>,
  });
}

export const searchCardsTool = {
  name: "search_cards",
  description:
    "Search Magic: The Gathering cards by name (substring), set code, rarity, type, or format legality. Returns a paginated list with prices and basic metadata. Use this for catalog lookups; for a specific printing prefer get_card with set+number.",
  inputSchema: z.object(searchCardsInputSchema),
  handler: searchCards,
};

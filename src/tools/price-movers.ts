import { z } from "zod";
import { apiClient, unwrap } from "../api-client.js";
import { formatEnum, limitParam, pageParam } from "./schemas.js";
import { defineTool } from "./types.js";

export const getPriceMoversInputSchema = {
  direction: z
    .enum(["up", "down"])
    .optional()
    .describe("'up' for the biggest increases (default), 'down' for decreases."),
  by: z
    .enum(["percent", "amount"])
    .optional()
    .describe("Rank by 'percent' change (default) or dollar 'amount'."),
  minPrice: z
    .number()
    .min(0)
    .optional()
    .describe(
      "Ignore cards worth less than this many dollars both before and after the move. Defaults to 5.",
    ),
  finish: z.enum(["normal", "foil"]).optional().describe("Only this finish. Both by default."),
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

export async function getPriceMovers(input: Record<string, unknown>) {
  const { data, error } = await apiClient.GET("/api/v1/cards/movers", {
    params: { query: input },
  });
  return unwrap(data, error);
}

export const getPriceMoversTool = defineTool({
  name: "get_price_movers",
  requiresAuth: false,
  readOnly: true,
  description:
    "The week's biggest Magic: The Gathering price moves: the cards whose price rose (direction 'up', the default) or fell (direction 'down') the most over the last 7 days, one row per printing and finish, with today's price, the price a week ago, and the change in dollars and percent. Ranked by percent unless by is 'amount'. Cards worth less than minPrice (default $5) both before and after the move are left out, and so are prices that jumped back and forth during the week, which come from a missing vendor price rather than a real move. Narrow it with setCode, rarity, type, format legality or finish.",
  inputSchema: z
    .object(getPriceMoversInputSchema)
    .refine((v) => v.format !== undefined || v.legality === undefined, {
      message: "legality can only be used together with format",
      path: ["legality"],
    }),
  handler: getPriceMovers,
});

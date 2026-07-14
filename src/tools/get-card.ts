import { z } from "zod";
import { apiClient, unwrap } from "../api-client.js";
import { defineTool } from "./types.js";

export const getCardInputSchema = {
  setCode: z.string().describe("Set code (e.g. 'lea')."),
  setNumber: z
    .string()
    .describe(
      "Collector number within the set (e.g. '161'). String, not int - some sets use suffixes like '12a'.",
    ),
};

type CardKey = { setCode: string; setNumber: string };

export async function getCard(input: CardKey) {
  const { data, error } = await apiClient.GET("/api/v1/cards/{setCode}/{setNumber}", {
    params: { path: input },
  });
  return unwrap(data, error);
}

export const getCardTool = defineTool({
  name: "get_card",
  requiresAuth: false,
  readOnly: true,
  description:
    "Look up a specific card printing by set code and collector number. Returns full card detail including current prices, rarity, type, and flavor name. For broader catalog search use search_cards.",
  inputSchema: z.object(getCardInputSchema),
  handler: getCard,
});

export const getCardPricesTool = defineTool({
  name: "get_card_prices",
  requiresAuth: false,
  readOnly: true,
  description: "Get current normal and foil prices for a specific card printing.",
  inputSchema: z.object(getCardInputSchema),
  handler: async (input: CardKey) => {
    const { data, error } = await apiClient.GET("/api/v1/cards/{setCode}/{setNumber}/prices", {
      params: { path: input },
    });
    return unwrap(data, error);
  },
});

export const getCardPriceHistoryTool = defineTool({
  name: "get_card_price_history",
  requiresAuth: false,
  readOnly: true,
  description:
    "Get the 30-day price history for a card printing (normal + foil). Older data is retained on a weekly/monthly cadence beyond 30 days.",
  inputSchema: z.object(getCardInputSchema),
  handler: async (input: CardKey) => {
    const { data, error } = await apiClient.GET(
      "/api/v1/cards/{setCode}/{setNumber}/price-history",
      { params: { path: input } },
    );
    return unwrap(data, error);
  },
});

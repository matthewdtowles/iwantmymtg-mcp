import { z } from "zod";
import { apiClient } from "../api-client.js";
import { ApiError } from "../api-client.js";

export const getCardInputSchema = {
  setCode: z.string().describe("Set code (e.g. 'lea')."),
  setNumber: z.string().describe("Collector number within the set (e.g. '161'). String, not int - some sets use suffixes like '12a'."),
};

type CardKey = { setCode: string; setNumber: string };

function unwrap<T>(data: T | undefined, error: unknown): T {
  if (error) throw error instanceof ApiError ? error : new Error(String(error));
  return data as T;
}

export async function getCard(input: CardKey) {
  const { data, error } = await apiClient.GET(
    "/api/v1/cards/{setCode}/{setNumber}",
    { params: { path: input } },
  );
  return unwrap(data, error);
}

export const getCardTool = {
  name: "get_card",
  description:
    "Look up a specific card printing by set code and collector number. Returns full card detail including current prices, rarity, type, and flavor name. For broader catalog search use search_cards.",
  inputSchema: z.object(getCardInputSchema),
  handler: getCard,
};

export const getCardPricesTool = {
  name: "get_card_prices",
  description: "Get current normal and foil prices for a specific card printing.",
  inputSchema: z.object(getCardInputSchema),
  handler: async (input: CardKey) => {
    const { data, error } = await apiClient.GET(
      "/api/v1/cards/{setCode}/{setNumber}/prices",
      { params: { path: input } },
    );
    return unwrap(data, error);
  },
};

export const getCardPriceHistoryTool = {
  name: "get_card_price_history",
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
};

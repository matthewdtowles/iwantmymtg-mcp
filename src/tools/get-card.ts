import { z } from "zod";
import { apiFetch } from "../api-client.js";

export const getCardInputSchema = {
  setCode: z.string().describe("Set code (e.g. 'lea')."),
  setNumber: z.string().describe("Collector number within the set (e.g. '161'). String, not int - some sets use suffixes like '12a'."),
};

export async function getCard(input: { setCode: string; setNumber: string }) {
  return apiFetch({
    path: `/api/v1/cards/${encodeURIComponent(input.setCode)}/${encodeURIComponent(input.setNumber)}`,
  });
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
  handler: async (input: { setCode: string; setNumber: string }) =>
    apiFetch({
      path: `/api/v1/cards/${encodeURIComponent(input.setCode)}/${encodeURIComponent(input.setNumber)}/prices`,
    }),
};

export const getCardPriceHistoryTool = {
  name: "get_card_price_history",
  description:
    "Get the 30-day price history for a card printing (normal + foil). Older data is retained on a weekly/monthly cadence beyond 30 days.",
  inputSchema: z.object(getCardInputSchema),
  handler: async (input: { setCode: string; setNumber: string }) =>
    apiFetch({
      path: `/api/v1/cards/${encodeURIComponent(input.setCode)}/${encodeURIComponent(input.setNumber)}/price-history`,
    }),
};

import { z } from "zod";
import { apiClient, AUTH_HEADERS, unwrap } from "../api-client.js";
import { defineTool } from "./types.js";

/**
 * Phase 6 sell tools (#9): buylist (sell-to-vendor) pricing, market sell value
 * of a user's inventory, and the cash-vs-store-credit optimizer. These mirror
 * the web pages and share the same backend; CSV export stays web-side.
 */

export const getCardBuylistTool = defineTool({
  name: "get_card_buylist",
  requiresAuth: false,
  readOnly: true,
  description:
    "Get current buylist (sell-to-vendor) offers for a card printing, by set code and collector number. Returns offers grouped by finish (normal/foil/etched), best first, with the highest offer per finish marked. NM condition only. Use get_card_prices for retail (buy) prices instead.",
  inputSchema: z.object({
    setCode: z.string().describe("Set code (e.g. 'lea')."),
    setNumber: z
      .string()
      .describe("Collector number within the set (e.g. '161'). String, not int."),
  }),
  handler: async (input: { setCode: string; setNumber: string }) => {
    const { data, error } = await apiClient.GET("/api/v1/cards/{setCode}/{setNumber}/buylist", {
      params: { path: input },
    });
    return unwrap(data, error);
  },
});

export const getMarketSellValueTool = defineTool({
  name: "get_market_sell_value",
  requiresAuth: true,
  readOnly: true,
  description:
    "Market sell value of the authenticated user's whole inventory: matches every owned card against current buylist offers, picks the best offer per item (capped by the vendor's buy quantity), groups by vendor, and totals it. Returns vendor groups with per-item payouts plus overall totals.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/inventory/sell", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const getCashVsCreditTool = defineTool({
  name: "get_cash_vs_credit",
  requiresAuth: true,
  readOnly: true,
  description:
    "Cash vs. store-credit recommendation for the authenticated user. Compares taking the buylist cash payout for their inventory against taking store credit (worth a bonus %) and spending it on their buy list. Returns the recommendation, the credit advantage, out-of-pocket each way, and the priced buy-list lines.",
  inputSchema: z.object({
    bonus: z
      .number()
      .min(0)
      .max(2)
      .optional()
      .describe(
        "Store-credit bonus as a fraction (0.30 = +30%). Must be in [0, 2]; defaults to 0.30 (Card Kingdom).",
      ),
  }),
  handler: async (input: { bonus?: number }) => {
    const query = input.bonus != null ? { bonus: String(input.bonus) } : undefined;
    const { data, error } = await apiClient.GET("/api/v1/optimizer", {
      params: { query },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

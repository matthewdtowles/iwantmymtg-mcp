import { z } from "zod";
import { apiClient, unwrap } from "../api-client.js";
import { formatEnum, limitParam, pageParam } from "./schemas.js";
import { defineTool } from "./types.js";

export const searchSetsTool = defineTool({
  name: "search_sets",
  requiresAuth: false,
  readOnly: true,
  description:
    "List Magic: The Gathering sets, optionally paginated. Returns set code, name, release date, type, and aggregate prices.",
  inputSchema: z.object({
    page: pageParam.optional(),
    limit: limitParam.optional(),
  }),
  handler: async (input: Record<string, unknown>) => {
    const { data, error } = await apiClient.GET("/api/v1/sets", {
      params: { query: input as never },
    });
    return unwrap(data, error);
  },
});

export const getSetTool = defineTool({
  name: "get_set",
  requiresAuth: false,
  readOnly: true,
  description: "Get detail for a single set by code (e.g. 'lea', 'mh3').",
  inputSchema: z.object({ code: z.string() }),
  handler: async ({ code }: { code: string }) => {
    const { data, error } = await apiClient.GET("/api/v1/sets/{code}", {
      params: { path: { code } },
    });
    return unwrap(data, error);
  },
});

export const listSetCardsTool = defineTool({
  name: "list_set_cards",
  requiresAuth: false,
  readOnly: true,
  description:
    "List all cards in a set, paginated. Supports the same filters as search_cards (rarity, type, format, legality).",
  inputSchema: z.object({
    code: z.string().describe("Set code."),
    rarity: z.enum(["common", "uncommon", "rare", "mythic"]).optional(),
    type: z.string().optional(),
    format: formatEnum.optional(),
    legality: z.enum(["legal", "banned", "restricted"]).optional(),
    page: pageParam.optional(),
    limit: limitParam.optional(),
  }),
  handler: async ({ code, ...rest }: { code: string } & Record<string, unknown>) => {
    const { data, error } = await apiClient.GET("/api/v1/sets/{code}/cards", {
      params: { path: { code }, query: rest as never },
    });
    return unwrap(data, error);
  },
});

export const getSealedProductsTool = defineTool({
  name: "get_sealed_products",
  requiresAuth: false,
  readOnly: true,
  description:
    "List sealed products (booster boxes, bundles, commander decks, etc.) for a set. Each entry includes a TCGPlayer purchase URL.",
  inputSchema: z.object({ code: z.string() }),
  handler: async ({ code }: { code: string }) => {
    const { data, error } = await apiClient.GET("/api/v1/sets/{code}/sealed-products", {
      params: { path: { code } },
    });
    return unwrap(data, error);
  },
});

export const getSetPriceHistoryTool = defineTool({
  name: "get_set_price_history",
  requiresAuth: false,
  readOnly: true,
  description:
    "Get the price history for a whole set by set code - the set's aggregate value over time. Optionally limit the window with days. For a single card's history use get_card_price_history.",
  inputSchema: z.object({
    code: z.string().describe("Set code (e.g. 'mh3')."),
    days: z.number().int().min(1).optional().describe("Number of days of history to return."),
  }),
  handler: async ({ code, days }: { code: string; days?: number }) => {
    const query = days != null ? { days: String(days) } : undefined;
    const { data, error } = await apiClient.GET("/api/v1/sets/{code}/price-history", {
      params: { path: { code }, query },
    });
    return unwrap(data, error);
  },
});

export const getSealedProductTool = defineTool({
  name: "get_sealed_product",
  requiresAuth: false,
  readOnly: true,
  description:
    "Get detail for a single sealed product by its UUID, including current pricing and a TCGPlayer purchase URL. List a set's sealed products with get_sealed_products.",
  inputSchema: z.object({
    uuid: z.string().uuid().describe("Sealed product UUID, e.g. from get_sealed_products."),
  }),
  handler: async ({ uuid }: { uuid: string }) => {
    const { data, error } = await apiClient.GET("/api/v1/sealed-products/{uuid}", {
      params: { path: { uuid } },
    });
    return unwrap(data, error);
  },
});

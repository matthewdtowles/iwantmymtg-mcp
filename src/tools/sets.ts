import { z } from "zod";
import { apiClient, unwrap } from "../api-client.js";

export const searchSetsTool = {
  name: "search_sets",
  description:
    "List Magic: The Gathering sets, optionally paginated. Returns set code, name, release date, type, and aggregate prices.",
  inputSchema: z.object({
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  handler: async (input: Record<string, unknown>) => {
    const { data, error } = await apiClient.GET("/api/v1/sets", {
      params: { query: input as never },
    });
    return unwrap(data, error);
  },
};

export const getSetTool = {
  name: "get_set",
  description: "Get detail for a single set by code (e.g. 'lea', 'mh3').",
  inputSchema: z.object({ code: z.string() }),
  handler: async ({ code }: { code: string }) => {
    const { data, error } = await apiClient.GET("/api/v1/sets/{code}", {
      params: { path: { code } },
    });
    return unwrap(data, error);
  },
};

export const listSetCardsTool = {
  name: "list_set_cards",
  description:
    "List all cards in a set, paginated. Supports the same filters as search_cards (rarity, type, format, legality).",
  inputSchema: z.object({
    code: z.string().describe("Set code."),
    rarity: z.enum(["common", "uncommon", "rare", "mythic"]).optional(),
    type: z.string().optional(),
    format: z.string().optional(),
    legality: z.enum(["legal", "banned", "restricted"]).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  handler: async ({ code, ...rest }: { code: string } & Record<string, unknown>) => {
    const { data, error } = await apiClient.GET("/api/v1/sets/{code}/cards", {
      params: { path: { code }, query: rest as never },
    });
    return unwrap(data, error);
  },
};

export const getSealedProductsTool = {
  name: "get_sealed_products",
  description:
    "List sealed products (booster boxes, bundles, commander decks, etc.) for a set. Each entry includes a TCGPlayer purchase URL.",
  inputSchema: z.object({ code: z.string() }),
  handler: async ({ code }: { code: string }) => {
    const { data, error } = await apiClient.GET("/api/v1/sets/{code}/sealed-products", {
      params: { path: { code } },
    });
    return unwrap(data, error);
  },
};

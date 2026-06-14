import { z } from "zod";
import { apiClient, AUTH_HEADERS, unwrap } from "../api-client.js";

/**
 * Buy-list (want-list) management (#9). Per-user list of cards a user wants to
 * acquire, mirroring inventory's grain (card + finish + quantity). Feeds the
 * cash-vs-credit optimizer (get_cash_vs_credit). All tools require IWMM_API_KEY.
 */

const cardId = z
  .string()
  .uuid()
  .describe("Internal IWMM card UUID. Get from search_cards or get_card.");

const isFoil = z
  .boolean()
  .optional()
  .describe("Whether this is the foil variant. Foil and non-foil are separate rows. Defaults to false.");

export const listBuyListTool = {
  name: "list_buy_list",
  description:
    "List the authenticated user's buy-list (want-list): the cards they want to acquire, with quantities, finish, and current prices. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/buy-list", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const addBuyListTool = {
  name: "add_buy_list",
  description:
    "Add a card to the authenticated user's buy-list, incrementing the quantity (creates the row if absent). This is a real write. Use update_buy_list to set an absolute quantity or remove_buy_list to delete a row. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    cardId,
    isFoil,
    quantity: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe("How many to add. Defaults to 1."),
  }),
  handler: async (input: { cardId: string; isFoil?: boolean; quantity?: number }) => {
    const { data, error } = await apiClient.POST("/api/v1/buy-list", {
      body: {
        cardId: input.cardId,
        isFoil: input.isFoil ?? false,
        quantity: input.quantity ?? 1,
      },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const updateBuyListTool = {
  name: "update_buy_list",
  description:
    "Set the absolute quantity for a buy-list card+finish (not a delta). A quantity of 0 removes the row. Use add_buy_list to increment instead. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    cardId,
    isFoil,
    quantity: z
      .number()
      .int()
      .min(0)
      .describe("Absolute quantity to set. 0 removes the row."),
  }),
  handler: async (input: { cardId: string; isFoil?: boolean; quantity: number }) => {
    const { data, error } = await apiClient.PATCH("/api/v1/buy-list", {
      body: {
        cardId: input.cardId,
        isFoil: input.isFoil ?? false,
        quantity: input.quantity,
      },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const removeBuyListTool = {
  name: "remove_buy_list",
  description:
    "Remove a card+finish row from the authenticated user's buy-list entirely. Requires IWMM_API_KEY.",
  inputSchema: z.object({ cardId, isFoil }),
  handler: async (input: { cardId: string; isFoil?: boolean }) => {
    const { data, error } = await apiClient.DELETE("/api/v1/buy-list", {
      body: { cardId: input.cardId, isFoil: input.isFoil ?? false },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const importBuyListTool = {
  name: "import_buy_list",
  description:
    "Bulk-add cards to the authenticated user's buy-list from pasted CSV text. Native format header: name,set_code,number[,quantity][,foil]. External exports (Moxfield, Archidekt, Deckbox, TCGPlayer) are auto-detected. Returns counts and per-row errors. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    text: z.string().min(1).describe("CSV text including a header row."),
  }),
  handler: async (input: { text: string }) => {
    const { data, error } = await apiClient.POST("/api/v1/buy-list/import", {
      body: { text: input.text },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

import { z } from "zod";
import { AUTH_HEADERS, apiClient, unwrap } from "../api-client.js";
import { cardIdSchema, formatEnum, idParam } from "./schemas.js";
import { defineTool } from "./types.js";

/**
 * Deck building (#534, #536, #541). Per-user decks of cards (mainboard +
 * sideboard) with optional format. Backs deck list/detail, decklist import,
 * card management, and "add the cards I'm missing to my buy-list". All tools
 * require IWMM_API_KEY.
 */

const format = formatEnum.optional().describe("Target format. Omit for no format.");

const deckId = idParam.describe("Deck id. Get from list_decks or create_deck.");

const cardId = cardIdSchema.describe("Internal IWMM card UUID. Get from search_cards or get_card.");

const isSideboard = z
  .boolean()
  .optional()
  .describe(
    "Whether the card belongs to the sideboard. Mainboard and sideboard are separate rows. Defaults to false.",
  );

export const listDecksTool = defineTool({
  name: "list_decks",
  description: "List the authenticated user's decks (summaries: id, name, format, card counts).",
  requiresAuth: true,
  readOnly: true,
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/decks", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const getDeckTool = defineTool({
  name: "get_deck",
  description: "Get one deck with its cards (mainboard + sideboard).",
  requiresAuth: true,
  readOnly: true,
  inputSchema: z.object({ deckId }),
  handler: async ({ deckId }) => {
    const { data, error } = await apiClient.GET("/api/v1/decks/{id}", {
      params: { path: { id: deckId } },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const createDeckTool = defineTool({
  name: "create_deck",
  description:
    "Create a new empty deck. This is a real write. Use add_deck_card to fill it, or import_deck to create from pasted text instead.",
  requiresAuth: true,
  inputSchema: z.object({
    name: z.string().min(1).describe("Deck name."),
    format,
  }),
  handler: async (input) => {
    const { data, error } = await apiClient.POST("/api/v1/decks", {
      body: { name: input.name, format: input.format },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const importDeckTool = defineTool({
  name: "import_deck",
  description:
    'Create a deck from pasted decklist text, one entry per line (e.g. "4 Lightning Bolt"). Returns the new deck id plus any lines that could not be resolved to a card.',
  requiresAuth: true,
  inputSchema: z.object({
    name: z.string().min(1).describe("Deck name."),
    format,
    text: z.string().min(1).describe("Decklist text, one entry per line."),
  }),
  handler: async (input) => {
    const { data, error } = await apiClient.POST("/api/v1/decks/import", {
      body: { name: input.name, format: input.format, text: input.text },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const updateDeckTool = defineTool({
  name: "update_deck",
  description: "Rename a deck or change its format. Omitting format clears it.",
  requiresAuth: true,
  inputSchema: z.object({
    deckId,
    name: z.string().min(1).describe("New deck name."),
    format,
  }),
  handler: async (input) => {
    const { data, error } = await apiClient.PATCH("/api/v1/decks/{id}", {
      params: { path: { id: input.deckId } },
      body: { name: input.name, format: input.format },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const deleteDeckTool = defineTool({
  name: "delete_deck",
  description: "Delete a deck and all of its cards. This is permanent.",
  requiresAuth: true,
  destructive: true,
  inputSchema: z.object({ deckId }),
  handler: async ({ deckId }) => {
    const { data, error } = await apiClient.DELETE("/api/v1/decks/{id}", {
      params: { path: { id: deckId } },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const addDeckCardTool = defineTool({
  name: "add_deck_card",
  description:
    "Add a card to a deck, incrementing its quantity (creates the row if absent). Use set_deck_card_quantity to set an absolute quantity or remove_deck_card to delete a row.",
  requiresAuth: true,
  inputSchema: z.object({
    deckId,
    cardId,
    isSideboard,
    quantity: z.number().int().min(1).optional().describe("How many to add. Defaults to 1."),
  }),
  handler: async (input) => {
    const { data, error } = await apiClient.POST("/api/v1/decks/{id}/cards", {
      params: { path: { id: input.deckId } },
      body: {
        cardId: input.cardId,
        isSideboard: input.isSideboard ?? false,
        quantity: input.quantity ?? 1,
      },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const setDeckCardQuantityTool = defineTool({
  name: "set_deck_card_quantity",
  description:
    "Set the absolute quantity for a card + board in a deck (not a delta). A quantity of 0 removes the row. Use add_deck_card to increment instead.",
  requiresAuth: true,
  inputSchema: z.object({
    deckId,
    cardId,
    isSideboard: z
      .boolean()
      .describe("Which board the row belongs to. Mainboard and sideboard are separate rows."),
    quantity: z.number().int().min(0).describe("Absolute quantity to set. 0 removes the row."),
  }),
  handler: async (input) => {
    const { data, error } = await apiClient.PATCH("/api/v1/decks/{id}/cards", {
      params: { path: { id: input.deckId } },
      body: {
        cardId: input.cardId,
        isSideboard: input.isSideboard,
        quantity: input.quantity,
      },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const removeDeckCardTool = defineTool({
  name: "remove_deck_card",
  description: "Remove a card + board row from a deck entirely.",
  requiresAuth: true,
  destructive: true,
  inputSchema: z.object({
    deckId,
    cardId,
    isSideboard: z
      .boolean()
      .describe("Which board the row belongs to. Mainboard and sideboard are separate rows."),
  }),
  handler: async (input) => {
    const { data, error } = await apiClient.DELETE("/api/v1/decks/{id}/cards", {
      params: { path: { id: input.deckId } },
      body: { cardId: input.cardId, isSideboard: input.isSideboard },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const deckMissingToBuyListTool = defineTool({
  name: "deck_missing_to_buy_list",
  description:
    "Add the deck's missing cards (the shortfall vs. the user's inventory) to their buy-list. Returns the count of distinct cards added. This is a real write to the buy-list.",
  requiresAuth: true,
  inputSchema: z.object({ deckId }),
  handler: async ({ deckId }) => {
    const { data, error } = await apiClient.POST("/api/v1/decks/{id}/missing-to-buy-list", {
      params: { path: { id: deckId } },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

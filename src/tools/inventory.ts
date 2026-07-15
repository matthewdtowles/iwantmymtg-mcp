import { z } from "zod";
import { AUTH_HEADERS, apiClient, unwrap } from "../api-client.js";
import { cardIdSchema, limitParam, pageParam } from "./schemas.js";
import { defineTool } from "./types.js";

const inventoryItem = z.object({
  cardId: cardIdSchema.describe("Internal IWMM card UUID. Get from search_cards or get_card."),
  quantity: z
    .number()
    .int()
    .min(0)
    .describe("Total quantity for this card+finish. 0 removes the row."),
  isFoil: z
    .boolean()
    .describe("Whether this is the foil variant. Foil and non-foil are tracked as separate rows."),
});

export const listInventoryTool = defineTool({
  name: "list_inventory",
  requiresAuth: true,
  readOnly: true,
  description:
    "List the authenticated user's card inventory, paginated. Returns cards with quantities, prices, and metadata.",
  inputSchema: z.object({
    page: pageParam.optional(),
    limit: limitParam.optional(),
  }),
  handler: async (input: Record<string, unknown>) => {
    const { data, error } = await apiClient.GET("/api/v1/inventory", {
      params: { query: input },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const addInventoryTool = defineTool({
  name: "add_inventory",
  requiresAuth: true,
  description:
    "Add one or more cards to the authenticated user's inventory. Accepts a batch - pass a single-item array for one card. This is a real write. Use update_inventory to change quantities, remove_inventory to delete a row.",
  inputSchema: z.object({ items: z.array(inventoryItem).min(1) }),
  handler: async (input: { items: z.infer<typeof inventoryItem>[] }) => {
    const { data, error } = await apiClient.POST("/api/v1/inventory", {
      body: input.items,
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const updateInventoryTool = defineTool({
  name: "update_inventory",
  requiresAuth: true,
  description:
    "Update quantities for one or more existing inventory rows. Accepts a batch. Use remove_inventory to delete a row entirely.",
  inputSchema: z.object({ items: z.array(inventoryItem).min(1) }),
  handler: async (input: { items: z.infer<typeof inventoryItem>[] }) => {
    const { data, error } = await apiClient.PATCH("/api/v1/inventory", {
      body: input.items,
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const removeInventoryTool = defineTool({
  name: "remove_inventory",
  requiresAuth: true,
  destructive: true,
  description: "Remove a card+finish row from the authenticated user's inventory.",
  inputSchema: z.object({
    cardId: z.string().uuid(),
    isFoil: z.boolean(),
  }),
  handler: async (input: { cardId: string; isFoil: boolean }) => {
    const { data, error } = await apiClient.DELETE("/api/v1/inventory", {
      body: input,
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const getInventoryQuantitiesTool = defineTool({
  name: "get_inventory_quantities",
  requiresAuth: true,
  readOnly: true,
  description:
    "Batch lookup: given a list of card UUIDs, return how many of each (normal + foil) the user owns. Useful before recommending adds.",
  inputSchema: z.object({
    cardIds: z.array(z.string().uuid()).min(1).max(200),
  }),
  handler: async ({ cardIds }: { cardIds: string[] }) => {
    const { data, error } = await apiClient.GET("/api/v1/inventory/quantities", {
      params: { query: { cardIds: cardIds.join(",") } },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const importInventoryCardsTool = defineTool({
  name: "import_inventory_cards",
  requiresAuth: true,
  description:
    "Bulk-import cards into the authenticated user's inventory from pasted CSV text. Native header: name,set_code,number[,quantity][,foil]; Moxfield, Archidekt, Deckbox, and TCGPlayer exports are auto-detected. Returns counts of saved/deleted/skipped rows and per-row errors.",
  inputSchema: z.object({
    text: z.string().min(1).describe("CSV text including a header row."),
  }),
  handler: async (input: { text: string }) => {
    // The endpoint takes a multipart file upload; wrap the pasted text as a CSV file.
    const form = new FormData();
    form.append("file", new Blob([input.text], { type: "text/csv" }), "inventory.csv");
    const { data, error } = await apiClient.POST("/api/v1/inventory/import/cards", {
      // openapi-fetch types multipart bodies from the JSON schema (`{ file: string }`),
      // so the raw FormData needs a cast - this is a client limitation, not a spec gap.
      body: form as never,
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const exportInventoryTool = defineTool({
  name: "export_inventory",
  requiresAuth: true,
  readOnly: true,
  description:
    "Export the authenticated user's full card inventory as CSV (columns: id, name, set_code, number, quantity, foil). Reimport-compatible with import_inventory_cards.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/inventory/export", {
      headers: AUTH_HEADERS,
      parseAs: "text",
    });
    return unwrap(data, error);
  },
});

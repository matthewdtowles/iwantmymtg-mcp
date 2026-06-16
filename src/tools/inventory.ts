import { z } from "zod";
import { apiClient, AUTH_HEADERS, unwrap } from "../api-client.js";

const inventoryItem = z.object({
  cardId: z.string().uuid().describe("Internal IWMM card UUID. Get from search_cards or get_card."),
  quantity: z.number().int().min(0).describe("Total quantity for this card+finish. 0 removes the row."),
  isFoil: z.boolean().describe("Whether this is the foil variant. Foil and non-foil are tracked as separate rows."),
});

export const listInventoryTool = {
  name: "list_inventory",
  description:
    "List the authenticated user's card inventory, paginated. Returns cards with quantities, prices, and metadata. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  handler: async (input: Record<string, unknown>) => {
    const { data, error } = await apiClient.GET("/api/v1/inventory", {
      params: { query: input as never },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const addInventoryTool = {
  name: "add_inventory",
  description:
    "Add one or more cards to the authenticated user's inventory. Accepts a batch - pass a single-item array for one card. This is a real write. Use update_inventory to change quantities, remove_inventory to delete a row. Requires IWMM_API_KEY.",
  inputSchema: z.object({ items: z.array(inventoryItem).min(1) }),
  handler: async (input: { items: z.infer<typeof inventoryItem>[] }) => {
    const { data, error } = await apiClient.POST("/api/v1/inventory", {
      body: input.items as never,
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const updateInventoryTool = {
  name: "update_inventory",
  description:
    "Update quantities for one or more existing inventory rows. Accepts a batch. Use remove_inventory to delete a row entirely. Requires IWMM_API_KEY.",
  inputSchema: z.object({ items: z.array(inventoryItem).min(1) }),
  handler: async (input: { items: z.infer<typeof inventoryItem>[] }) => {
    const { data, error } = await apiClient.PATCH("/api/v1/inventory", {
      body: input.items as never,
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const removeInventoryTool = {
  name: "remove_inventory",
  description: "Remove a card+finish row from the authenticated user's inventory. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    cardId: z.string().uuid(),
    isFoil: z.boolean(),
  }),
  handler: async (input: { cardId: string; isFoil: boolean }) => {
    const { data, error } = await apiClient.DELETE("/api/v1/inventory", {
      body: input as never,
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const getInventoryQuantitiesTool = {
  name: "get_inventory_quantities",
  description:
    "Batch lookup: given a list of card UUIDs, return how many of each (normal + foil) the user owns. Useful before recommending adds. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    cardIds: z.array(z.string().uuid()).min(1).max(200),
  }),
  handler: async ({ cardIds }: { cardIds: string[] }) => {
    const { data, error } = await apiClient.GET("/api/v1/inventory/quantities", {
      params: { query: { cardIds: cardIds.join(",") } as never },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const importInventoryCardsTool = {
  name: "import_inventory_cards",
  description:
    "Bulk-import cards into the authenticated user's inventory from pasted CSV text. Native header: name,set_code,number[,quantity][,foil]; Moxfield, Archidekt, Deckbox, and TCGPlayer exports are auto-detected. Returns counts of saved/deleted/skipped rows and per-row errors. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    text: z.string().min(1).describe("CSV text including a header row."),
  }),
  handler: async (input: { text: string }) => {
    // The endpoint takes a multipart file upload; wrap the pasted text as a CSV file.
    const form = new FormData();
    form.append("file", new Blob([input.text], { type: "text/csv" }), "inventory.csv");
    const { data, error } = await apiClient.POST("/api/v1/inventory/import/cards", {
      body: form as never,
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const exportInventoryTool = {
  name: "export_inventory",
  description:
    "Export the authenticated user's full card inventory as CSV (columns: id, name, set_code, number, quantity, foil). Reimport-compatible with import_inventory_cards. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/inventory/export", {
      headers: AUTH_HEADERS,
      parseAs: "text",
    });
    return unwrap(data, error);
  },
};

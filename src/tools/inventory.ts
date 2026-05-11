import { z } from "zod";
import { apiFetch } from "../api-client.js";

const inventoryItem = z.object({
  cardId: z.string().uuid().describe("Internal IWMM card UUID. Get from search_cards or get_card."),
  quantity: z.number().int().min(0).describe("Total quantity for this card+finish. 0 removes the row."),
  isFoil: z.boolean().describe("Whether this is the foil variant. Foil and non-foil are tracked as separate rows."),
});

export const listInventoryTool = {
  name: "list_inventory",
  description:
    "List the authenticated user's card inventory, paginated. Requires IWMM_API_KEY. Returns cards with quantities, prices, and metadata.",
  inputSchema: z.object({
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  handler: (input: Record<string, unknown>) =>
    apiFetch({
      path: "/api/v1/inventory",
      query: input as Record<string, string | number | undefined>,
      authenticated: true,
    }),
};

export const addInventoryTool = {
  name: "add_inventory",
  description:
    "Add one or more cards to the authenticated user's inventory. Accepts a batch - pass a single-item array for one card. This is a real write. Use update_inventory to change quantities, remove_inventory to delete a row. Requires IWMM_API_KEY.",
  inputSchema: z.object({ items: z.array(inventoryItem).min(1) }),
  handler: (input: { items: z.infer<typeof inventoryItem>[] }) =>
    apiFetch({ path: "/api/v1/inventory", method: "POST", body: input.items, authenticated: true }),
};

export const updateInventoryTool = {
  name: "update_inventory",
  description:
    "Update quantities for one or more existing inventory rows. Accepts a batch. Use remove_inventory to delete a row entirely. Requires IWMM_API_KEY.",
  inputSchema: z.object({ items: z.array(inventoryItem).min(1) }),
  handler: (input: { items: z.infer<typeof inventoryItem>[] }) =>
    apiFetch({ path: "/api/v1/inventory", method: "PATCH", body: input.items, authenticated: true }),
};

export const removeInventoryTool = {
  name: "remove_inventory",
  description: "Remove a card+finish row from the authenticated user's inventory. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    cardId: z.string().uuid(),
    isFoil: z.boolean(),
  }),
  handler: (input: { cardId: string; isFoil: boolean }) =>
    apiFetch({ path: "/api/v1/inventory", method: "DELETE", body: input, authenticated: true }),
};

export const getInventoryQuantitiesTool = {
  name: "get_inventory_quantities",
  description:
    "Batch lookup: given a list of card UUIDs, return how many of each (normal + foil) the user owns. Useful before recommending adds. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    cardIds: z.array(z.string().uuid()).min(1).max(200),
  }),
  handler: ({ cardIds }: { cardIds: string[] }) =>
    apiFetch({
      path: "/api/v1/inventory/quantities",
      query: { cardIds: cardIds.join(",") },
      authenticated: true,
    }),
};

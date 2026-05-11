import { z } from "zod";
import { apiFetch } from "../api-client.js";

export const listInventoryTool = {
  name: "list_inventory",
  description:
    "List the authenticated user's card inventory. Requires IWMM_API_KEY. Returns cards with quantities, prices, and metadata.",
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

const inventoryItemSchema = {
  cardId: z.string().describe("Internal IWMM card UUID. Get this from search_cards or get_card."),
  quantity: z.number().int().min(0).describe("New total quantity for this card. 0 removes it."),
  isFoil: z.boolean().optional().describe("Whether this is the foil variant. Defaults to false."),
};

export const upsertInventoryTool = {
  name: "upsert_inventory",
  description:
    "Set the quantity of a specific card (and finish) in the authenticated user's inventory. This is a real write - quantities update immediately. Use quantity=0 to remove. Requires IWMM_API_KEY.",
  inputSchema: z.object(inventoryItemSchema),
  handler: (input: { cardId: string; quantity: number; isFoil?: boolean }) =>
    apiFetch({
      path: "/api/v1/inventory",
      method: "POST",
      body: input,
      authenticated: true,
    }),
};

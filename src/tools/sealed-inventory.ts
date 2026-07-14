import { z } from "zod";
import { apiClient, AUTH_HEADERS, unwrap } from "../api-client.js";
import { defineTool } from "./types.js";

/**
 * Sealed-product inventory (booster boxes, bundles, precons). Mirrors card
 * inventory but keyed by sealed product UUID. Writes are Premium-gated. The
 * API's POST and PATCH both upsert the absolute quantity, so a single
 * set_sealed_inventory tool covers add and update.
 */

const sealedProductUuid = z
  .string()
  .uuid()
  .describe("Sealed product UUID. Get it from get_sealed_products or get_sealed_product.");

export const listSealedInventoryTool = defineTool({
  name: "list_sealed_inventory",
  requiresAuth: true,
  readOnly: true,
  description:
    "List the authenticated user's sealed-product inventory (booster boxes, bundles, precons), paginated, with quantities and prices. For loose cards use list_inventory.",
  inputSchema: z.object({
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  handler: async (input: Record<string, unknown>) => {
    const { data, error } = await apiClient.GET("/api/v1/inventory/sealed", {
      params: { query: input as never },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const setSealedInventoryTool = defineTool({
  name: "set_sealed_inventory",
  requiresAuth: true,
  description:
    "Add or update a sealed product in the authenticated user's inventory by setting its absolute quantity (upserts the row for that product). This is a real write and is Premium-gated. Use remove_sealed_inventory to delete a row.",
  inputSchema: z.object({
    sealedProductUuid,
    quantity: z.number().int().min(1).describe("Absolute quantity to set for this product."),
  }),
  handler: async (input: { sealedProductUuid: string; quantity: number }) => {
    const { data, error } = await apiClient.POST("/api/v1/inventory/sealed", {
      body: input,
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const removeSealedInventoryTool = defineTool({
  name: "remove_sealed_inventory",
  requiresAuth: true,
  destructive: true,
  description:
    "Remove a sealed product from the authenticated user's inventory entirely. Premium-gated.",
  inputSchema: z.object({ sealedProductUuid }),
  handler: async (input: { sealedProductUuid: string }) => {
    const { data, error } = await apiClient.DELETE("/api/v1/inventory/sealed", {
      body: input,
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

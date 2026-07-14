import { z } from "zod";
import { AUTH_HEADERS, apiClient, unwrap } from "../api-client.js";
import { defineTool } from "./types.js";

const thresholdRefinement = (v: { increasePct?: number | null; decreasePct?: number | null }) =>
  v.increasePct != null || v.decreasePct != null;

export const listAlertsTool = defineTool({
  name: "list_price_alerts",
  requiresAuth: true,
  readOnly: true,
  description:
    "List the authenticated user's price alerts. Free tier is capped at 5 active alerts and a single threshold direction per alert; Premium removes both limits.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/price-alerts", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const createAlertTool = defineTool({
  name: "create_price_alert",
  requiresAuth: true,
  description:
    "Create a price alert for a card. Supply increasePct, decreasePct, or both (Premium). At least one threshold is required.",
  inputSchema: z
    .object({
      cardId: z.string().uuid().describe("Internal IWMM card UUID."),
      increasePct: z
        .number()
        .min(0.01)
        .optional()
        .describe("Trigger when price increases by at least this percent."),
      decreasePct: z
        .number()
        .min(0.01)
        .optional()
        .describe("Trigger when price decreases by at least this percent."),
    })
    .refine(thresholdRefinement, {
      message: "Provide at least one of increasePct or decreasePct.",
    }),
  handler: async (input: { cardId: string; increasePct?: number; decreasePct?: number }) => {
    const { data, error } = await apiClient.POST("/api/v1/price-alerts", {
      body: input as never,
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const updateAlertTool = defineTool({
  name: "update_price_alert",
  requiresAuth: true,
  description:
    "Update an existing price alert. Pass null for a threshold to clear it (Premium only - free users must keep exactly one direction). isActive toggles enable/disable without deleting.",
  inputSchema: z
    .object({
      id: z.coerce.number().int().describe("Alert ID from list_price_alerts."),
      increasePct: z.number().min(0.01).nullable().optional(),
      decreasePct: z.number().min(0.01).nullable().optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (v) => v.increasePct !== undefined || v.decreasePct !== undefined || v.isActive !== undefined,
      { message: "Provide at least one of increasePct, decreasePct, or isActive." },
    ),
  handler: async ({ id, ...patch }: { id: number } & Record<string, unknown>) => {
    const { data, error } = await apiClient.PATCH("/api/v1/price-alerts/{id}", {
      params: { path: { id } },
      body: patch as never,
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const deleteAlertTool = defineTool({
  name: "delete_price_alert",
  requiresAuth: true,
  destructive: true,
  description: "Delete a price alert by ID.",
  inputSchema: z.object({ id: z.coerce.number().int() }),
  handler: async ({ id }: { id: number }) => {
    const { data, error } = await apiClient.DELETE("/api/v1/price-alerts/{id}", {
      params: { path: { id } },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

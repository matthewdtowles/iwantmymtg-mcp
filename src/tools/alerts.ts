import { z } from "zod";
import { apiFetch } from "../api-client.js";

const thresholdRefinement = (v: { increasePct?: number | null; decreasePct?: number | null }) =>
  v.increasePct != null || v.decreasePct != null;

export const listAlertsTool = {
  name: "list_price_alerts",
  description:
    "List the authenticated user's price alerts. Free tier is capped at 5 active alerts and a single threshold direction per alert; Premium removes both limits. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: () => apiFetch({ path: "/api/v1/price-alerts", authenticated: true }),
};

export const createAlertTool = {
  name: "create_price_alert",
  description:
    "Create a price alert for a card. Supply increasePct, decreasePct, or both (Premium). At least one threshold is required. Requires IWMM_API_KEY.",
  inputSchema: z
    .object({
      cardId: z.string().uuid().describe("Internal IWMM card UUID."),
      increasePct: z.number().min(0.01).optional().describe("Trigger when price increases by at least this percent."),
      decreasePct: z.number().min(0.01).optional().describe("Trigger when price decreases by at least this percent."),
    })
    .refine(thresholdRefinement, { message: "Provide at least one of increasePct or decreasePct." }),
  handler: (input: { cardId: string; increasePct?: number; decreasePct?: number }) =>
    apiFetch({ path: "/api/v1/price-alerts", method: "POST", body: input, authenticated: true }),
};

export const updateAlertTool = {
  name: "update_price_alert",
  description:
    "Update an existing price alert. Pass null for a threshold to clear it (Premium only - free users must keep exactly one direction). isActive toggles enable/disable without deleting. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    id: z.string().describe("Alert ID from list_price_alerts."),
    increasePct: z.number().min(0.01).nullable().optional(),
    decreasePct: z.number().min(0.01).nullable().optional(),
    isActive: z.boolean().optional(),
  }),
  handler: ({ id, ...patch }: { id: string } & Record<string, unknown>) =>
    apiFetch({ path: `/api/v1/price-alerts/${encodeURIComponent(id)}`, method: "PATCH", body: patch, authenticated: true }),
};

export const deleteAlertTool = {
  name: "delete_price_alert",
  description: "Delete a price alert by ID. Requires IWMM_API_KEY.",
  inputSchema: z.object({ id: z.string() }),
  handler: ({ id }: { id: string }) =>
    apiFetch({ path: `/api/v1/price-alerts/${encodeURIComponent(id)}`, method: "DELETE", authenticated: true }),
};

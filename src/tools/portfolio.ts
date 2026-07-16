import { z } from "zod";
import { AUTH_HEADERS, apiClient, unwrap } from "../api-client.js";
import { defineTool } from "./types.js";

/** The colors filter only applies to the by=color breakdown; drop it otherwise (I9). */
const colorsForBy = (by: string, colors?: string): string | undefined =>
  by === "color" ? colors : undefined;

export const getPortfolioSummaryTool = defineTool({
  name: "get_portfolio_summary",
  requiresAuth: true,
  readOnly: true,
  description:
    "Get the authenticated user's portfolio summary - current value, total invested, unrealized P&L, ROI, card/unit counts. Free tier sees current value + total invested only; Premium gets the full P&L set.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/portfolio", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const getPortfolioHistoryTool = defineTool({
  name: "get_portfolio_history",
  requiresAuth: true,
  readOnly: true,
  description: "Get portfolio value history. Premium-gated - free tier receives 403.",
  inputSchema: z.object({
    days: z
      .number()
      .int()
      .min(1)
      .max(3650)
      .optional()
      .describe("How many days of history. Server default applies if omitted."),
  }),
  handler: async ({ days }: { days?: number }) => {
    const { data, error } = await apiClient.GET("/api/v1/portfolio/history", {
      params: { query: { days } },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const getCardPerformanceTool = defineTool({
  name: "get_card_performance",
  requiresAuth: true,
  readOnly: true,
  description:
    "Get the user's best- or worst-performing cards by P&L. Default: best, top 10. Premium-gated.",
  inputSchema: z.object({
    type: z.enum(["best", "worst"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  handler: async (input: { type?: "best" | "worst"; limit?: number }) => {
    const { data, error } = await apiClient.GET("/api/v1/portfolio/performance", {
      params: { query: input },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const getCashFlowTool = defineTool({
  name: "get_cash_flow",
  requiresAuth: true,
  readOnly: true,
  description:
    "Get the user's cash flow (money in vs money out from BUY/SELL transactions). Premium-gated.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/portfolio/cash-flow", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const getRealizedGainsTool = defineTool({
  name: "get_realized_gains",
  requiresAuth: true,
  readOnly: true,
  description:
    "Get the user's realized gains from SELL transactions using FIFO cost basis. Premium-gated.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/portfolio/realized-gains", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const getPortfolioBreakdownTool = defineTool({
  name: "get_portfolio_breakdown",
  requiresAuth: true,
  readOnly: true,
  description:
    "Get the user's collection value broken down by a dimension into slices (each with value, count, and share). Premium-gated. Use get_portfolio_breakdown_cards to drill into one slice.",
  inputSchema: z.object({
    by: z
      .enum(["set", "rarity", "type", "color", "cost-basis"])
      .describe(
        "Dimension to break down by. 'cost-basis' buckets are gain/loss/at-cost; 'color' groups by color identity.",
      ),
    colors: z
      .string()
      .optional()
      .describe(
        "Only for by=color: comma-separated identity codes (W,U,B,R,G,C; C is colorless) to keep only cards whose color identity contains all of them. Ignored for other dimensions.",
      ),
  }),
  handler: async (input: { by: string; colors?: string }) => {
    const { data, error } = await apiClient.GET("/api/v1/portfolio/breakdown", {
      params: { query: { by: input.by, colors: colorsForBy(input.by, input.colors) } },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const getPortfolioBreakdownCardsTool = defineTool({
  name: "get_portfolio_breakdown_cards",
  requiresAuth: true,
  readOnly: true,
  description:
    "Get the cards inside one slice of a portfolio breakdown (the drill-down for get_portfolio_breakdown). Premium-gated.",
  inputSchema: z.object({
    by: z
      .enum(["set", "rarity", "type", "color", "cost-basis"])
      .describe("Dimension the slice belongs to. Must match the get_portfolio_breakdown call."),
    key: z
      .string()
      .describe(
        "Slice key from the breakdown: a set code, rarity, type, cost-basis bucket, or color code.",
      ),
    colors: z
      .string()
      .optional()
      .describe(
        "Only for by=color: the same superset filter (W,U,B,R,G,C) passed to get_portfolio_breakdown, so the drill-down matches the aggregate row. Ignored for other dimensions.",
      ),
  }),
  handler: async (input: { by: string; key: string; colors?: string }) => {
    const { data, error } = await apiClient.GET("/api/v1/portfolio/breakdown/cards", {
      params: {
        query: { by: input.by, key: input.key, colors: colorsForBy(input.by, input.colors) },
      },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const refreshPortfolioTool = defineTool({
  name: "refresh_portfolio",
  requiresAuth: true,
  description:
    "Recalculate the user's portfolio P&L. Use after recording a batch of transactions if you want immediate fresh numbers.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.POST("/api/v1/portfolio/refresh", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

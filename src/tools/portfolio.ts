import { z } from "zod";
import { apiClient, AUTH_HEADERS, unwrap } from "../api-client.js";

export const getPortfolioSummaryTool = {
  name: "get_portfolio_summary",
  description:
    "Get the authenticated user's portfolio summary - current value, total invested, unrealized P&L, ROI, card/unit counts. Free tier sees current value + total invested only; Premium gets the full P&L set. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/portfolio", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const getPortfolioHistoryTool = {
  name: "get_portfolio_history",
  description:
    "Get portfolio value history. Premium-gated - free tier receives 403. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    days: z.number().int().min(1).max(3650).optional().describe("How many days of history. Server default applies if omitted."),
  }),
  handler: async ({ days }: { days?: number }) => {
    const { data, error } = await apiClient.GET("/api/v1/portfolio/history", {
      params: { query: { days } as never },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const getCardPerformanceTool = {
  name: "get_card_performance",
  description:
    "Get the user's best- or worst-performing cards by P&L. Default: best, top 10. Premium-gated. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    type: z.enum(["best", "worst"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  handler: async (input: { type?: "best" | "worst"; limit?: number }) => {
    const { data, error } = await apiClient.GET("/api/v1/portfolio/performance", {
      params: { query: input as never },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const getCashFlowTool = {
  name: "get_cash_flow",
  description:
    "Get the user's cash flow (money in vs money out from BUY/SELL transactions). Premium-gated. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/portfolio/cash-flow", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const getRealizedGainsTool = {
  name: "get_realized_gains",
  description:
    "Get the user's realized gains from SELL transactions using FIFO cost basis. Premium-gated. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/portfolio/realized-gains", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const getPortfolioBreakdownTool = {
  name: "get_portfolio_breakdown",
  description:
    "Get the user's collection value broken down by a dimension. Premium-gated. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    by: z
      .enum(["set", "rarity", "type", "format", "cost-basis"])
      .describe("Dimension to break down by. 'cost-basis' buckets are gain/loss/at-cost."),
  }),
  handler: async ({ by }: { by: string }) => {
    const { data, error } = await apiClient.GET("/api/v1/portfolio/breakdown", {
      params: { query: { by } as never },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const refreshPortfolioTool = {
  name: "refresh_portfolio",
  description:
    "Recalculate the user's portfolio P&L. Use after recording a batch of transactions if you want immediate fresh numbers. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.POST("/api/v1/portfolio/refresh", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

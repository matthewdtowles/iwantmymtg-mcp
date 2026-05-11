import { z } from "zod";
import { apiFetch } from "../api-client.js";

export const getPortfolioSummaryTool = {
  name: "get_portfolio_summary",
  description:
    "Get the authenticated user's portfolio summary - current value, total invested, unrealized P&L, ROI, card/unit counts. Free tier sees current value + total invested only; Premium gets the full P&L set. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: () => apiFetch({ path: "/api/v1/portfolio", authenticated: true }),
};

export const getPortfolioHistoryTool = {
  name: "get_portfolio_history",
  description:
    "Get portfolio value history. Premium-gated - free tier receives 403. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    days: z.number().int().min(1).max(3650).optional().describe("How many days of history. Server default applies if omitted."),
  }),
  handler: ({ days }: { days?: number }) =>
    apiFetch({ path: "/api/v1/portfolio/history", query: { days }, authenticated: true }),
};

export const getCardPerformanceTool = {
  name: "get_card_performance",
  description:
    "Get the user's best- or worst-performing cards by P&L. Default: best, top 10. Premium-gated. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    type: z.enum(["best", "worst"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  handler: (input: { type?: "best" | "worst"; limit?: number }) =>
    apiFetch({ path: "/api/v1/portfolio/performance", query: input, authenticated: true }),
};

export const getCashFlowTool = {
  name: "get_cash_flow",
  description:
    "Get the user's cash flow (money in vs money out from BUY/SELL transactions). Premium-gated. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: () => apiFetch({ path: "/api/v1/portfolio/cash-flow", authenticated: true }),
};

export const getRealizedGainsTool = {
  name: "get_realized_gains",
  description:
    "Get the user's realized gains from SELL transactions using FIFO cost basis. Premium-gated. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: () => apiFetch({ path: "/api/v1/portfolio/realized-gains", authenticated: true }),
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
  handler: ({ by }: { by: string }) =>
    apiFetch({ path: "/api/v1/portfolio/breakdown", query: { by }, authenticated: true }),
};

export const refreshPortfolioTool = {
  name: "refresh_portfolio",
  description:
    "Recalculate the user's portfolio P&L. Use after recording a batch of transactions if you want immediate fresh numbers. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: () => apiFetch({ path: "/api/v1/portfolio/refresh", method: "POST", authenticated: true }),
};

import type { z } from "zod";
import { searchCardsTool } from "./search-cards.js";
import { getCardTool, getCardPricesTool, getCardPriceHistoryTool } from "./get-card.js";
import { searchSetsTool, getSetTool, listSetCardsTool, getSealedProductsTool } from "./sets.js";
import {
  listInventoryTool,
  addInventoryTool,
  updateInventoryTool,
  removeInventoryTool,
  getInventoryQuantitiesTool,
} from "./inventory.js";
import {
  listTransactionsTool,
  recordTransactionTool,
  updateTransactionTool,
  deleteTransactionTool,
  getCostBasisTool,
} from "./transactions.js";
import {
  getPortfolioSummaryTool,
  getPortfolioHistoryTool,
  getCardPerformanceTool,
  getCashFlowTool,
  getRealizedGainsTool,
  getPortfolioBreakdownTool,
  refreshPortfolioTool,
} from "./portfolio.js";
import {
  listAlertsTool,
  createAlertTool,
  updateAlertTool,
  deleteAlertTool,
} from "./alerts.js";
import {
  listNotificationsTool,
  getUnreadCountTool,
  markNotificationReadTool,
  markAllNotificationsReadTool,
} from "./notifications.js";
import {
  getCardBuylistTool,
  getMarketSellValueTool,
  getCashVsCreditTool,
} from "./sell-tools.js";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  handler: (input: any) => Promise<unknown>;
}

export const tools: ToolDefinition[] = [
  // Read-only (no auth)
  searchCardsTool,
  getCardTool,
  getCardPricesTool,
  getCardPriceHistoryTool,
  searchSetsTool,
  getSetTool,
  listSetCardsTool,
  getSealedProductsTool,
  getCardBuylistTool,
  // Sell tools (auth)
  getMarketSellValueTool,
  getCashVsCreditTool,
  // Inventory (auth)
  listInventoryTool,
  getInventoryQuantitiesTool,
  addInventoryTool,
  updateInventoryTool,
  removeInventoryTool,
  // Transactions (auth)
  listTransactionsTool,
  recordTransactionTool,
  updateTransactionTool,
  deleteTransactionTool,
  getCostBasisTool,
  // Portfolio (auth; most are Premium-gated)
  getPortfolioSummaryTool,
  getPortfolioHistoryTool,
  getCardPerformanceTool,
  getCashFlowTool,
  getRealizedGainsTool,
  getPortfolioBreakdownTool,
  refreshPortfolioTool,
  // Price alerts (auth)
  listAlertsTool,
  createAlertTool,
  updateAlertTool,
  deleteAlertTool,
  // Notifications (auth)
  listNotificationsTool,
  getUnreadCountTool,
  markNotificationReadTool,
  markAllNotificationsReadTool,
];

export const toolsByName: Record<string, ToolDefinition> = Object.fromEntries(
  tools.map((t) => [t.name, t]),
);

import { createAlertTool, deleteAlertTool, listAlertsTool, updateAlertTool } from "./alerts.js";
import {
  addBuyListTool,
  importBuyListTool,
  listBuyListTool,
  removeBuyListTool,
  updateBuyListTool,
} from "./buy-list.js";
import {
  addDeckCardTool,
  createDeckTool,
  deckMissingToBuyListTool,
  deleteDeckTool,
  getDeckTool,
  importDeckTool,
  listDecksTool,
  removeDeckCardTool,
  setDeckCardQuantityTool,
  updateDeckTool,
} from "./decks.js";
import { getCardPriceHistoryTool, getCardPricesTool, getCardTool } from "./get-card.js";
import {
  addInventoryTool,
  exportInventoryTool,
  getInventoryQuantitiesTool,
  importInventoryCardsTool,
  listInventoryTool,
  removeInventoryTool,
  updateInventoryTool,
} from "./inventory.js";
import {
  getUnreadCountTool,
  listNotificationsTool,
  markAllNotificationsReadTool,
  markNotificationReadTool,
} from "./notifications.js";
import {
  getCardPerformanceTool,
  getCashFlowTool,
  getPortfolioBreakdownCardsTool,
  getPortfolioBreakdownTool,
  getPortfolioHistoryTool,
  getPortfolioSummaryTool,
  getRealizedGainsTool,
  refreshPortfolioTool,
} from "./portfolio.js";
import {
  listSealedInventoryTool,
  removeSealedInventoryTool,
  setSealedInventoryTool,
} from "./sealed-inventory.js";
import { searchCardsTool } from "./search-cards.js";
import { getCardBuylistTool, getCashVsCreditTool, getMarketSellValueTool } from "./sell-tools.js";
import {
  getSealedProductTool,
  getSealedProductsTool,
  getSetPriceHistoryTool,
  getSetTool,
  listSetCardsTool,
  searchSetsTool,
} from "./sets.js";
import {
  deleteTransactionTool,
  getCostBasisTool,
  listTransactionsTool,
  recordTransactionTool,
  updateTransactionTool,
} from "./transactions.js";
import type { ToolDefinition } from "./types.js";

export type { ToolDefinition };

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
  getSealedProductTool,
  getSetPriceHistoryTool,
  getCardBuylistTool,
  // Sell tools (auth)
  getMarketSellValueTool,
  getCashVsCreditTool,
  // Buy-list / want-list (auth)
  listBuyListTool,
  addBuyListTool,
  updateBuyListTool,
  removeBuyListTool,
  importBuyListTool,
  // Inventory (auth)
  listInventoryTool,
  getInventoryQuantitiesTool,
  addInventoryTool,
  updateInventoryTool,
  removeInventoryTool,
  importInventoryCardsTool,
  exportInventoryTool,
  // Sealed-product inventory (auth; writes Premium)
  listSealedInventoryTool,
  setSealedInventoryTool,
  removeSealedInventoryTool,
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
  getPortfolioBreakdownCardsTool,
  refreshPortfolioTool,
  // Decks (auth)
  listDecksTool,
  getDeckTool,
  createDeckTool,
  importDeckTool,
  updateDeckTool,
  deleteDeckTool,
  addDeckCardTool,
  setDeckCardQuantityTool,
  removeDeckCardTool,
  deckMissingToBuyListTool,
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

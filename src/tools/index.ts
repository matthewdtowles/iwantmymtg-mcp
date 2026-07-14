import type { ToolDefinition } from "./types.js";
import { searchCardsTool } from "./search-cards.js";
import { getCardTool, getCardPricesTool, getCardPriceHistoryTool } from "./get-card.js";
import {
  searchSetsTool,
  getSetTool,
  listSetCardsTool,
  getSealedProductsTool,
  getSetPriceHistoryTool,
  getSealedProductTool,
} from "./sets.js";
import {
  listInventoryTool,
  addInventoryTool,
  updateInventoryTool,
  removeInventoryTool,
  getInventoryQuantitiesTool,
  importInventoryCardsTool,
  exportInventoryTool,
} from "./inventory.js";
import {
  listSealedInventoryTool,
  setSealedInventoryTool,
  removeSealedInventoryTool,
} from "./sealed-inventory.js";
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
  getPortfolioBreakdownCardsTool,
  refreshPortfolioTool,
} from "./portfolio.js";
import {
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
} from "./decks.js";
import { listAlertsTool, createAlertTool, updateAlertTool, deleteAlertTool } from "./alerts.js";
import {
  listNotificationsTool,
  getUnreadCountTool,
  markNotificationReadTool,
  markAllNotificationsReadTool,
} from "./notifications.js";
import { getCardBuylistTool, getMarketSellValueTool, getCashVsCreditTool } from "./sell-tools.js";
import {
  listBuyListTool,
  addBuyListTool,
  updateBuyListTool,
  removeBuyListTool,
  importBuyListTool,
} from "./buy-list.js";

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

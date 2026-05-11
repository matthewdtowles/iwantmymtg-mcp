import type { z } from "zod";
import { searchCardsTool } from "./search-cards.js";
import { getCardTool, getCardPricesTool, getCardPriceHistoryTool } from "./get-card.js";
import { searchSetsTool, getSetTool, listSetCardsTool, getSealedProductsTool } from "./sets.js";
import { listInventoryTool, upsertInventoryTool } from "./inventory.js";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
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
  // Authenticated
  listInventoryTool,
  upsertInventoryTool,
];

export const toolsByName: Record<string, ToolDefinition> = Object.fromEntries(
  tools.map((t) => [t.name, t]),
);

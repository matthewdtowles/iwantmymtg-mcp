import { z } from "zod";
import { apiClient, AUTH_HEADERS, unwrap } from "../api-client.js";
import { defineTool } from "./types.js";

const transactionCreate = z.object({
  cardId: z.string().describe("Internal IWMM card UUID."),
  type: z.enum(["BUY", "SELL"]),
  quantity: z.number().int().min(1),
  pricePerUnit: z.number().min(0).describe("Per-unit price in USD."),
  isFoil: z.boolean(),
  date: z.string().describe("ISO 8601 date (YYYY-MM-DD)."),
  source: z.string().optional().describe("Where the transaction happened (e.g. 'TCGPlayer', 'LGS')."),
  fees: z.number().min(0).optional(),
  notes: z.string().optional(),
  skipInventorySync: z
    .boolean()
    .optional()
    .describe("If true, record the transaction without adjusting inventory. Default false - transactions normally update inventory."),
});

const transactionUpdate = z.object({
  quantity: z.number().int().min(1).optional(),
  pricePerUnit: z.number().min(0).optional(),
  date: z.string().optional(),
  source: z.string().optional(),
  fees: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const listTransactionsTool = defineTool({
  name: "list_transactions",
  requiresAuth: true,
  readOnly: true,
  description:
    "List the authenticated user's transactions, paginated. Supports sort/filter query params. Free tier sees the last 30 days only; Premium gets full history.",
  inputSchema: z.object({
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    sort: z.string().optional().describe("Sort key (e.g. TX_DATE, TX_TYPE, TX_CARD, TX_PRICE)."),
    order: z.enum(["asc", "desc"]).optional(),
    type: z.enum(["BUY", "SELL"]).optional(),
  }),
  handler: async (input: Record<string, unknown>) => {
    const { data, error } = await apiClient.GET("/api/v1/transactions", {
      params: { query: input as never },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const recordTransactionTool = defineTool({
  name: "record_transaction",
  requiresAuth: true,
  description:
    "Record a buy or sell transaction. By default this also adjusts inventory (BUY adds, SELL subtracts). This is a real write.",
  inputSchema: transactionCreate,
  handler: async (input: z.infer<typeof transactionCreate>) => {
    const { data, error } = await apiClient.POST("/api/v1/transactions", {
      body: input as never,
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const updateTransactionTool = defineTool({
  name: "update_transaction",
  requiresAuth: true,
  description:
    "Update an existing transaction by ID. Only the fields supplied are changed. Card identity and type (BUY/SELL) cannot be changed via this endpoint - delete and re-create instead.",
  inputSchema: z.object({
    id: z.number().int().min(1).describe("Transaction ID from list_transactions."),
    patch: transactionUpdate,
  }),
  handler: async ({ id, patch }: { id: number; patch: z.infer<typeof transactionUpdate> }) => {
    const { data, error } = await apiClient.PUT("/api/v1/transactions/{id}", {
      params: { path: { id } as never },
      body: patch as never,
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const deleteTransactionTool = defineTool({
  name: "delete_transaction",
  requiresAuth: true,
  destructive: true,
  description: "Delete a transaction by ID.",
  inputSchema: z.object({ id: z.number().int().min(1) }),
  handler: async ({ id }: { id: number }) => {
    const { data, error } = await apiClient.DELETE("/api/v1/transactions/{id}", {
      params: { path: { id } as never },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const getCostBasisTool = defineTool({
  name: "get_cost_basis",
  requiresAuth: true,
  readOnly: true,
  description:
    "Get FIFO cost basis for a specific card+finish for the authenticated user. Pass either cardId or (setCode, setNumber).",
  inputSchema: z
    .object({
      cardId: z.string().optional(),
      setCode: z.string().optional(),
      setNumber: z.string().optional(),
      isFoil: z.boolean().default(false),
    })
    .refine((v) => !!v.cardId || (!!v.setCode && !!v.setNumber), {
      message: "Provide either cardId, or both setCode and setNumber.",
    }),
  handler: async (input: { cardId?: string; setCode?: string; setNumber?: string; isFoil: boolean }) => {
    const query = { isFoil: input.isFoil } as never;
    if (input.cardId) {
      const { data, error } = await apiClient.GET("/api/v1/transactions/cost-basis/{cardId}", {
        params: { path: { cardId: input.cardId }, query },
        headers: AUTH_HEADERS,
      });
      return unwrap(data, error);
    }
    const { data, error } = await apiClient.GET(
      "/api/v1/transactions/cost-basis/{setCode}/{setNumber}",
      {
        params: { path: { setCode: input.setCode!, setNumber: input.setNumber! }, query },
        headers: AUTH_HEADERS,
      },
    );
    return unwrap(data, error);
  },
});

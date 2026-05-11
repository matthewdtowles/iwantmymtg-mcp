import { z } from "zod";
import { apiFetch } from "../api-client.js";

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

export const listTransactionsTool = {
  name: "list_transactions",
  description:
    "List the authenticated user's transactions, paginated. Supports sort/filter query params. Free tier sees the last 30 days only; Premium gets full history. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    sort: z.string().optional().describe("Sort key (e.g. TX_DATE, TX_TYPE, TX_CARD, TX_PRICE)."),
    order: z.enum(["asc", "desc"]).optional(),
    type: z.enum(["BUY", "SELL"]).optional(),
  }),
  handler: (input: Record<string, unknown>) =>
    apiFetch({
      path: "/api/v1/transactions",
      query: input as Record<string, string | number | undefined>,
      authenticated: true,
    }),
};

export const recordTransactionTool = {
  name: "record_transaction",
  description:
    "Record a buy or sell transaction. By default this also adjusts inventory (BUY adds, SELL subtracts). This is a real write. Requires IWMM_API_KEY.",
  inputSchema: transactionCreate,
  handler: (input: z.infer<typeof transactionCreate>) =>
    apiFetch({ path: "/api/v1/transactions", method: "POST", body: input, authenticated: true }),
};

export const updateTransactionTool = {
  name: "update_transaction",
  description:
    "Update an existing transaction by ID. Only the fields supplied are changed. Card identity and type (BUY/SELL) cannot be changed via this endpoint - delete and re-create instead. Requires IWMM_API_KEY.",
  inputSchema: z.object({
    id: z.number().int().min(1).describe("Transaction ID from list_transactions."),
    patch: transactionUpdate,
  }),
  handler: ({ id, patch }: { id: number; patch: z.infer<typeof transactionUpdate> }) =>
    apiFetch({ path: `/api/v1/transactions/${id}`, method: "PATCH", body: patch, authenticated: true }),
};

export const deleteTransactionTool = {
  name: "delete_transaction",
  description: "Delete a transaction by ID. Requires IWMM_API_KEY.",
  inputSchema: z.object({ id: z.number().int().min(1) }),
  handler: ({ id }: { id: number }) =>
    apiFetch({ path: `/api/v1/transactions/${id}`, method: "DELETE", authenticated: true }),
};

export const getCostBasisTool = {
  name: "get_cost_basis",
  description:
    "Get FIFO cost basis for a specific card+finish for the authenticated user. Pass either cardId or (setCode, setNumber). Requires IWMM_API_KEY.",
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
  handler: (input: { cardId?: string; setCode?: string; setNumber?: string; isFoil: boolean }) => {
    const query = { isFoil: input.isFoil };
    const path = input.cardId
      ? `/api/v1/transactions/cost-basis/${encodeURIComponent(input.cardId)}`
      : `/api/v1/transactions/cost-basis/${encodeURIComponent(input.setCode!)}/${encodeURIComponent(input.setNumber!)}`;
    return apiFetch({ path, query, authenticated: true });
  },
};

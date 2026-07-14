import type { z } from "zod";

/**
 * The tool contract (the port, in hexagonal terms). Generic over its zod input
 * schema so the handler's input type is *inferred* from the schema via
 * `z.output<S>` - no hand-written handler-input types to drift from the schema,
 * and a schema/handler mismatch is a compile error.
 *
 * Auth-ness and write-ness are structured metadata, not description prose:
 * - `requiresAuth` is the single source of truth for whether the tool needs
 *   `IWMM_API_KEY`. It drives the docs bucketing (`gen-tools-doc`), the
 *   description suffix (`server.ts`), and the auth invariant test.
 * - `readOnly` / `destructive` become the MCP `readOnlyHint` / `destructiveHint`
 *   annotations so clients can gate destructive calls (e.g. `delete_deck`).
 */
export interface ToolDefinition<S extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  requiresAuth: boolean;
  /** No writes. Emitted as MCP `readOnlyHint: true`. */
  readOnly?: boolean;
  /** Irreversible delete. Emitted as MCP `destructiveHint: true`. */
  destructive?: boolean;
  inputSchema: S;
  handler: (input: z.output<S>) => Promise<unknown>;
}

/**
 * Identity factory that pins the generic to the tool's own schema, so
 * `handler`'s parameter is checked against `z.output<S>` at the definition
 * site. Declare every tool through this.
 */
// Returns the *erased* `ToolDefinition` (not `ToolDefinition<S>`): the
// schema↔handler check happens on the argument at the call site, while the
// widened return lets every tool live in a single `ToolDefinition[]` (the type
// is invariant in `S`, so the narrow form would not be assignable).
export function defineTool<S extends z.ZodTypeAny>(
  tool: ToolDefinition<S>,
): ToolDefinition {
  // Safe erasure: at runtime the object is identical; `ToolDefinition` is
  // invariant in `S` (handler param is contravariant), so a direct cast is
  // rejected and we go through `unknown`.
  return tool as unknown as ToolDefinition;
}

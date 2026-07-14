import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  type CallToolResult,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { tools, toolsByName } from "./tools/index.js";
import { formatError } from "./error-formatter.js";
import { VERSION } from "./version.js";

/** Build the `ListTools` response from the registry. */
export function listTools() {
  return {
    tools: tools.map((t) => ({
      name: t.name,
      // The API-key requirement is derived from `requiresAuth`, not hand-typed
      // into each description, so the three consumers (docs, this suffix, the
      // test) can't drift.
      description: t.requiresAuth ? `${t.description} Requires IWMM_API_KEY.` : t.description,
      // Default (jsonSchema7) target: MCP inputSchema is JSON Schema, and the
      // openApi3 target's `nullable: true` breaks clients that validate
      // strictly (nullable fields like update_price_alert's thresholds).
      inputSchema: zodToJsonSchema(t.inputSchema) as Record<string, unknown>,
      // Structured hints so clients can gate destructive calls (e.g.
      // delete_deck) rather than parsing the description prose.
      annotations: {
        ...(t.readOnly ? { readOnlyHint: true } : {}),
        ...(t.destructive ? { destructiveHint: true } : {}),
      },
    })),
  };
}

/**
 * Run one tool call and return its MCP result. Exported (rather than inlined in
 * the request handler) so the four branches - unknown tool, invalid arguments,
 * thrown ApiError, and undefined/string/object results - are unit-testable.
 */
export async function handleCallTool(name: string, rawArgs: unknown): Promise<CallToolResult> {
  const tool = toolsByName[name];
  if (!tool) {
    return {
      isError: true,
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
    };
  }

  const args = tool.inputSchema.safeParse(rawArgs ?? {});
  if (!args.success) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Invalid arguments for ${tool.name}: ${args.error.message}`,
        },
      ],
    };
  }

  try {
    const result = await tool.handler(args.data);
    // Strings (e.g. CSV exports) pass through unencoded; empty-body
    // responses (204s) resolve undefined, which JSON.stringify would turn
    // into a text block with no `text` field - invalid MCP content.
    const text =
      result === undefined
        ? "OK"
        : typeof result === "string"
          ? result
          : JSON.stringify(result, null, 2);
    return { content: [{ type: "text", text }] };
  } catch (err) {
    return { isError: true, content: [{ type: "text", text: formatError(err) }] };
  }
}

export async function startServer() {
  const server = new Server(
    {
      name: "iwantmymtg-mcp",
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => listTools());

  server.setRequestHandler(CallToolRequestSchema, async (req) =>
    handleCallTool(req.params.name, req.params.arguments),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

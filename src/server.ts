import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { tools, toolsByName } from "./tools/index.js";
import { formatError } from "./error-formatter.js";
import { VERSION } from "./version.js";

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

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      // The API-key requirement is derived from `requiresAuth`, not hand-typed
      // into each description, so the three consumers (docs, this suffix, the
      // test) can't drift.
      description: t.requiresAuth
        ? `${t.description} Requires IWMM_API_KEY.`
        : t.description,
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
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = toolsByName[req.params.name];
    if (!tool) {
      return {
        isError: true,
        content: [{ type: "text", text: `Unknown tool: ${req.params.name}` }],
      };
    }

    const args = tool.inputSchema.safeParse(req.params.arguments ?? {});
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
      return {
        content: [{ type: "text", text }],
      };
    } catch (err) {
      return { isError: true, content: [{ type: "text", text: formatError(err) }] };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}


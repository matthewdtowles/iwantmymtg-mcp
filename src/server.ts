import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { tools, toolsByName } from "./tools/index.js";
import { ApiError } from "./api-client.js";

export async function startServer() {
  const server = new Server(
    {
      name: "iwantmymtg-mcp",
      version: "0.0.1",
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
      description: t.description,
      inputSchema: zodToJsonSchema(t.inputSchema, { target: "openApi3" }) as Record<string, unknown>,
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
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return { isError: true, content: [{ type: "text", text: formatError(err) }] };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function formatError(err: unknown): string {
  if (err instanceof ApiError) {
    const rl = err.rateLimit;
    const rateNote =
      rl?.remaining !== undefined
        ? ` (rate limit: ${rl.remaining}/${rl.limit} remaining, resets ${rl.reset ?? "?"})`
        : "";
    return `IWMM API responded ${err.status}${rateNote}: ${err.body}`;
  }
  return err instanceof Error ? err.message : String(err);
}

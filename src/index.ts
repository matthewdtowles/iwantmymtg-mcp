#!/usr/bin/env node
import { startServer } from "./server.js";

startServer().catch((err) => {
  // stderr - stdout is reserved for the MCP transport
  console.error("[iwmm-mcp-server] fatal:", err);
  process.exit(1);
});

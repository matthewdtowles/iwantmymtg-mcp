#!/usr/bin/env node
import { startServer } from "./server.js";

startServer().catch((err) => {
  // stderr - stdout is reserved for the MCP transport
  console.error("[iwantmymtg-mcp] fatal:", err);
  process.exit(1);
});

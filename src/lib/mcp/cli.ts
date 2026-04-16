#!/usr/bin/env node
// Standalone MCP CLI server for Scriptum
// Usage: npx tsx src/lib/mcp/cli.ts
// Or via Claude Desktop config:
// {
//   "mcpServers": {
//     "scriptum": {
//       "command": "node",
//       "args": ["/path/to/scriptum/dist/mcp-server.js"],
//       "env": { "DATABASE_URL": "..." }
//     }
//   }
// }

import { startMCPServer } from "./server";

startMCPServer().catch(console.error);

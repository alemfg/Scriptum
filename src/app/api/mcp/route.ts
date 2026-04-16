import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// HTTP-based MCP endpoint (for web-based MCP clients)
// The stdio-based MCP server is in src/lib/mcp/server.ts for CLI usage

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify MCP is enabled for the user
  const aiSettings = await db.aISettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!aiSettings?.mcpEnabled) {
    return NextResponse.json({ error: "MCP server not enabled. Enable it in Settings." }, { status: 403 });
  }

  const body = await req.json();

  // Forward to the MCP tool handler (simplified HTTP wrapper)
  const { tool, args } = body;
  if (!tool) return NextResponse.json({ error: "tool is required" }, { status: 400 });

  const { handleMCPTool } = await import("@/lib/mcp/server");

  const argsWithUser = { ...args, userId: session.user.id };
  const result = await handleMCPTool(tool, argsWithUser);

  if (result.isError) {
    return NextResponse.json({ error: result.content[0]?.text }, { status: 500 });
  }
  return NextResponse.json({ result: result.content });
}

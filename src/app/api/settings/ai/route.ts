import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { provider, apiKey, model, baseUrl, mcpEnabled } = body;

  const settings = await db.aISettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      provider: provider ?? "OPENAI",
      apiKey: apiKey || null,
      model: model || null,
      baseUrl: baseUrl || null,
      mcpEnabled: mcpEnabled ?? false,
    },
    update: {
      provider: provider ?? "OPENAI",
      apiKey: apiKey || null,
      model: model || null,
      baseUrl: baseUrl || null,
      mcpEnabled: mcpEnabled ?? false,
    },
  });

  return NextResponse.json({ success: true, provider: settings.provider });
}

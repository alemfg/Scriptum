import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runAICapability } from "@/lib/ai";
import type { AICapability } from "@/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { capability, content, prompt, targetLanguage } = body;

  if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });

  // Get user's AI settings
  const aiSettings = await db.aISettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!aiSettings?.apiKey) {
    return NextResponse.json(
      { error: "No AI API key configured. Go to Settings → AI to set one up." },
      { status: 422 }
    );
  }

  try {
    const cap: AICapability = {
      type: capability,
      prompt,
      targetLanguage,
    };

    const result = await runAICapability(cap, content, {
      provider: aiSettings.provider.toLowerCase() as "openai" | "claude" | "ollama" | "custom",
      apiKey: aiSettings.apiKey,
      model: aiSettings.model ?? undefined,
      baseUrl: aiSettings.baseUrl ?? undefined,
    });

    return NextResponse.json({ result });
  } catch (e) {
    console.error("AI error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed" },
      { status: 500 }
    );
  }
}

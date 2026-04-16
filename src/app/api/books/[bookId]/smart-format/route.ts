import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyBookWriteAccess } from "@/lib/bookAccess";
import { runAICapability } from "@/lib/ai";

const GENRE_PRESETS: Record<string, Record<string, unknown>> = {
  fantasy: { preset: "fantasy", fontFamily: "Palatino", fontSize: 11.5, dropCaps: true, lineSpacing: 1.5 },
  "science fiction": { preset: "scifi", fontFamily: "Arial", fontSize: 10.5, dropCaps: false, lineSpacing: 1.5 },
  sci_fi: { preset: "scifi", fontFamily: "Arial", fontSize: 10.5, dropCaps: false, lineSpacing: 1.5 },
  romance: { preset: "classic", fontFamily: "Garamond", fontSize: 11, dropCaps: true, lineSpacing: 1.4 },
  fiction: { preset: "classic", fontFamily: "Garamond", fontSize: 11, dropCaps: true, lineSpacing: 1.4 },
  "non-fiction": { preset: "nonfiction", fontFamily: "Times New Roman", fontSize: 11, dropCaps: false, lineSpacing: 1.4 },
  nonfiction: { preset: "nonfiction", fontFamily: "Times New Roman", fontSize: 11, dropCaps: false, lineSpacing: 1.4 },
  mystery: { preset: "modern", fontFamily: "Georgia", fontSize: 11, dropCaps: false, lineSpacing: 1.6 },
  thriller: { preset: "modern", fontFamily: "Georgia", fontSize: 11, dropCaps: false, lineSpacing: 1.6 },
  poetry: { preset: "modern", fontFamily: "Garamond", fontSize: 12, dropCaps: false, justification: "left", lineSpacing: 1.8 },
};

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;

  const book = await db.book.findFirst({
    where: { id: bookId, OR: [{ userId: session.user.id }, { projectAccess: { some: { userId: session.user.id } } }] },
    include: {
      chapters: {
        take: 3,
        orderBy: { order: "asc" },
        select: { content: true, wordCount: true },
      },
    },
  });

  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Try AI-based genre detection if user has AI configured
  const aiSettings = await db.aISettings.findUnique({ where: { userId: session.user.id } });
  let detectedGenre = book.genre?.toLowerCase();

  if (aiSettings?.apiKey && !detectedGenre) {
    const sampleContent = book.chapters
      .filter((c) => c.content)
      .map((c) => {
        try {
          const doc = JSON.parse(c.content!);
          return doc.content?.slice(0, 5).map((n: { content?: Array<{ text?: string }> }) =>
            n.content?.map((t) => t.text).join("") ?? ""
          ).join(" ") ?? "";
        } catch {
          return c.content?.slice(0, 500) ?? "";
        }
      })
      .join("\n\n")
      .slice(0, 2000);

    try {
      const result = await runAICapability(
        { type: "analyze", prompt: "Detect the genre of this text. Return only the genre name in lowercase (e.g., 'fantasy', 'romance', 'thriller', 'non-fiction')." },
        sampleContent,
        {
          provider: aiSettings.provider.toLowerCase() as "openai" | "claude" | "ollama" | "custom",
          apiKey: aiSettings.apiKey,
          model: aiSettings.model ?? undefined,
          baseUrl: aiSettings.baseUrl ?? undefined,
        }
      );
      detectedGenre = result.toLowerCase().trim().replace(/[^a-z\s-]/g, "");
    } catch {
      // Fall back to book.genre
    }
  }

  // Find matching preset
  const presetKey = Object.keys(GENRE_PRESETS).find(
    (key) => detectedGenre?.includes(key)
  );
  const presetSettings = presetKey ? GENRE_PRESETS[presetKey] : GENRE_PRESETS.fiction;

  return NextResponse.json({
    settings: presetSettings,
    detectedGenre: detectedGenre ?? "fiction",
  });
}

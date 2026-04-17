import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyBookWriteAccess } from "@/lib/bookAccess";
import { importFile } from "@/lib/import";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const book = await verifyBookWriteAccess(bookId, session.user.id);
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const detectChapters = formData.get("detectChapters") === "true";
  const normalizeStyles = formData.get("normalizeStyles") === "true";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await importFile(buffer, file.name, {
    detectChapters,
    normalizeStyles,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.errors[0] ?? "Import failed" }, { status: 422 });
  }

  // Preview mode: return chapters without saving
  if (formData.get("preview") === "true") {
    return NextResponse.json({ chapters: result.chapters, warnings: result.warnings });
  }

  // Save imported chapters
  const existingCount = await db.chapter.count({ where: { bookId } });
  const created = await db.$transaction(
    result.chapters.map((ch, i) =>
      db.chapter.create({
        data: {
          bookId,
          title: ch.title,
          order: existingCount + i,
          type: "CHAPTER",
          content: JSON.stringify({
            type: "doc",
            content: (() => {
              const text = ch.content;
              // Use double-newline for paragraph breaks if present; else single newline
              const parts = text.includes("\n\n")
                ? text.split(/\n{2,}/).map((p) => p.replace(/\n/g, " ").trim())
                : text.split("\n").map((p) => p.trim());
              return parts.filter(Boolean).map((para) => ({
                type: "paragraph",
                content: [{ type: "text", text: para }],
              }));
            })(),
          }),
          wordCount: ch.content.split(/\s+/).filter(Boolean).length,
        },
      })
    )
  );

  return NextResponse.json({
    success: true,
    chaptersImported: created.length,
    warnings: result.warnings,
  });
}

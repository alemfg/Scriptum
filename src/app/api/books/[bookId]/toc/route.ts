import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/books/:bookId/toc
 * Generates a Table of Contents from the book's CHAPTER-type chapters and writes
 * the content into the first TOC chapter found.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const book = await db.book.findFirst({
    where: {
      id: bookId,
      OR: [
        { userId: session.user.id },
        { projectAccess: { some: { userId: session.user.id, role: "EDITOR" } } },
      ],
    },
    include: {
      chapters: { orderBy: { order: "asc" } },
    },
  });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tocChapter = book.chapters.find((c) => c.type === "TOC");
  if (!tocChapter) {
    return NextResponse.json({ error: "No TOC chapter found. Add a chapter with type 'Table of Contents' first." }, { status: 400 });
  }

  const chapters = book.chapters.filter((c) => c.type === "CHAPTER" && c.isVisible);

  // Build TipTap JSON doc with a heading + list of chapter titles
  const tocDoc = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Contents" }],
      },
      ...chapters.map((ch) => ({
        type: "paragraph",
        content: [{ type: "text", text: ch.title }],
      })),
    ],
  };

  const content = JSON.stringify(tocDoc);
  const wordCount = chapters.length + 1; // rough estimate

  const updated = await db.chapter.update({
    where: { id: tocChapter.id },
    data: { content, wordCount },
  });

  return NextResponse.json({ chapterId: updated.id, chapters: chapters.length });
}

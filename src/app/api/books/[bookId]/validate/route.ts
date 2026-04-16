import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyBookWriteAccess } from "@/lib/bookAccess";
import type { ValidationIssue } from "@/types";

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
      chapters: { orderBy: { order: "asc" } },
      formatSettings: true,
    },
  });

  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const issues: ValidationIssue[] = [];
  const totalWords = book.chapters.reduce((s, c) => s + c.wordCount, 0);
  const estimatedPages = Math.ceil(totalWords / 280);

  if (estimatedPages < 24) {
    issues.push({
      type: "formatting_issue",
      severity: "error",
      message: `Book is too short for KDP (${estimatedPages} pages). Minimum is 24 pages.`,
    });
  }

  // Check for chapters with no content
  for (const ch of book.chapters) {
    if (ch.type === "CHAPTER" && ch.wordCount === 0 && ch.isVisible) {
      issues.push({
        type: "chapter_inconsistency",
        severity: "warning",
        message: `Chapter "${ch.title}" has no content.`,
        chapterId: ch.id,
      });
    }
  }

  // Check required pages
  const hasTitle = book.chapters.some((c) => c.type === "TITLE_PAGE");
  const hasCopyright = book.chapters.some((c) => c.type === "COPYRIGHT");

  if (!hasTitle) {
    issues.push({ type: "missing_page", severity: "warning", message: "No Title Page. KDP recommends including one." });
  }
  if (!hasCopyright) {
    issues.push({ type: "missing_page", severity: "warning", message: "No Copyright Page found." });
  }

  // Font issues
  const fmt = book.formatSettings;
  if (fmt && !["Garamond", "Georgia", "Times New Roman", "Palatino", "Arial", "Helvetica", "Baskerville", "Caslon"].includes(fmt.fontFamily)) {
    issues.push({
      type: "font_issue",
      severity: "warning",
      message: `Font "${fmt.fontFamily}" may not embed correctly in PDF. Use a standard serif font for KDP print.`,
    });
  }

  // Margin check
  if (fmt) {
    const minGutter = estimatedPages > 300 ? 0.75 : estimatedPages > 150 ? 0.625 : 0.375;
    if (fmt.marginInner < minGutter) {
      issues.push({
        type: "formatting_issue",
        severity: "error",
        message: `Gutter (inner margin) of ${fmt.marginInner}" is too small for ${estimatedPages} pages. Minimum: ${minGutter}".`,
      });
    }
  }

  return NextResponse.json({ issues, totalWords, estimatedPages });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId } = await params;

  const chapter = await db.chapter.findFirst({
    where: {
      id: chapterId,
      book: {
        OR: [
          { userId: session.user.id },
          { projectAccess: { some: { userId: session.user.id } } },
        ],
      },
    },
  });
  if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const versions = await db.chapterVersion.findMany({
    where: { chapterId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(versions);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId } = await params;
  const body = await req.json();

  const chapter = await db.chapter.findFirst({
    where: {
      id: chapterId,
      book: {
        OR: [
          { userId: session.user.id },
          { projectAccess: { some: { userId: session.user.id } } },
        ],
      },
    },
  });
  if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Restore version
  if (body.restore && body.versionId) {
    const version = await db.chapterVersion.findUnique({ where: { id: body.versionId } });
    if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

    // Auto-save current content before overwriting
    if (chapter.content) {
      await db.chapterVersion.create({
        data: {
          chapterId,
          content: chapter.content,
          wordCount: chapter.wordCount,
          label: "Before restore",
        },
      });
    }

    const updated = await db.chapter.update({
      where: { id: chapterId },
      data: { content: version.content, wordCount: version.wordCount },
    });
    return NextResponse.json(updated);
  }

  // Save manual version with label
  const version = await db.chapterVersion.create({
    data: {
      chapterId,
      content: chapter.content ?? "",
      wordCount: chapter.wordCount,
      label: body.label ?? null,
    },
  });
  return NextResponse.json(version, { status: 201 });
}

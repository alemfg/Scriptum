import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function verifyChapterAccess(chapterId: string, userId: string) {
  // Allow access if user is the book owner OR has ProjectAccess (EDITOR or VIEWER)
  return db.chapter.findFirst({
    where: {
      id: chapterId,
      book: {
        OR: [
          { userId },
          { projectAccess: { some: { userId } } },
        ],
      },
    },
  });
}

async function verifyChapterWriteAccess(chapterId: string, userId: string) {
  // Allow writes only if owner or EDITOR collaborator (not VIEWER)
  return db.chapter.findFirst({
    where: {
      id: chapterId,
      book: {
        OR: [
          { userId },
          { projectAccess: { some: { userId, role: "EDITOR" } } },
        ],
      },
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId } = await params;
  const ch = await verifyChapterAccess(chapterId, session.user.id);
  if (!ch) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(ch);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId } = await params;
  const ch = await verifyChapterWriteAccess(chapterId, session.user.id);
  if (!ch) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Save version if content changed
  if (body.content && body.content !== ch.content) {
    await db.chapterVersion.create({
      data: {
        chapterId,
        content: ch.content ?? "",
        wordCount: ch.wordCount,
      },
    });
    // Keep only last 20 versions
    const versions = await db.chapterVersion.findMany({
      where: { chapterId },
      orderBy: { createdAt: "desc" },
      skip: 20,
    });
    if (versions.length > 0) {
      await db.chapterVersion.deleteMany({
        where: { id: { in: versions.map((v) => v.id) } },
      });
    }
  }

  const updated = await db.chapter.update({
    where: { id: chapterId },
    data: {
      title: body.title,
      content: body.content,
      wordCount: body.wordCount,
      notes: body.notes,
      isVisible: body.isVisible,
      type: body.type,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chapterId } = await params;
  // Only owners can delete chapters
  const ch = await verifyChapterWriteAccess(chapterId, session.user.id);
  if (!ch) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.chapter.delete({ where: { id: chapterId } });
  return NextResponse.json({ success: true });
}

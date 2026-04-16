import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyBookWriteAccess } from "@/lib/bookAccess";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const book = await verifyBookWriteAccess(bookId, session.user.id);
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const chapters = await db.chapter.findMany({
    where: { bookId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(chapters);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const book = await verifyBookWriteAccess(bookId, session.user.id);
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const count = await db.chapter.count({ where: { bookId } });

  const chapter = await db.chapter.create({
    data: {
      bookId,
      title: body.title ?? `Chapter ${count + 1}`,
      order: body.order ?? count,
      type: body.type ?? "CHAPTER",
    },
  });

  return NextResponse.json(chapter, { status: 201 });
}

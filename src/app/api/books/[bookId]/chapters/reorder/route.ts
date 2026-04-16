import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyBookWriteAccess } from "@/lib/bookAccess";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const book = await verifyBookWriteAccess(bookId, session.user.id);
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { chapters } = await req.json() as { chapters: { id: string; order: number }[] };

  await db.$transaction(
    chapters.map((ch) =>
      db.chapter.update({ where: { id: ch.id }, data: { order: ch.order } })
    )
  );

  return NextResponse.json({ success: true });
}

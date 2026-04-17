import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/books/:bookId/format/copy
// Body: { targetBookId?: string, collectionId?: string }
// Copies format settings from bookId to one book or all books in a collection.

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;

  const source = await db.book.findFirst({
    where: { id: bookId, userId: session.user.id },
    include: { formatSettings: true },
  });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!source.formatSettings) return NextResponse.json({ error: "No format settings to copy" }, { status: 400 });

  const { targetBookId, collectionId } = await req.json() as { targetBookId?: string; collectionId?: string };

  // Resolve target book IDs
  let targetIds: string[] = [];
  if (targetBookId) {
    targetIds = [targetBookId];
  } else if (collectionId) {
    const books = await db.book.findMany({
      where: { collectionId, userId: session.user.id, id: { not: bookId } },
      select: { id: true },
    });
    targetIds = books.map((b) => b.id);
  }

  if (targetIds.length === 0) return NextResponse.json({ error: "No target books" }, { status: 400 });

  // Omit non-copyable fields
  const { id: _id, bookId: _bid, createdAt: _ca, updatedAt: _ua, ...copyable } = source.formatSettings;

  await Promise.all(
    targetIds.map((tid) =>
      db.formatSettings.upsert({
        where: { bookId: tid },
        update: copyable,
        create: { ...copyable, bookId: tid },
      })
    )
  );

  return NextResponse.json({ copied: targetIds.length });
}

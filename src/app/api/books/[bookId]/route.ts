import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function verifyAccess(bookId: string, userId: string) {
  const book = await db.book.findFirst({
    where: { id: bookId, userId },
  });
  return book;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;

  const book = await db.book.findFirst({
    where: { id: bookId, userId: session.user.id },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        include: {
          scenes: { orderBy: { order: "asc" } },
          versions: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { id: true, createdAt: true, label: true, wordCount: true },
          },
        },
      },
      characters: { orderBy: { name: "asc" } },
      worldbuilding: { orderBy: { order: "asc" } },
      scenes: { orderBy: { order: "asc" } },
      formatSettings: true,
    },
  });

  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(book);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const book = await verifyAccess(bookId, session.user.id);
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await db.book.update({
    where: { id: bookId },
    data: {
      title: body.title,
      author: body.author,
      genre: body.genre,
      description: body.description,
      status: body.status,
      wordGoal: body.wordGoal,
      coverImage: body.coverImage,
      backImage: body.backImage,
      spineImage: body.spineImage,
      spineWidth: body.spineWidth,
      language: body.language,
      isbnPaperback: "isbnPaperback" in body ? body.isbnPaperback : undefined,
      isbnHardcover: "isbnHardcover" in body ? body.isbnHardcover : undefined,
      isbnEbook: "isbnEbook" in body ? body.isbnEbook : undefined,
      collection: "collectionId" in body
        ? body.collectionId
          ? { connect: { id: body.collectionId } }
          : { disconnect: true }
        : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const book = await verifyAccess(bookId, session.user.id);
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.book.delete({ where: { id: bookId } });
  return NextResponse.json({ success: true });
}

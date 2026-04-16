import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const books = await db.book.findMany({
    where: { userId: session.user.id },
    include: {
      chapters: { select: { wordCount: true } },
      collection: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(books);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, author, genre, description, language, wordGoal } = body;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const book = await db.book.create({
    data: {
      userId: session.user.id,
      title,
      author: author || null,
      genre: genre || null,
      description: description || null,
      language: language || "en",
      wordGoal: wordGoal || null,
    },
  });

  // Create default chapter structure
  await db.chapter.createMany({
    data: [
      { bookId: book.id, title: "Title Page", order: 0, type: "TITLE_PAGE" },
      { bookId: book.id, title: "Chapter 1", order: 1, type: "CHAPTER" },
    ],
  });

  return NextResponse.json(book, { status: 201 });
}

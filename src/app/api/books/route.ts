import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ChapterType } from "@prisma/client";

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
  const { title, author, genre, description, language, wordGoal, template } = body;

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

  const pages = (template === "full"
    ? [
        { bookId: book.id, title: "Title Page",           order: 0, type: "TITLE_PAGE"       as ChapterType },
        { bookId: book.id, title: "Copyright",            order: 1, type: "COPYRIGHT"        as ChapterType },
        { bookId: book.id, title: "Dedication",           order: 2, type: "DEDICATION"       as ChapterType },
        { bookId: book.id, title: "Table of Contents",    order: 3, type: "TOC"              as ChapterType },
        { bookId: book.id, title: "Chapter 1",            order: 4, type: "CHAPTER"          as ChapterType },
        { bookId: book.id, title: "About the Author",     order: 5, type: "ABOUT_AUTHOR"     as ChapterType },
        { bookId: book.id, title: "Acknowledgements",     order: 6, type: "ACKNOWLEDGEMENTS" as ChapterType },
      ]
    : [
        { bookId: book.id, title: "Title Page", order: 0, type: "TITLE_PAGE" as ChapterType },
        { bookId: book.id, title: "Chapter 1",  order: 1, type: "CHAPTER"   as ChapterType },
      ]);

  await db.chapter.createMany({ data: pages });

  return NextResponse.json(book, { status: 201 });
}

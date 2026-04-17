import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { IsbnType } from "@prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const collectionId = searchParams.get("collectionId");

  const isbns = await db.isbnEntry.findMany({
    where: {
      userId: session.user.id,
      ...(collectionId ? { collectionId } : {}),
    },
    include: {
      book: { select: { id: true, title: true } },
      collection: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(isbns);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isbn, type, label, collectionId, bookId } = await req.json();
  if (!isbn) return NextResponse.json({ error: "ISBN is required" }, { status: 400 });

  const entry = await db.isbnEntry.create({
    data: {
      userId: session.user.id,
      isbn: isbn.trim(),
      type: (type as IsbnType) ?? "PAPERBACK",
      label: label || null,
      collectionId: collectionId || null,
      bookId: bookId || null,
    },
    include: {
      book: { select: { id: true, title: true } },
      collection: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { IsbnType } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ isbnId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isbnId } = await params;
  const entry = await db.isbnEntry.findFirst({ where: { id: isbnId, userId: session.user.id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await db.isbnEntry.update({
    where: { id: isbnId },
    data: {
      isbn: body.isbn !== undefined ? body.isbn.trim() : undefined,
      type: body.type !== undefined ? (body.type as IsbnType) : undefined,
      label: body.label !== undefined ? body.label || null : undefined,
      collectionId: "collectionId" in body ? body.collectionId || null : undefined,
      bookId: "bookId" in body ? body.bookId || null : undefined,
    },
    include: {
      book: { select: { id: true, title: true } },
      collection: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ isbnId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isbnId } = await params;
  const entry = await db.isbnEntry.findFirst({ where: { id: isbnId, userId: session.user.id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.isbnEntry.delete({ where: { id: isbnId } });
  return NextResponse.json({ success: true });
}

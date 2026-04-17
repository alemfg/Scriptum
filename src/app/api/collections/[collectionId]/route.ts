import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function verifyAccess(collectionId: string, userId: string) {
  return db.collection.findFirst({ where: { id: collectionId, userId } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { collectionId } = await params;
  const collection = await db.collection.findFirst({
    where: { id: collectionId, userId: session.user.id },
    include: {
      books: {
        select: { id: true, title: true, author: true, status: true, coverImage: true },
        orderBy: { title: "asc" },
      },
      isbns: {
        include: { book: { select: { id: true, title: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(collection);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { collectionId } = await params;
  const col = await verifyAccess(collectionId, session.user.id);
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, description } = await req.json();
  const updated = await db.collection.update({
    where: { id: collectionId },
    data: {
      title: title ?? undefined,
      description: description !== undefined ? description || null : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { collectionId } = await params;
  const col = await verifyAccess(collectionId, session.user.id);
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.collection.delete({ where: { id: collectionId } });
  return NextResponse.json({ success: true });
}

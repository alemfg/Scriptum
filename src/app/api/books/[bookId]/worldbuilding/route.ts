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

  const entries = await db.worldBuilding.findMany({
    where: { bookId },
    orderBy: [{ type: "asc" }, { order: "asc" }],
  });
  return NextResponse.json(entries);
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
  const count = await db.worldBuilding.count({ where: { bookId, type: body.type } });

  const entry = await db.worldBuilding.create({
    data: {
      bookId,
      type: body.type ?? "LOCATION",
      title: body.title,
      content: body.content ?? null,
      imageUrl: body.imageUrl ?? null,
      order: count,
      aiExtracted: body.aiExtracted ?? false,
    },
  });
  return NextResponse.json(entry, { status: 201 });
}

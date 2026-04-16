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

  const characters = await db.character.findMany({
    where: { bookId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(characters);
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
  const character = await db.character.create({
    data: {
      bookId,
      name: body.name,
      role: body.role ?? null,
      description: body.description ?? null,
      traits: body.traits ? JSON.stringify(body.traits) : null,
      relationships: body.relationships ? JSON.stringify(body.relationships) : null,
      notes: body.notes ?? null,
      imageUrl: body.imageUrl ?? null,
      aiExtracted: body.aiExtracted ?? false,
    },
  });
  return NextResponse.json(character, { status: 201 });
}

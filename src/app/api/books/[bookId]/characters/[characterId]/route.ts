import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyBookWriteAccess } from "@/lib/bookAccess";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookId: string; characterId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, characterId } = await params;
  const book = await verifyBookWriteAccess(bookId, session.user.id);
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const character = await db.character.update({
    where: { id: characterId },
    data: {
      name: body.name,
      role: body.role,
      description: body.description,
      traits: body.traits ? JSON.stringify(body.traits) : undefined,
      relationships: body.relationships ? JSON.stringify(body.relationships) : undefined,
      notes: body.notes,
      imageUrl: body.imageUrl,
    },
  });
  return NextResponse.json(character);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ bookId: string; characterId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, characterId } = await params;
  const book = await verifyBookWriteAccess(bookId, session.user.id);
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.character.delete({ where: { id: characterId } });
  return NextResponse.json({ success: true });
}

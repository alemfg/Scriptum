import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** DELETE /api/books/:bookId/collaborators/:userId — remove collaborator */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ bookId: string; userId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, userId } = await params;
  const book = await db.book.findFirst({ where: { id: bookId, userId: session.user.id } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.projectAccess.deleteMany({ where: { bookId, userId } });

  return NextResponse.json({ success: true });
}

/** PATCH /api/books/:bookId/collaborators/:userId — change role */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookId: string; userId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, userId } = await params;
  const book = await db.book.findFirst({ where: { id: bookId, userId: session.user.id } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const role = body.role as string | undefined;
  if (!role || !["EDITOR", "VIEWER"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const updated = await db.projectAccess.update({
    where: { bookId_userId: { bookId, userId } },
    data: { role: role as "EDITOR" | "VIEWER" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(updated);
}

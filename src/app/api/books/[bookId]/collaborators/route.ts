import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** GET /api/books/:bookId/collaborators — list all collaborators */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const book = await db.book.findFirst({ where: { id: bookId, userId: session.user.id } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const collaborators = await db.projectAccess.findMany({
    where: { bookId, user: { id: { not: session.user.id } } },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(collaborators);
}

/** POST /api/books/:bookId/collaborators — invite by email */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const book = await db.book.findFirst({ where: { id: bookId, userId: session.user.id } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const email = (body.email as string | undefined)?.trim().toLowerCase();
  const role = (body.role as string | undefined) ?? "EDITOR";

  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
  if (!["EDITOR", "VIEWER"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const target = await db.user.findFirst({ where: { email } });
  if (!target) return NextResponse.json({ error: "No user found with that email address" }, { status: 404 });
  if (target.id === session.user.id) return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });

  const existing = await db.projectAccess.findUnique({ where: { bookId_userId: { bookId, userId: target.id } } });
  if (existing) return NextResponse.json({ error: "This user already has access" }, { status: 409 });

  const access = await db.projectAccess.create({
    data: { bookId, userId: target.id, role: role as "EDITOR" | "VIEWER" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(access, { status: 201 });
}

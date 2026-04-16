import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const collections = await db.collection.findMany({
    where: { userId: session.user.id },
    include: { books: { select: { id: true, title: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(collections);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title, description } = await req.json();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  const collection = await db.collection.create({
    data: { userId: session.user.id, title, description: description || null },
  });
  return NextResponse.json(collection, { status: 201 });
}

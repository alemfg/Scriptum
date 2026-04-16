import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyBookWriteAccess } from "@/lib/bookAccess";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const book = await verifyBookWriteAccess(bookId, session.user.id);
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const rawExt = (file.name.split(".").pop() ?? "").toLowerCase();
  if (rawExt !== "svg") return NextResponse.json({ error: "Only SVG files are allowed" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const content = Buffer.from(bytes).toString("utf-8");

  // Basic SVG validation — must start with <svg
  if (!content.trimStart().startsWith("<svg") && !content.trimStart().startsWith("<?xml")) {
    return NextResponse.json({ error: "Invalid SVG file" }, { status: 400 });
  }

  const filename = `${bookId}-separator-${Date.now()}.svg`;
  const uploadDir = join(process.cwd(), "public", "uploads", "separators");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), content);

  const url = `/uploads/separators/${filename}`;

  await db.formatSettings.upsert({
    where: { bookId },
    create: { bookId, sceneSeparatorSvg: url },
    update: { sceneSeparatorSvg: url },
  });

  return NextResponse.json({ url });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const book = await verifyBookWriteAccess(bookId, session.user.id);
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.formatSettings.upsert({
    where: { bookId },
    create: { bookId, sceneSeparatorSvg: null },
    update: { sceneSeparatorSvg: null },
  });

  return NextResponse.json({ success: true });
}

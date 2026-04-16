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
  const type = formData.get("type") as string | null;

  if (!file || !type) return NextResponse.json({ error: "Missing file or type" }, { status: 400 });

  const allowedTypes = ["front", "back", "spine"];
  if (!allowedTypes.includes(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const rawExt = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const allowedExts = ["jpg", "jpeg", "png", "webp"];
  const ext = allowedExts.includes(rawExt) ? rawExt : "jpg";
  const filename = `${bookId}-${type}-${Date.now()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "covers");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), buffer);

  const url = `/uploads/covers/${filename}`;

  const field = type === "front" ? "coverImage" : type === "back" ? "backImage" : "spineImage";
  await db.book.update({
    where: { id: bookId },
    data: { [field]: url },
  });

  return NextResponse.json({ url });
}

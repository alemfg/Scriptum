import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import JSZip from "jszip";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;

  const book = await db.book.findFirst({
    where: { id: bookId, userId: session.user.id },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        include: {
          scenes: true,
          versions: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
      characters: true,
      worldbuilding: true,
      scenes: true,
      formatSettings: true,
    },
  });

  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const zip = new JSZip();

  // Book metadata
  zip.file("book.json", JSON.stringify({
    id: book.id,
    title: book.title,
    author: book.author,
    genre: book.genre,
    description: book.description,
    language: book.language,
    status: book.status,
    wordGoal: book.wordGoal,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  }, null, 2));

  // Chapters
  const chaptersFolder = zip.folder("chapters");
  for (const ch of book.chapters) {
    chaptersFolder?.file(`${ch.order.toString().padStart(3, "0")}-${ch.id}.json`, JSON.stringify({
      id: ch.id,
      title: ch.title,
      order: ch.order,
      type: ch.type,
      content: ch.content,
      wordCount: ch.wordCount,
      notes: ch.notes,
      isVisible: ch.isVisible,
    }, null, 2));
  }

  // Characters
  zip.file("characters.json", JSON.stringify(book.characters, null, 2));

  // Worldbuilding
  zip.file("worldbuilding.json", JSON.stringify(book.worldbuilding, null, 2));

  // Scenes
  zip.file("scenes.json", JSON.stringify(book.scenes, null, 2));

  // Format settings
  if (book.formatSettings) {
    zip.file("format-settings.json", JSON.stringify(book.formatSettings, null, 2));
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const safeTitle = book.title.replace(/["\\\n\r]/g, "");
  const filename = `${safeTitle}-backup-${new Date().toISOString().slice(0, 10)}.zip`;

  // Record backup
  await db.backup.create({
    data: {
      bookId,
      filename,
      size: zipBuffer.length,
    },
  });

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const book = await db.book.findFirst({ where: { id: bookId, userId: session.user.id } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const backups = await db.backup.findMany({
    where: { bookId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(backups);
}

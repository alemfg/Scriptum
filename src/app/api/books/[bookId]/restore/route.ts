import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChapterType, WorldBuildingType } from "@prisma/client";
import JSZip from "jszip";

/**
 * POST /api/books/:bookId/restore
 * Restores a book from a backup ZIP. Replaces chapters, characters, worldbuilding,
 * and format settings. The book record itself (title, author, etc.) is preserved.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;
  const book = await db.book.findFirst({ where: { id: bookId, userId: session.user.id } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (ext !== "zip") return NextResponse.json({ error: "Only ZIP files are accepted" }, { status: 400 });

  let zip: JSZip;
  try {
    const bytes = await file.arrayBuffer();
    zip = await JSZip.loadAsync(bytes);
  } catch {
    return NextResponse.json({ error: "Invalid or corrupt ZIP file" }, { status: 400 });
  }

  // Parse book.json (optional — used only to verify it's a Scriptum backup)
  const bookJsonFile = zip.file("book.json");
  if (!bookJsonFile) return NextResponse.json({ error: "Not a valid Scriptum backup (missing book.json)" }, { status: 400 });

  await db.$transaction(async (tx) => {
    // Delete existing data
    await tx.chapterVersion.deleteMany({ where: { chapter: { bookId } } });
    await tx.scene.deleteMany({ where: { bookId } });
    await tx.chapter.deleteMany({ where: { bookId } });
    await tx.character.deleteMany({ where: { bookId } });
    await tx.worldBuilding.deleteMany({ where: { bookId } });
    await tx.formatSettings.deleteMany({ where: { bookId } });

    // Restore chapters
    const chaptersFolder = zip.folder("chapters");
    if (chaptersFolder) {
      const chapterFiles: Array<{ name: string; file: JSZip.JSZipObject }> = [];
      chaptersFolder.forEach((relativePath, file) => {
        if (!file.dir && relativePath.endsWith(".json")) {
          chapterFiles.push({ name: relativePath, file });
        }
      });

      for (const { file } of chapterFiles) {
        const raw = await file.async("string");
        const ch = JSON.parse(raw);
        await tx.chapter.create({
          data: {
            bookId,
            title: ch.title ?? "Untitled",
            order: ch.order ?? 0,
            type: ((ch.type as string) ?? "CHAPTER") as ChapterType,
            content: ch.content ?? null,
            wordCount: ch.wordCount ?? 0,
            notes: ch.notes ?? null,
            isVisible: ch.isVisible ?? true,
          },
        });
      }
    }

    // Restore characters
    const charsFile = zip.file("characters.json");
    if (charsFile) {
      const chars = JSON.parse(await charsFile.async("string")) as Array<Record<string, unknown>>;
      for (const c of chars) {
        await tx.character.create({
          data: {
            bookId,
            name: (c.name as string) ?? "Unknown",
            role: (c.role as string | null) ?? null,
            description: (c.description as string | null) ?? null,
            traits: (c.traits as string | null) ?? null,
            relationships: (c.relationships as string | null) ?? null,
            notes: (c.notes as string | null) ?? null,
            imageUrl: (c.imageUrl as string | null) ?? null,
          },
        });
      }
    }

    // Restore worldbuilding
    const wbFile = zip.file("worldbuilding.json");
    if (wbFile) {
      const entries = JSON.parse(await wbFile.async("string")) as Array<Record<string, unknown>>;
      for (const e of entries) {
        await tx.worldBuilding.create({
          data: {
            bookId,
            type: ((e.type as string) ?? "LOCATION") as WorldBuildingType,
            title: (e.title as string) ?? "Untitled",
            content: (e.content as string | null) ?? null,
            imageUrl: (e.imageUrl as string | null) ?? null,
          },
        });
      }
    }

    // Restore format settings
    const fsFile = zip.file("format-settings.json");
    if (fsFile) {
      const fs = JSON.parse(await fsFile.async("string")) as Record<string, unknown>;
      const data = {
        trimSize: (fs.trimSize as string) ?? "6x9",
        marginTop: (fs.marginTop as number) ?? 0.75,
        marginBottom: (fs.marginBottom as number) ?? 0.75,
        marginInner: (fs.marginInner as number) ?? 0.875,
        marginOuter: (fs.marginOuter as number) ?? 0.5,
        bleed: (fs.bleed as boolean) ?? false,
        chapterStartRight: (fs.chapterStartRight as boolean) ?? true,
        preset: (fs.preset as string) ?? "classic",
        fontFamily: (fs.fontFamily as string) ?? "Garamond",
        fontSize: (fs.fontSize as number) ?? 11,
        lineSpacing: (fs.lineSpacing as number) ?? 1.4,
        paragraphSpacing: (fs.paragraphSpacing as number) ?? 0,
        indentation: (fs.indentation as number) ?? 0.3,
        justification: (fs.justification as string) ?? "justify",
        dropCaps: (fs.dropCaps as boolean) ?? true,
        widowControl: (fs.widowControl as boolean) ?? true,
        headerEnabled: (fs.headerEnabled as boolean) ?? true,
        footerEnabled: (fs.footerEnabled as boolean) ?? true,
        headerContent: (fs.headerContent as string) ?? "title",
        footerContent: (fs.footerContent as string) ?? "pageNumber",
        sceneSeparator: (fs.sceneSeparator as string) ?? "* * *",
        sceneSeparatorSvg: (fs.sceneSeparatorSvg as string | null) ?? null,
      };
      await tx.formatSettings.create({ data: { bookId, ...data } });
    }
  });

  return NextResponse.json({ success: true });
}

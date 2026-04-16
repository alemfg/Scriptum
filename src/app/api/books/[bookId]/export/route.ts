import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyBookWriteAccess } from "@/lib/bookAccess";
import { exportMarkdown } from "@/lib/export/markdown";
import { exportEpub } from "@/lib/export/epub";
import { exportDocx } from "@/lib/export/docx";
import { exportPdf } from "@/lib/export/pdf";
import type { BookFull } from "@/types";
import JSZip from "jszip";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await params;

  const book = await db.book.findFirst({
    where: {
      id: bookId,
      OR: [
        { userId: session.user.id },
        { projectAccess: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        include: {
          scenes: { orderBy: { order: "asc" } },
          versions: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, createdAt: true, label: true } },
        },
      },
      characters: true,
      worldbuilding: true,
      scenes: { orderBy: { order: "asc" } },
      formatSettings: true,
    },
  });

  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bookFull = book as unknown as BookFull;
  const body = await req.json();
  const format: string = body.format ?? "pdf";
  const options = body.options ?? {};
  const safeTitle = book.title.replace(/["\\\n\r]/g, "");

  try {
    if (format === "pdf") {
      const buffer = await exportPdf(bookFull, bookFull.formatSettings);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
        },
      });
    }

    if (format === "epub") {
      const buffer = await exportEpub(bookFull, bookFull.formatSettings);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/epub+zip",
          "Content-Disposition": `attachment; filename="${safeTitle}.epub"`,
        },
      });
    }

    if (format === "docx") {
      const buffer = await exportDocx(bookFull, bookFull.formatSettings);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${safeTitle}.docx"`,
        },
      });
    }

    if (format === "md") {
      const files = await exportMarkdown(bookFull, options);

      if (files.length === 1) {
        return new NextResponse(files[0].content, {
          headers: {
            "Content-Type": "text/markdown",
            "Content-Disposition": `attachment; filename="${files[0].filename}"`,
          },
        });
      }

      // Multiple files → ZIP
      const zip = new JSZip();
      for (const file of files) {
        zip.file(file.filename, file.content);
      }
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
      return new NextResponse(new Uint8Array(zipBuffer), {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${safeTitle}-markdown.zip"`,
        },
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 }
    );
  }
}

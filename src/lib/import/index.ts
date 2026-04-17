import type { ImportResult } from "@/types";

interface ImportOptions {
  aiCleanup?: boolean;
  detectChapters?: boolean;
  normalizeStyles?: boolean;
}

export async function importFile(
  file: Buffer,
  filename: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "docx":
      return importDocx(file, options);
    case "pdf":
      return importPdf(file, options);
    case "txt":
      return importTxt(file.toString("utf-8"), options);
    case "md":
      return importMarkdown(file.toString("utf-8"), options);
    case "epub":
      return importEpub(file, options);
    default:
      return {
        success: false,
        chapters: [],
        errors: [`Unsupported file format: ${ext}`],
        warnings: [],
      };
  }
}

async function importDocx(
  buffer: Buffer,
  options: ImportOptions
): Promise<ImportResult> {
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml({ buffer });

  const html = result.value;
  const warnings = result.messages.map((m) => m.message);

  const chapters = splitIntoChapters(html, "html", options);
  return { success: true, chapters, errors: [], warnings };
}

async function importPdf(
  buffer: Buffer,
  _options: ImportOptions
): Promise<ImportResult> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    const text = data.text;

    const chapters = splitIntoChapters(text, "text", _options);
    return { success: true, chapters, errors: [], warnings: ["PDF parsing may have formatting inaccuracies"] };
  } catch (e) {
    return {
      success: false,
      chapters: [],
      errors: [`PDF parsing failed: ${e instanceof Error ? e.message : "unknown error"}`],
      warnings: [],
    };
  }
}

function importTxt(
  text: string,
  options: ImportOptions
): ImportResult {
  const chapters = splitIntoChapters(text, "text", options);
  return { success: true, chapters, errors: [], warnings: [] };
}

function importMarkdown(
  text: string,
  options: ImportOptions
): ImportResult {
  const chapters = splitIntoChapters(text, "markdown", options);
  return { success: true, chapters, errors: [], warnings: [] };
}

async function importEpub(
  _buffer: Buffer,
  _options: ImportOptions
): Promise<ImportResult> {
  // EPUB parsing - extract chapters from ZIP-based EPUB structure
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(_buffer);

    // Find OPF file for structure
    const containerXml = await zip.file("META-INF/container.xml")?.async("string");
    if (!containerXml) {
      return { success: false, chapters: [], errors: ["Invalid EPUB: missing container.xml"], warnings: [] };
    }

    const opfMatch = containerXml.match(/full-path="([^"]+)"/);
    if (!opfMatch) {
      return { success: false, chapters: [], errors: ["Invalid EPUB: cannot find OPF file"], warnings: [] };
    }

    const opfPath = opfMatch[1];
    const opfContent = await zip.file(opfPath)?.async("string");
    if (!opfContent) {
      return { success: false, chapters: [], errors: ["Invalid EPUB: cannot read OPF file"], warnings: [] };
    }

    // Extract spine items
    const spineMatches = opfContent.matchAll(/idref="([^"]+)"/g);
    const manifestMatches = opfContent.matchAll(/id="([^"]+)"[^>]+href="([^"]+)"/g);

    const manifest: Record<string, string> = {};
    for (const m of manifestMatches) {
      manifest[m[1]] = m[2];
    }

    const basePath = opfPath.split("/").slice(0, -1).join("/");
    const chapters = [];
    let order = 0;

    for (const spine of spineMatches) {
      const href = manifest[spine[1]];
      if (!href) continue;

      const fullPath = basePath ? `${basePath}/${href}` : href;
      const content = await zip.file(fullPath)?.async("string");
      if (!content) continue;

      // Extract text from HTML/XHTML
      const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length < 50) continue;

      const titleMatch = content.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/);
      const title = titleMatch ? titleMatch[1] : `Chapter ${order + 1}`;

      chapters.push({ title, content: text, order: order++ });
    }

    return { success: true, chapters, errors: [], warnings: [] };
  } catch (e) {
    return {
      success: false,
      chapters: [],
      errors: [`EPUB parsing failed: ${e instanceof Error ? e.message : "unknown error"}`],
      warnings: [],
    };
  }
}

function splitIntoChapters(
  content: string,
  format: "text" | "html" | "markdown",
  options: ImportOptions
): Array<{ title: string; content: string; order: number }> {
  if (!options.detectChapters) {
    return [{ title: "Chapter 1", content, order: 0 }];
  }

  let chapters: Array<{ title: string; content: string; order: number }> = [];

  if (format === "markdown") {
    // Split on # headings
    const parts = content.split(/^#{1,3}\s+/m);
    const headings = content.match(/^#{1,3}\s+.+/gm) ?? [];
    chapters = parts
      .filter((p) => p.trim().length > 50)
      .map((p, i) => ({
        title: headings[i] ? headings[i].replace(/^#+\s+/, "") : `Chapter ${i + 1}`,
        content: p.trim(),
        order: i,
      }));
  } else if (format === "html") {
    // Split on h1/h2/h3 tags
    const parts = content.split(/<h[1-3][^>]*>/i);
    let order = 0;
    for (const part of parts) {
      if (part.trim().length < 50) continue;
      const titleMatch = part.match(/^([^<]+)<\/h[1-3]>/i);
      const title = titleMatch ? titleMatch[1].trim() : `Chapter ${order + 1}`;
      // Preserve paragraph structure before stripping tags
      const body = part
        .replace(/^[^<]+<\/h[1-3]>/i, "")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      if (body.length > 50) {
        chapters.push({ title, content: body, order: order++ });
      }
    }
  } else {
    // Text: split on CHAPTER heading patterns
    const chapterPattern = /^(?:chapter\s+\d+|chapter\s+[ivxlcdm]+|\d+\.?\s+\w)/gim;
    const matches = [...content.matchAll(chapterPattern)];

    if (matches.length === 0) {
      return [{ title: "Chapter 1", content, order: 0 }];
    }

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index!;
      const end = i + 1 < matches.length ? matches[i + 1].index! : content.length;
      const chunkContent = content.slice(start, end);
      const lines = chunkContent.split("\n");
      const title = lines[0].trim();
      const body = lines.slice(1).join("\n").trim();
      chapters.push({ title, content: body || chunkContent, order: i });
    }
  }

  return chapters.length > 0
    ? chapters
    : [{ title: "Chapter 1", content, order: 0 }];
}

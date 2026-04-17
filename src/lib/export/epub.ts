import type { BookFull, FormatSettings } from "@/types";
import { generateBarcodeSvg } from "@/lib/barcode";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tiptapJsonToHtml(jsonStr: string): string {
  try {
    const doc = JSON.parse(jsonStr);
    return nodeToHtml(doc);
  } catch {
    return `<p>${escapeHtml(jsonStr)}</p>`;
  }
}

const NUMBER_WORDS = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
  "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen","Twenty"];

function substitutePlaceholders(html: string, book: BookFull, chapterIndex: number, chapterTitle: string): string {
  const chNum = chapterIndex + 1;
  const isbnPb = book.isbns?.find((e) => e.type === "PAPERBACK")?.isbn ?? "";
  const isbnHc = book.isbns?.find((e) => e.type === "HARDCOVER")?.isbn ?? "";
  const isbnEb = book.isbns?.find((e) => e.type === "EBOOK")?.isbn ?? "";
  const barcodePb = isbnPb ? generateBarcodeSvg(isbnPb) : "";
  const map: Record<string, string> = {
    "[book_title]":            escapeHtml(book.title ?? ""),
    "[author_name]":           escapeHtml(book.author ?? ""),
    "[publisher]":             escapeHtml(book.author ?? ""),
    "[year]":                  new Date().getFullYear().toString(),
    "[language]":              book.language ?? "en",
    "[genre]":                 escapeHtml(book.genre ?? ""),
    "[chapter_title]":         escapeHtml(chapterTitle),
    "[chapter_number]":        String(chNum),
    "[chapter_number_words]":  chNum <= 20 ? NUMBER_WORDS[chNum] : String(chNum),
    "[isbn_paperback]":        escapeHtml(isbnPb),
    "[isbn_hardcover]":        escapeHtml(isbnHc),
    "[isbn_ebook]":            escapeHtml(isbnEb),
    "[isbn_barcode]":          barcodePb,
  };
  return html.replace(/\[[a-zA-Z_][a-zA-Z0-9_]*(?::[^\]]+)?]/g, (match) => {
    if (match in map) return map[match];
    const colonIdx = match.indexOf(":");
    if (colonIdx !== -1) return escapeHtml(match.slice(colonIdx + 1, -1));
    return match;
  });
}

function nodeToHtml(node: {
  type: string;
  text?: string;
  content?: unknown[];
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string }>;
}): string {
  if (!node) return "";

  switch (node.type) {
    case "doc":
      return (node.content ?? []).map((n) => nodeToHtml(n as Parameters<typeof nodeToHtml>[0])).join("");
    case "paragraph":
      return `<p>${(node.content ?? []).map((n) => nodeToHtml(n as Parameters<typeof nodeToHtml>[0])).join("")}</p>`;
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      return `<h${level}>${(node.content ?? []).map((n) => nodeToHtml(n as Parameters<typeof nodeToHtml>[0])).join("")}</h${level}>`;
    }
    case "text": {
      let t = escapeHtml(node.text ?? "");
      const marks = node.marks ?? [];
      if (marks.some((m) => m.type === "bold")) t = `<strong>${t}</strong>`;
      if (marks.some((m) => m.type === "italic")) t = `<em>${t}</em>`;
      if (marks.some((m) => m.type === "underline")) t = `<u>${t}</u>`;
      if (marks.some((m) => m.type === "code")) t = `<code>${t}</code>`;
      return t;
    }
    case "blockquote":
      return `<blockquote>${(node.content ?? []).map((n) => nodeToHtml(n as Parameters<typeof nodeToHtml>[0])).join("")}</blockquote>`;
    case "bulletList":
      return `<ul>${(node.content ?? []).map((n) => nodeToHtml(n as Parameters<typeof nodeToHtml>[0])).join("")}</ul>`;
    case "orderedList":
      return `<ol>${(node.content ?? []).map((n) => nodeToHtml(n as Parameters<typeof nodeToHtml>[0])).join("")}</ol>`;
    case "listItem":
      return `<li>${(node.content ?? []).map((n) => nodeToHtml(n as Parameters<typeof nodeToHtml>[0])).join("")}</li>`;
    case "hardBreak":
      return "<br/>";
    case "horizontalRule":
      return "<hr/>";
    case "image":
      return `<img src="${node.attrs?.src}" alt="${node.attrs?.alt ?? ""}"/>`;
    default:
      return (node.content ?? []).map((n) => nodeToHtml(n as Parameters<typeof nodeToHtml>[0])).join("");
  }
}

export async function exportEpub(
  book: BookFull,
  formatSettings?: FormatSettings | null
): Promise<Buffer> {
  const { EPub } = await import("epub-gen-memory");

  const svgSepHtml = formatSettings?.sceneSeparatorSvg
    ? `<hr/><div style="text-align:center;"><img src="${formatSettings.sceneSeparatorSvg.replace(/"/g, "&quot;")}" alt="separator" style="max-height:24px;"/></div>`
    : undefined;

  const visibleChapters = book.chapters.sort((a, b) => a.order - b.order).filter((ch) => ch.isVisible);
  const chapters = visibleChapters.map((ch, idx) => {
    let content = ch.content ? tiptapJsonToHtml(ch.content) : "<p></p>";
    if (svgSepHtml) content = content.replace(/<hr\/>/g, svgSepHtml);
    content = substitutePlaceholders(content, book, idx, ch.title);
    return { title: ch.title, content };
  });

  const options = {
    title: book.title,
    author: book.author ?? "Unknown Author",
    cover: book.coverImage ?? undefined,
    lang: book.language ?? "en",
    tocTitle: "Table of Contents",
    css: `
      body { font-family: Georgia, serif; line-height: 1.6; }
      h1 { font-size: 2em; margin-bottom: 1em; }
      h2 { font-size: 1.5em; margin-bottom: 0.8em; }
      p { margin-bottom: 0.5em; text-indent: 1.5em; }
      p:first-child { text-indent: 0; }
      blockquote { margin: 1em 2em; font-style: italic; }
    `,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const epub = await new (EPub as any)(options, chapters).genEpub();
  return Buffer.from(epub);
}

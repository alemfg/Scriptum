import type { BookFull, FormatSettings } from "@/types";
import { generateBarcodeSvg } from "@/lib/barcode";

// PDF export uses headless Chrome via Puppeteer.
// In production, we render an HTML template and convert it to PDF.

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

function substitutePlaceholders(
  html: string,
  book: BookFull,
  chapterIndex: number,
  chapterTitle: string
): string {
  const year = new Date().getFullYear().toString();
  const chNum = chapterIndex + 1;
  const isbnPb = book.isbns?.find((e) => e.type === "PAPERBACK")?.isbn ?? "";
  const isbnHc = book.isbns?.find((e) => e.type === "HARDCOVER")?.isbn ?? "";
  const isbnEb = book.isbns?.find((e) => e.type === "EBOOK")?.isbn ?? "";
  const barcodePb = isbnPb ? generateBarcodeSvg(isbnPb) : "";
  const map: Record<string, string> = {
    "[book_title]":            escapeHtml(book.title ?? ""),
    "[author_name]":           escapeHtml(book.author ?? ""),
    "[publisher]":             escapeHtml(book.author ?? ""),
    "[year]":                  year,
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
    // [key:default] → use the default value after the colon
    const colonIdx = match.indexOf(":");
    if (colonIdx !== -1) return escapeHtml(match.slice(colonIdx + 1, -1));
    return match; // leave unknown placeholders as-is
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
      return "<hr style=\"page-break-after: avoid;\"/>";
    default:
      return (node.content ?? []).map((n) => nodeToHtml(n as Parameters<typeof nodeToHtml>[0])).join("");
  }
}

function buildHtml(book: BookFull, fmt?: FormatSettings | null): string {
  const trimSizes: Record<string, { w: string; h: string }> = {
    "5x8": { w: "5in", h: "8in" },
    "5.25x8": { w: "5.25in", h: "8in" },
    "5.5x8.5": { w: "5.5in", h: "8.5in" },
    "6x9": { w: "6in", h: "9in" },
    "6.14x9.21": { w: "6.14in", h: "9.21in" },
    "7x10": { w: "7in", h: "10in" },
    "8.5x11": { w: "8.5in", h: "11in" },
  };

  const trim = trimSizes[fmt?.trimSize ?? "6x9"] ?? trimSizes["6x9"];

  const css = `
    @page {
      size: ${trim.w} ${trim.h};
      margin-top: ${fmt?.marginTop ?? 0.75}in;
      margin-bottom: ${fmt?.marginBottom ?? 0.75}in;
      margin-left: ${fmt?.marginInner ?? 0.875}in;
      margin-right: ${fmt?.marginOuter ?? 0.5}in;
    }
    body {
      font-family: '${fmt?.fontFamily ?? "Georgia"}', Georgia, serif;
      font-size: ${fmt?.fontSize ?? 11}pt;
      line-height: ${fmt?.lineSpacing ?? 1.4};
      text-align: ${fmt?.justification ?? "justify"};
      color: #000;
      background: #fff;
    }
    h1 {
      font-size: 1.8em;
      text-align: center;
      margin-top: 3em;
      margin-bottom: 2em;
      page-break-before: ${fmt?.chapterStartRight ? "right" : "always"};
      page-break-after: avoid;
    }
    h2 { font-size: 1.3em; margin-top: 2em; }
    h3 { font-size: 1.1em; }
    p {
      margin: 0;
      margin-bottom: ${fmt?.paragraphSpacing ?? 0}em;
      text-indent: ${fmt?.indentation ?? 0.3}in;
    }
    p:first-of-type {
      text-indent: 0;
    }
    ${fmt?.dropCaps ? `
    .chapter-start p:first-of-type::first-letter {
      font-size: 3.5em;
      float: left;
      line-height: 0.8;
      margin: 0.1em 0.05em 0 0;
      font-weight: bold;
    }` : ""}
    blockquote {
      margin: 1em 2em;
      font-style: italic;
    }
    hr {
      border: none;
      text-align: center;
      margin: 1em 0;
    }
    ${fmt?.sceneSeparatorSvg
      ? `hr { margin: 0.5em 0; }`
      : `hr::after { content: '${(fmt?.sceneSeparator ?? "* * *").replace(/'/g, "\\'")}'; }`}
    .page-header {
      text-align: center;
      font-size: 0.85em;
      font-style: italic;
      border-bottom: 1px solid #ccc;
      padding-bottom: 0.3em;
      margin-bottom: 1em;
    }
  `;

  const svgSepHtml = fmt?.sceneSeparatorSvg
    ? `<hr style="page-break-after:avoid;"/><div style="text-align:center;margin:0.5em 0;"><img src="${fmt.sceneSeparatorSvg.replace(/"/g, "&quot;")}" alt="separator" style="max-height:24px;max-width:120px;"/></div>`
    : undefined;

  const visibleChapters = book.chapters.sort((a, b) => a.order - b.order).filter((ch) => ch.isVisible);
  const chapters = visibleChapters
    .map((ch, idx) => {
      let html = ch.content ? tiptapJsonToHtml(ch.content) : "";
      if (svgSepHtml) {
        html = html.replace(/<hr style="page-break-after: avoid;"\/>/g, svgSepHtml);
      }
      html = substitutePlaceholders(html, book, idx, ch.title);
      return `
        <div class="chapter chapter-start" id="ch-${ch.id}">
          ${fmt?.headerEnabled ? `<div class="page-header">${book.title}</div>` : ""}
          <h1>${ch.title}</h1>
          ${html}
        </div>
      `;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${book.language ?? "en"}">
<head>
  <meta charset="UTF-8">
  <title>${book.title}</title>
  <style>${css}</style>
</head>
<body>
  ${chapters}
</body>
</html>`;
}

export async function exportPdf(
  book: BookFull,
  fmt?: FormatSettings | null
): Promise<Buffer> {
  const html = buildHtml(book, fmt);

  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
    await browser.close();
    return Buffer.from(pdf);
  } catch {
    // Fallback: return HTML as buffer if Puppeteer unavailable
    return Buffer.from(html, "utf-8");
  }
}

export { buildHtml as buildPdfHtml };

"use client";
import type { FormatSettings, Chapter, Scene } from "@/types";
import { cn } from "@/lib/utils";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tiptapJsonToPreviewHtml(jsonStr: string, svgSeparatorUrl?: string | null): string {
  if (!jsonStr) return "";
  try {
    const doc = JSON.parse(jsonStr);
    let html = nodeToHtml(doc);
    if (svgSeparatorUrl) {
      const safeUrl = svgSeparatorUrl.replace(/"/g, "&quot;");
      html = html.replace(/<hr\/>/g, `<hr/><img src="${safeUrl}" alt="separator" style="display:block;margin:0 auto;max-height:24px;max-width:120px;"/>`);
    }
    return html;
  } catch {
    return `<p>${escapeHtml(jsonStr)}</p>`;
  }
}

function nodeToHtml(node: {
  type: string; text?: string; content?: unknown[];
  attrs?: Record<string, unknown>; marks?: Array<{ type: string }>;
}): string {
  switch (node.type) {
    case "doc": return (node.content ?? []).map((n) => nodeToHtml(n as Parameters<typeof nodeToHtml>[0])).join("");
    case "paragraph": return `<p>${(node.content ?? []).map((n) => nodeToHtml(n as Parameters<typeof nodeToHtml>[0])).join("")}</p>`;
    case "heading": {
      const l = (node.attrs?.level as number) ?? 1;
      return `<h${l}>${(node.content ?? []).map((n) => nodeToHtml(n as Parameters<typeof nodeToHtml>[0])).join("")}</h${l}>`;
    }
    case "text": {
      let t = escapeHtml(node.text ?? "");
      const marks = node.marks ?? [];
      if (marks.some((m) => m.type === "bold")) t = `<strong>${t}</strong>`;
      if (marks.some((m) => m.type === "italic")) t = `<em>${t}</em>`;
      return t;
    }
    case "blockquote": return `<blockquote>${(node.content ?? []).map((n) => nodeToHtml(n as Parameters<typeof nodeToHtml>[0])).join("")}</blockquote>`;
    case "horizontalRule": return `<hr/>`;
    default: return (node.content ?? []).map((n) => nodeToHtml(n as Parameters<typeof nodeToHtml>[0])).join("");
  }
}

const TRIM_ASPECT: Record<string, number> = {
  "5x8": 5 / 8, "5.25x8": 5.25 / 8, "5.5x8.5": 5.5 / 8.5,
  "6x9": 6 / 9, "6.14x9.21": 6.14 / 9.21, "7x10": 7 / 10, "8.5x11": 8.5 / 11,
};

interface PreviewBook {
  id: string;
  title: string;
  author: string | null;
  chapters: (Chapter & { scenes: Scene[] })[];
}

interface Props {
  book: PreviewBook;
  settings: Partial<FormatSettings>;
  mode: "paperback" | "ebook";
}

export function BookPreview({ book, settings, mode }: Props) {
  const trimSize = settings.trimSize ?? "6x9";
  const aspect = TRIM_ASPECT[trimSize] ?? (6 / 9);
  const previewWidth = mode === "paperback" ? 400 : 340;
  const previewHeight = mode === "paperback" ? Math.round(previewWidth / aspect) : 480;

  const firstChapter = book.chapters.find((c) => c.type === "CHAPTER" && c.isVisible);

  return (
    <div
      className={cn(
        "bg-white shadow-2xl overflow-hidden mx-auto",
        mode === "ebook" && "rounded-xl border border-gray-200"
      )}
      style={{ width: previewWidth, minHeight: previewHeight }}
    >
      {/* Preview page */}
      <div
        className="relative overflow-hidden bg-white"
        style={{
          padding: `${(settings.marginTop ?? 0.75) * 48}px ${(settings.marginOuter ?? 0.5) * 48}px ${(settings.marginBottom ?? 0.75) * 48}px ${(settings.marginInner ?? 0.875) * 48}px`,
          fontFamily: `'${settings.fontFamily ?? "Georgia"}', Georgia, serif`,
          fontSize: `${settings.fontSize ?? 11}pt`,
          lineHeight: settings.lineSpacing ?? 1.4,
          textAlign: (settings.justification ?? "justify") as "left" | "right" | "center" | "justify",
          color: "#1a1a1a",
        }}
      >
        {/* Header */}
        {settings.headerEnabled && (
          <div style={{ textAlign: "center", fontSize: "8pt", fontStyle: "italic", borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "12px", color: "#666" }}>
            {book.title}
          </div>
        )}

        {/* Chapter heading */}
        {firstChapter && (
          <div>
            <h1 style={{ fontSize: "18pt", textAlign: "center", fontWeight: "bold", marginBottom: "24px", marginTop: "32px" }}>
              {firstChapter.title}
            </h1>
            <div
              style={{
                textIndent: `${(settings.indentation ?? 0.3) * 48}px`,
              }}
              className="preview-content"
              dangerouslySetInnerHTML={{
                __html: firstChapter.content
                  ? tiptapJsonToPreviewHtml(firstChapter.content, settings.sceneSeparatorSvg).slice(0, 2000)
                  : "<p>No content yet. Start writing in Write Mode.</p>",
              }}
            />
          </div>
        )}

        {/* Footer */}
        {settings.footerEnabled && (
          <div style={{ textAlign: "center", fontSize: "8pt", borderTop: "1px solid #ddd", paddingTop: "4px", marginTop: "12px", color: "#666" }}>
            1
          </div>
        )}
      </div>

      <style>{`
        .preview-content p { margin-bottom: ${(settings.paragraphSpacing ?? 0)}em; }
        .preview-content p:first-of-type { text-indent: 0; }
        ${settings.dropCaps ? `.preview-content p:first-of-type::first-letter { font-size: 3em; float: left; line-height: 0.8; margin: 0.1em 0.05em 0 0; font-weight: bold; }` : ""}
        ${settings.sceneSeparatorSvg
          ? `.preview-content hr { border: none; margin: 0.5em 0; }`
          : `.preview-content hr::after { content: '${(settings.sceneSeparator ?? "* * *").replace(/'/g, "\\'")}'; display: block; text-align: center; }
             .preview-content hr { border: none; margin: 1em 0; }`}
        .preview-content blockquote { margin: 0.8em 1.5em; font-style: italic; }
      `}</style>
    </div>
  );
}

import type { BookFull } from "@/types";

interface MarkdownExportOptions {
  singleFile?: boolean;
  separateByScene?: boolean;
}

function tiptapJsonToMarkdown(jsonStr: string): string {
  try {
    const doc = JSON.parse(jsonStr);
    return nodeToMarkdown(doc);
  } catch {
    return jsonStr;
  }
}

function nodeToMarkdown(node: {
  type: string;
  text?: string;
  content?: Array<{ type: string; text?: string; content?: unknown[]; attrs?: Record<string, unknown>; marks?: Array<{ type: string }> }>;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string }>;
}): string {
  if (!node) return "";

  switch (node.type) {
    case "doc":
      return (node.content ?? []).map((n) => nodeToMarkdown(n as Parameters<typeof nodeToMarkdown>[0])).join("\n\n");
    case "paragraph":
      return (node.content ?? []).map((n) => nodeToMarkdown(n as Parameters<typeof nodeToMarkdown>[0])).join("");
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      const text = (node.content ?? []).map((n) => nodeToMarkdown(n as Parameters<typeof nodeToMarkdown>[0])).join("");
      return `${"#".repeat(level)} ${text}`;
    }
    case "text": {
      let t = node.text ?? "";
      const marks = node.marks ?? [];
      if (marks.some((m) => m.type === "bold")) t = `**${t}**`;
      if (marks.some((m) => m.type === "italic")) t = `*${t}*`;
      if (marks.some((m) => m.type === "code")) t = `\`${t}\``;
      if (marks.some((m) => m.type === "underline")) t = `<u>${t}</u>`;
      return t;
    }
    case "blockquote":
      return (node.content ?? [])
        .map((n) => `> ${nodeToMarkdown(n as Parameters<typeof nodeToMarkdown>[0])}`)
        .join("\n");
    case "bulletList":
      return (node.content ?? [])
        .map((n) => `- ${nodeToMarkdown(n as Parameters<typeof nodeToMarkdown>[0])}`)
        .join("\n");
    case "orderedList":
      return (node.content ?? [])
        .map((n, i) => `${i + 1}. ${nodeToMarkdown(n as Parameters<typeof nodeToMarkdown>[0])}`)
        .join("\n");
    case "listItem":
      return (node.content ?? []).map((n) => nodeToMarkdown(n as Parameters<typeof nodeToMarkdown>[0])).join("");
    case "hardBreak":
      return "\n";
    case "horizontalRule":
      return "\n---\n";
    case "image":
      return `![${node.attrs?.alt ?? ""}](${node.attrs?.src ?? ""})`;
    default:
      return (node.content ?? []).map((n) => nodeToMarkdown(n as Parameters<typeof nodeToMarkdown>[0])).join("");
  }
}

export async function exportMarkdown(
  book: BookFull,
  options: MarkdownExportOptions = {}
): Promise<{ filename: string; content: string }[]> {
  const files: { filename: string; content: string }[] = [];

  if (options.singleFile) {
    let content = `# ${book.title}\n\n`;
    if (book.author) content += `*by ${book.author}*\n\n`;
    content += "---\n\n";

    for (const chapter of book.chapters.sort((a, b) => a.order - b.order).filter((c) => c.isVisible)) {
      content += `## ${chapter.title}\n\n`;
      if (chapter.content) {
        content += tiptapJsonToMarkdown(chapter.content) + "\n\n";
      }

      if (options.separateByScene && chapter.scenes) {
        for (const scene of chapter.scenes) {
          if (scene.content) {
            content += `### ${scene.title}\n\n`;
            content += tiptapJsonToMarkdown(scene.content) + "\n\n";
          }
        }
      }
    }

    files.push({ filename: `${book.title}.md`, content });
  } else {
    // Separate files per chapter
    for (const chapter of book.chapters.sort((a, b) => a.order - b.order).filter((c) => c.isVisible)) {
      const padded = String(chapter.order + 1).padStart(2, "0");
      let content = `# ${chapter.title}\n\n`;

      if (chapter.content) {
        content += tiptapJsonToMarkdown(chapter.content) + "\n\n";
      }

      if (options.separateByScene && chapter.scenes) {
        for (const scene of chapter.scenes) {
          if (scene.content) {
            content += `---\n\n### ${scene.title}\n\n`;
            content += tiptapJsonToMarkdown(scene.content) + "\n\n";
          }
        }
      }

      files.push({ filename: `${padded}-${chapter.title}.md`, content });
    }
  }

  return files;
}

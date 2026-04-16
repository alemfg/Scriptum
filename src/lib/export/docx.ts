import type { BookFull, FormatSettings } from "@/types";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageOrientation,
  convertInchesToTwip,
  Header,
  Footer,
  PageNumber,
} from "docx";

function tiptapJsonToParagraphs(jsonStr: string): Paragraph[] {
  try {
    const doc = JSON.parse(jsonStr);
    return nodesToParagraphs(doc.content ?? []);
  } catch {
    return [new Paragraph({ children: [new TextRun(jsonStr)] })];
  }
}

function nodesToParagraphs(nodes: unknown[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const node of nodes) {
    const n = node as {
      type: string;
      text?: string;
      content?: unknown[];
      attrs?: Record<string, unknown>;
      marks?: Array<{ type: string }>;
    };

    switch (n.type) {
      case "paragraph":
        paragraphs.push(
          new Paragraph({
            children: (n.content ?? []).map((child) => {
              const c = child as { type: string; text?: string; marks?: Array<{ type: string }> };
              const marks = c.marks ?? [];
              return new TextRun({
                text: c.text ?? "",
                bold: marks.some((m) => m.type === "bold"),
                italics: marks.some((m) => m.type === "italic"),
                underline: marks.some((m) => m.type === "underline") ? {} : undefined,
              });
            }),
          })
        );
        break;
      case "heading": {
        const level = (n.attrs?.level as number) ?? 1;
        const headingMap: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
        };
        paragraphs.push(
          new Paragraph({
            heading: headingMap[level] ?? HeadingLevel.HEADING_1,
            children: (n.content ?? []).map((c) => {
              const tc = c as { text?: string };
              return new TextRun({ text: tc.text ?? "" });
            }),
          })
        );
        break;
      }
      case "blockquote":
        paragraphs.push(...nodesToParagraphs(n.content ?? []));
        break;
      case "horizontalRule":
        paragraphs.push(new Paragraph({ children: [new TextRun("* * *")] }));
        break;
      default:
        if (n.content) paragraphs.push(...nodesToParagraphs(n.content));
    }
  }

  return paragraphs;
}

export async function exportDocx(
  book: BookFull,
  fmt?: FormatSettings | null
): Promise<Buffer> {
  const marginTop = convertInchesToTwip(fmt?.marginTop ?? 0.75);
  const marginBottom = convertInchesToTwip(fmt?.marginBottom ?? 0.75);
  const marginInner = convertInchesToTwip(fmt?.marginInner ?? 0.875);
  const marginOuter = convertInchesToTwip(fmt?.marginOuter ?? 0.5);

  const sections = book.chapters
    .sort((a, b) => a.order - b.order)
    .filter((ch) => ch.isVisible)
    .map((chapter) => {
      const content = chapter.content
        ? tiptapJsonToParagraphs(chapter.content)
        : [new Paragraph({ children: [] })];

      return {
        properties: {
          page: {
            margin: {
              top: marginTop,
              bottom: marginBottom,
              left: marginInner,
              right: marginOuter,
            },
          },
        },
        headers: fmt?.headerEnabled
          ? {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun(book.title)],
                  }),
                ],
              }),
            }
          : undefined,
        footers: fmt?.footerEnabled
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ children: [PageNumber.CURRENT] })],
                  }),
                ],
              }),
            }
          : undefined,
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun(chapter.title)],
          }),
          ...content,
        ],
      };
    });

  const doc = new Document({
    title: book.title,
    creator: book.author ?? "Scriptum",
    description: book.description ?? "",
    sections: sections.length > 0 ? sections : [{ children: [new Paragraph({ children: [] })] }],
  });

  return Packer.toBuffer(doc);
}

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Matches [placeholder_name] or [placeholder_name:format_hint]
const PLACEHOLDER_RE = /\[[a-zA-Z_][a-zA-Z0-9_]*(?::[^\]]+)?]/g;

export const PlaceholderHighlight = Extension.create({
  name: "placeholderHighlight",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("placeholderHighlight"),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;
              PLACEHOLDER_RE.lastIndex = 0;
              let match: RegExpExecArray | null;
              while ((match = PLACEHOLDER_RE.exec(node.text)) !== null) {
                decorations.push(
                  Decoration.inline(
                    pos + match.index,
                    pos + match.index + match[0].length,
                    { class: "tiptap-placeholder-token" }
                  )
                );
              }
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

// All available placeholders shown in the Insert menu
export const PLACEHOLDERS: { label: string; value: string; description: string; group: string }[] = [
  // Book metadata
  { group: "Book",    label: "Book title",       value: "[book_title]",       description: "The book's title" },
  { group: "Book",    label: "Author name",       value: "[author_name]",      description: "Author's full name" },
  { group: "Book",    label: "Publisher",         value: "[publisher]",        description: "Publisher name" },
  { group: "Book",    label: "Year",              value: "[year]",             description: "Publication year" },
  { group: "Book",    label: "Language",          value: "[language]",         description: "Language of the book" },
  { group: "Book",    label: "Genre",             value: "[genre]",            description: "Book genre" },
  // ISBN
  { group: "ISBN",    label: "ISBN paperback",    value: "[isbn_paperback]",   description: "Paperback ISBN-13" },
  { group: "ISBN",    label: "ISBN hardcover",    value: "[isbn_hardcover]",   description: "Hardcover ISBN-13" },
  { group: "ISBN",    label: "ISBN e-book",       value: "[isbn_ebook]",       description: "E-book ISBN-13" },
  { group: "ISBN",    label: "ISBN barcode",      value: "[isbn_barcode]",     description: "ISBN barcode image" },
  // Chapter / structure
  { group: "Chapter", label: "Chapter title",     value: "[chapter_title]",    description: "Current chapter title" },
  { group: "Chapter", label: "Chapter number",    value: "[chapter_number]",   description: "Chapter number (e.g. 1)" },
  { group: "Chapter", label: "Chapter number (words)", value: "[chapter_number_words]", description: "Chapter number as words (e.g. One)" },
  // Layout
  { group: "Layout",  label: "Scene separator",   value: "[scene_separator]",  description: "Rendered scene separator" },
  { group: "Layout",  label: "Page number",       value: "[page_number]",      description: "Current page number" },
  // Custom
  { group: "Custom",  label: "Custom field…",     value: "[custom_field]",     description: "Any custom value" },
];

"use client";
import { useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Focus from "@tiptap/extension-focus";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { cn } from "@/lib/utils";
import { EditorToolbar } from "./EditorToolbar";

interface TiptapEditorProps {
  chapterId: string;
  initialContent: string;
  onUpdate: (content: string, wordCount: number) => void;
  focusMode: boolean;
  placeholder?: string;
  readOnly?: boolean;
}

function parseInitialContent(content: string) {
  if (!content) return "";
  try {
    JSON.parse(content);
    return content;
  } catch {
    // Plain text
    return {
      type: "doc",
      content: content.split("\n\n").filter(Boolean).map((para) => ({
        type: "paragraph",
        content: [{ type: "text", text: para }],
      })),
    };
  }
}

export function TiptapEditor({
  chapterId,
  initialContent,
  onUpdate,
  focusMode,
  placeholder = "Start writing…",
  readOnly = false,
}: TiptapEditorProps) {
  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Focus.configure({ className: "has-focus", mode: "all" }),
      Highlight,
      Typography,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
    ],
    content: parseInitialContent(initialContent) as string,
    editorProps: {
      attributes: {
        class: cn(
          "tiptap prose max-w-none min-h-[calc(100vh-12rem)] p-8 focus:outline-none",
          focusMode && "max-w-2xl mx-auto py-16 text-lg leading-relaxed"
        ),
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      const wordCount = editor.storage.characterCount?.words() ?? 0;
      onUpdate(json, wordCount);
    },
    immediatelyRender: false,
  });

  // Update content when chapter changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const parsed = parseInitialContent(initialContent);
    if (typeof parsed === "string" && parsed === "") {
      editor.commands.clearContent();
    } else {
      try {
        editor.commands.setContent(parsed as string);
      } catch {
        editor.commands.clearContent();
      }
    }
    editor.commands.focus("start");
  }, [chapterId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      {!focusMode && !readOnly && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} className="flex-1" />
    </div>
  );
}

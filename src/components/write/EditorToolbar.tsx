"use client";
import { useState, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Minus, Heading1, Heading2, Heading3,
  Link2, Image as ImageIcon, Highlighter, Undo, Redo, Braces,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLACEHOLDERS } from "./PlaceholderHighlight";

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        active
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-4 bg-[var(--border)] mx-1" />;
}

function PlaceholderMenu({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const insert = (value: string) => {
    editor.chain().focus().insertContent(value).run();
    setOpen(false);
  };

  const groups = [...new Set(PLACEHOLDERS.map((p) => p.group))];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Insert Placeholder"
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-colors",
          open
            ? "bg-violet-100 text-violet-700"
            : "text-[var(--muted-foreground)] hover:bg-violet-50 hover:text-violet-700"
        )}
      >
        <Braces className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Placeholder</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto">
          {groups.map((group) => (
            <div key={group}>
              <div className="px-3 py-1.5 bg-[var(--muted)] border-b border-[var(--border)]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{group}</span>
              </div>
              {PLACEHOLDERS.filter((p) => p.group === group).map((p) => (
                <button
                  key={p.value}
                  onClick={() => insert(p.value)}
                  className="w-full flex flex-col px-3 py-2 hover:bg-violet-50 transition-colors text-left"
                >
                  <span className="text-xs font-medium text-violet-700 font-mono">{p.value}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">{p.description}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const addImage = () => {
    const url = window.prompt("Image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const setLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("URL:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-[var(--border)] bg-[var(--card)] flex-wrap">
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
        <Heading1 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
        <Heading3 className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (⌘B)">
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (⌘I)">
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
        <Underline className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
        <Highlighter className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Center">
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
        <AlignRight className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
        <AlignJustify className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List">
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        <Minus className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link">
        <Link2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title="Image">
        <ImageIcon className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Separator />

      <PlaceholderMenu editor={editor} />
    </div>
  );
}

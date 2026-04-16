"use client";
import { useState } from "react";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import type { Chapter } from "@/types";

const PAGE_TYPE_LABELS: Record<string, string> = {
  TITLE_PAGE: "Title Page",
  COPYRIGHT: "Copyright",
  DEDICATION: "Dedication",
  TOC: "Table of Contents",
  FOREWORD: "Foreword / Preface",
  CHAPTER: "Chapter",
  ABOUT_AUTHOR: "About the Author",
  ACKNOWLEDGEMENTS: "Acknowledgements",
  ALSO_BY: "Also By",
  CUSTOM: "Custom",
};

interface Props {
  book: {
    id: string;
    chapters: Chapter[];
  };
}

export function PageTypesPanel({ book }: Props) {
  const [chapters, setChapters] = useState(book.chapters.sort((a, b) => a.order - b.order));

  const toggleVisibility = async (chapterId: string) => {
    const ch = chapters.find((c) => c.id === chapterId);
    if (!ch) return;
    const newVisible = !ch.isVisible;
    setChapters((prev) => prev.map((c) => c.id === chapterId ? { ...c, isVisible: newVisible } : c));
    await fetch(`/api/chapters/${chapterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: newVisible }),
    });
  };

  const addPageType = async (type: string) => {
    const res = await fetch(`/api/books/${book.id}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: PAGE_TYPE_LABELS[type] ?? type,
        type,
        order: chapters.length,
      }),
    });
    if (res.ok) {
      const ch = await res.json();
      setChapters((prev) => [...prev, { ...ch, scenes: [], versions: [] }]);
    }
  };

  const frontMatter = chapters.filter((c) => !["CHAPTER", "CUSTOM", "ABOUT_AUTHOR", "ACKNOWLEDGEMENTS", "ALSO_BY"].includes(c.type));
  const mainContent = chapters.filter((c) => c.type === "CHAPTER" || c.type === "CUSTOM");
  const backMatter = chapters.filter((c) => ["ABOUT_AUTHOR", "ACKNOWLEDGEMENTS", "ALSO_BY"].includes(c.type));

  function ChapterRow({ chapter }: { chapter: Chapter }) {
    return (
      <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[var(--secondary)] group">
        <GripVertical className="h-3.5 w-3.5 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--foreground)] truncate">{chapter.title}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{PAGE_TYPE_LABELS[chapter.type] ?? chapter.type}</p>
        </div>
        <button onClick={() => toggleVisibility(chapter.id)} className="opacity-60 hover:opacity-100 transition-opacity">
          {chapter.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Front Matter */}
      <div>
        <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Front Matter</p>
        <div className="space-y-0.5">
          {frontMatter.map((ch) => <ChapterRow key={ch.id} chapter={ch} />)}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {["COPYRIGHT", "DEDICATION", "TOC", "FOREWORD"].map((type) => (
            <button
              key={type}
              onClick={() => addPageType(type)}
              className="text-xs px-2 py-0.5 rounded border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] transition-colors"
            >
              + {PAGE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="border-t border-[var(--border)] pt-3">
        <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Main Content</p>
        <div className="space-y-0.5">
          {mainContent.map((ch) => <ChapterRow key={ch.id} chapter={ch} />)}
        </div>
      </div>

      {/* Back Matter */}
      <div className="border-t border-[var(--border)] pt-3">
        <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Back Matter</p>
        <div className="space-y-0.5">
          {backMatter.map((ch) => <ChapterRow key={ch.id} chapter={ch} />)}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {["ABOUT_AUTHOR", "ACKNOWLEDGEMENTS", "ALSO_BY"].map((type) => (
            <button
              key={type}
              onClick={() => addPageType(type)}
              className="text-xs px-2 py-0.5 rounded border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] transition-colors"
            >
              + {PAGE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

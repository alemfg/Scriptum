"use client";
import { useState } from "react";
import Link from "next/link";
import {
  PenLine, Download, CheckCircle, Type, BookOpen,
  Layout, Sparkles, Eye, Monitor, ZoomIn, ZoomOut,
} from "lucide-react";
import { cn, estimatePageCount, calculateSpineWidth } from "@/lib/utils";
import type { FormatSettings, Chapter, Scene } from "@/types";
import { BookPreview } from "./BookPreview";
import { TypographyPanel } from "./TypographyPanel";
import { PageTypesPanel } from "./PageTypesPanel";
import { ExportPanel } from "./ExportPanel";
import { ValidationPanel } from "./ValidationPanel";
import { KDPSettingsPanel } from "./KDPSettingsPanel";

interface FormatBook {
  id: string;
  title: string;
  author: string | null;
  coverImage: string | null;
  chapters: (Chapter & { scenes: Scene[] })[];
  formatSettings: FormatSettings | null;
}

const DEFAULT_SETTINGS: Partial<FormatSettings> = {
  trimSize: "6x9",
  marginTop: 0.75,
  marginBottom: 0.75,
  marginInner: 0.875,
  marginOuter: 0.5,
  bleed: false,
  chapterStartRight: true,
  preset: "classic",
  fontFamily: "Garamond",
  fontSize: 11,
  lineSpacing: 1.4,
  paragraphSpacing: 0,
  indentation: 0.3,
  justification: "justify",
  dropCaps: true,
  widowControl: true,
  headerEnabled: true,
  footerEnabled: true,
  headerContent: "title",
  footerContent: "pageNumber",
  sceneSeparator: "* * *",
};

const TABS = [
  { id: "typography", label: "Typography", icon: Type },
  { id: "kdp", label: "KDP Settings", icon: BookOpen },
  { id: "pages", label: "Page Types", icon: Layout },
  { id: "export", label: "Export", icon: Download },
  { id: "validate", label: "Validate", icon: CheckCircle },
];

export function FormatModeClient({ book }: { book: FormatBook }) {
  const [settings, setSettings] = useState<Partial<FormatSettings>>({
    ...DEFAULT_SETTINGS,
    ...book.formatSettings,
  });
  const [activeTab, setActiveTab] = useState("typography");
  const [previewMode, setPreviewMode] = useState<"paperback" | "ebook">("paperback");
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [smartFormatLoading, setSmartFormatLoading] = useState(false);

  const totalWords = book.chapters.reduce((s, c) => s + c.wordCount, 0);
  const estimatedPages = estimatePageCount(totalWords, settings.trimSize as string);
  const spineWidth = calculateSpineWidth(estimatedPages);

  const updateSettings = async (updates: Partial<FormatSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    setSaved(false);
    try {
      setSaving(true);
      await fetch(`/api/books/${book.id}/format`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const runSmartFormat = async () => {
    setSmartFormatLoading(true);
    try {
      const res = await fetch(`/api/books/${book.id}/smart-format`, { method: "POST" });
      const data = await res.json();
      if (data.settings) {
        setSettings((s) => ({ ...s, ...data.settings }));
        await updateSettings(data.settings);
      }
    } finally {
      setSmartFormatLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Left Panel — Settings */}
      <aside className="w-80 border-r border-[var(--border)] bg-[var(--card)] flex flex-col flex-shrink-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-3">
            <Link
              href={`/books/${book.id}/write`}
              className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <PenLine className="h-4 w-4" />
              Write Mode
            </Link>
            <span className={cn("text-xs font-medium", saved ? "text-green-600" : "text-[var(--muted-foreground)]")}>
              {saving ? "Saving…" : saved ? "Saved" : "Unsaved"}
            </span>
          </div>
          <h2 className="text-sm font-semibold text-[var(--foreground)] truncate">{book.title}</h2>
          <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] mt-1">
            <span>~{estimatedPages} pages</span>
            <span>·</span>
            <span>Spine: {spineWidth.toFixed(3)}&quot;</span>
          </div>
        </div>

        {/* SmartFormat Button */}
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <button
            onClick={runSmartFormat}
            disabled={smartFormatLoading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {smartFormatLoading ? "Analysing…" : "SmartFormat™"}
          </button>
          <p className="text-xs text-[var(--muted-foreground)] mt-1.5 text-center">
            AI detects genre and applies optimal formatting
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                activeTab === id
                  ? "border-b-2 border-[var(--ring)] text-[var(--foreground)] font-medium"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "typography" && (
            <TypographyPanel bookId={book.id} settings={settings} onUpdate={updateSettings} />
          )}
          {activeTab === "kdp" && (
            <KDPSettingsPanel settings={settings} onUpdate={updateSettings} estimatedPages={estimatedPages} spineWidth={spineWidth} />
          )}
          {activeTab === "pages" && (
            <PageTypesPanel book={book} />
          )}
          {activeTab === "export" && (
            <ExportPanel bookId={book.id} />
          )}
          {activeTab === "validate" && (
            <ValidationPanel bookId={book.id} chapters={book.chapters} settings={settings} />
          )}
        </div>
      </aside>

      {/* Right Panel — Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--secondary)]">
            <button
              onClick={() => setPreviewMode("paperback")}
              className={cn("flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors", previewMode === "paperback" ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]")}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Paperback
            </button>
            <button
              onClick={() => setPreviewMode("ebook")}
              className={cn("flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors", previewMode === "ebook" ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]")}
            >
              <Monitor className="h-3.5 w-3.5" />
              Kindle Preview
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))} className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors" title="Zoom out">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs text-[var(--muted-foreground)] w-9 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))} className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors" title="Zoom in">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setZoom(1)} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors px-1" title="Reset zoom">
              Reset
            </button>
            <div className="w-px h-4 bg-[var(--border)] mx-1" />
            <Eye className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <span className="text-xs text-[var(--muted-foreground)]">Live Preview</span>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-[var(--secondary)] p-8 flex items-start justify-center">
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.15s ease" }}>
            <BookPreview
              book={book}
              settings={settings}
              mode={previewMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

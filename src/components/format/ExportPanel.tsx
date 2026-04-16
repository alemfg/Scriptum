"use client";
import { useState } from "react";
import { Download, FileText, BookOpen, FileJson, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  bookId: string;
}

const FORMATS = [
  { value: "pdf", label: "PDF (KDP-ready)", icon: FileText, desc: "Print-ready PDF with all formatting" },
  { value: "epub", label: "EPUB", icon: BookOpen, desc: "For Kindle and e-readers" },
  { value: "docx", label: "DOCX", icon: FileJson, desc: "Microsoft Word format" },
  { value: "md", label: "Markdown", icon: Type, desc: "Plain text with formatting" },
];

export function ExportPanel({ bookId }: Props) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [mdOptions, setMdOptions] = useState({ singleFile: true, separateByScene: false });

  const exportBook = async (format: string) => {
    setExporting(format);
    try {
      const body: Record<string, unknown> = { format };
      if (format === "md") body.options = mdOptions;

      const res = await fetch(`/api/books/${bookId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Export failed");
        return;
      }

      const contentDisposition = res.headers.get("Content-Disposition");
      const filename = contentDisposition?.split("filename=")[1]?.replace(/"/g, "") ?? `book.${format}`;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--muted-foreground)]">
        Export your book in multiple formats. Format settings are applied automatically.
      </p>

      {FORMATS.map(({ value, label, icon: Icon, desc }) => (
        <div key={value} className="border border-[var(--border)] rounded-xl p-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center">
              <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{desc}</p>
            </div>
          </div>

          {value === "md" && (
            <div className="mb-3 space-y-2">
              <label className="flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer">
                <input
                  type="radio"
                  checked={mdOptions.singleFile}
                  onChange={() => setMdOptions({ ...mdOptions, singleFile: true })}
                  className="accent-[var(--ring)]"
                />
                Single file
              </label>
              <label className="flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer">
                <input
                  type="radio"
                  checked={!mdOptions.singleFile}
                  onChange={() => setMdOptions({ ...mdOptions, singleFile: false })}
                  className="accent-[var(--ring)]"
                />
                Chapter-separated files (ZIP)
              </label>
              <label className="flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={mdOptions.separateByScene}
                  onChange={(e) => setMdOptions({ ...mdOptions, separateByScene: e.target.checked })}
                  className="accent-[var(--ring)]"
                />
                Include scene separators
              </label>
            </div>
          )}

          <button
            onClick={() => exportBook(value)}
            disabled={exporting === value}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors",
              exporting === value
                ? "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            )}
          >
            <Download className="h-4 w-4" />
            {exporting === value ? "Exporting…" : `Export ${label}`}
          </button>
        </div>
      ))}
    </div>
  );
}

"use client";
import { useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import type { FormatSettings, Chapter, ValidationIssue } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  bookId: string;
  chapters: Chapter[];
  settings: Partial<FormatSettings>;
}

export function ValidationPanel({ bookId, chapters, settings }: Props) {
  const [issues, setIssues] = useState<ValidationIssue[] | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}/validate`, { method: "POST" });
      const data = await res.json();
      setIssues(data.issues ?? []);
    } finally {
      setLoading(false);
    }
  };

  // Client-side quick checks
  const quickIssues: ValidationIssue[] = [];
  const totalWords = chapters.reduce((s, c) => s + c.wordCount, 0);
  const estimatedPages = Math.ceil(totalWords / 280);

  if (estimatedPages < 24) {
    quickIssues.push({
      type: "formatting_issue",
      severity: "error",
      message: `KDP requires at least 24 pages. Current estimate: ${estimatedPages} pages.`,
    });
  }

  if (!chapters.some((c) => c.type === "TITLE_PAGE")) {
    quickIssues.push({
      type: "missing_page",
      severity: "warning",
      message: "No Title Page found. KDP recommends including one.",
    });
  }

  if (!chapters.some((c) => c.type === "COPYRIGHT")) {
    quickIssues.push({
      type: "missing_page",
      severity: "warning",
      message: "No Copyright Page found.",
    });
  }

  const emptyChapters = chapters.filter((c) => c.type === "CHAPTER" && !c.wordCount);
  if (emptyChapters.length > 0) {
    quickIssues.push({
      type: "chapter_inconsistency",
      severity: "warning",
      message: `${emptyChapters.length} chapter(s) have no content.`,
    });
  }

  const allIssues = [...quickIssues, ...(issues ?? [])];
  const errors = allIssues.filter((i) => i.severity === "error");
  const warnings = allIssues.filter((i) => i.severity === "warning");

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className={cn("p-2.5 rounded-lg text-center border", errors.length === 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50")}>
          {errors.length === 0
            ? <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
            : <XCircle className="h-4 w-4 text-red-500 mx-auto mb-1" />}
          <p className="text-xs font-semibold text-[var(--foreground)]">{errors.length} Errors</p>
        </div>
        <div className={cn("p-2.5 rounded-lg text-center border", warnings.length === 0 ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50")}>
          <AlertTriangle className={cn("h-4 w-4 mx-auto mb-1", warnings.length === 0 ? "text-green-600" : "text-amber-600")} />
          <p className="text-xs font-semibold text-[var(--foreground)]">{warnings.length} Warnings</p>
        </div>
      </div>

      <button
        onClick={validate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        {loading ? "Validating…" : "Run Full Validation"}
      </button>

      {/* Issues list */}
      {allIssues.length > 0 && (
        <div className="space-y-2">
          {allIssues.map((issue, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2 p-2.5 rounded-lg border text-xs",
                issue.severity === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-amber-200 bg-amber-50"
              )}
            >
              {issue.severity === "error"
                ? <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                : <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />}
              <p className={issue.severity === "error" ? "text-red-700" : "text-amber-700"}>
                {issue.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {allIssues.length === 0 && !loading && (
        <div className="text-center py-6 text-xs text-[var(--muted-foreground)]">
          <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <p>No issues found. Your book looks KDP-ready!</p>
        </div>
      )}
    </div>
  );
}

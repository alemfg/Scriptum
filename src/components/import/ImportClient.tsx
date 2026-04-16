"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ImportedChapter {
  title: string;
  content: string;
  order: number;
}

export function ImportClient({ book }: { book: { id: string; title: string } }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [detectChapters, setDetectChapters] = useState(true);
  const [normalizeStyles, setNormalizeStyles] = useState(true);
  const [preview, setPreview] = useState<ImportedChapter[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState<"preview" | "import" | null>(null);
  const [error, setError] = useState("");

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) {
      setFile(files[0]);
      setPreview(null);
      setError("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "application/epub+zip": [".epub"],
    },
    maxFiles: 1,
  });

  const runPreview = async () => {
    if (!file) return;
    setLoading("preview");
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("detectChapters", String(detectChapters));
    formData.append("normalizeStyles", String(normalizeStyles));
    formData.append("preview", "true");

    try {
      const res = await fetch(`/api/books/${book.id}/import`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Preview failed");
      setPreview(data.chapters);
      setWarnings(data.warnings ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  };

  const runImport = async () => {
    if (!file) return;
    setLoading("import");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("detectChapters", String(detectChapters));
    formData.append("normalizeStyles", String(normalizeStyles));

    try {
      const res = await fetch(`/api/books/${book.id}/import`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      router.push(`/books/${book.id}/write`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setLoading(null);
    }
  };

  const SUPPORTED = ["DOCX", "PDF", "TXT", "Markdown", "EPUB"];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/books/${book.id}/write`} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-1 block">
          ← {book.title}
        </Link>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Import Manuscript</h1>
      </div>

      {/* Supported formats */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SUPPORTED.map((f) => (
          <span key={f} className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--muted-foreground)]">{f}</span>
        ))}
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-5",
          isDragActive ? "border-[var(--ring)] bg-blue-50" : "border-[var(--border)] hover:border-[var(--ring)] hover:bg-[var(--secondary)]"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-[var(--muted-foreground)] mx-auto mb-3" />
        {file ? (
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">{file.name}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-[var(--foreground)] mb-1">Drop your file here or click to browse</p>
            <p className="text-xs text-[var(--muted-foreground)]">Supports DOCX, PDF, TXT, MD, EPUB</p>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="flex gap-6 mb-6">
        <label className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer">
          <input type="checkbox" checked={detectChapters} onChange={(e) => setDetectChapters(e.target.checked)} className="accent-[var(--ring)]" />
          Auto-detect chapters
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer">
          <input type="checkbox" checked={normalizeStyles} onChange={(e) => setNormalizeStyles(e.target.checked)} className="accent-[var(--ring)]" />
          Normalize styles
        </label>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Warnings */}
      {warnings.map((w, i) => (
        <div key={i} className="flex gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700 mb-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {w}
        </div>
      ))}

      {/* Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={runPreview}
          disabled={!file || loading !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--secondary)] transition disabled:opacity-50"
        >
          <FileText className="h-4 w-4" />
          {loading === "preview" ? "Previewing…" : "Preview"}
        </button>
        <button
          onClick={runImport}
          disabled={!file || loading !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          <ArrowRight className="h-4 w-4" />
          {loading === "import" ? "Importing…" : "Import to Book"}
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-sm font-medium text-[var(--foreground)]">
              Found {preview.length} chapter{preview.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="space-y-2">
            {preview.map((ch, i) => (
              <div key={i} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]">
                <p className="text-sm font-medium text-[var(--foreground)]">{ch.title}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  ~{ch.content.split(/\s+/).length} words · {ch.content.slice(0, 100)}…
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

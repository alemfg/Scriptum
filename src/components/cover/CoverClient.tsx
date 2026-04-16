"use client";
import { useState, useRef } from "react";
import { Upload, Save, RefreshCw, BookOpen } from "lucide-react";
import Link from "next/link";
import { calculateSpineWidth } from "@/lib/utils";

interface CoverBook {
  id: string;
  title: string;
  author: string | null;
  coverImage: string | null;
  backImage: string | null;
  spineImage: string | null;
  spineWidth: number;
}

interface Props {
  book: CoverBook;
  estimatedPages: number;
}

export function CoverClient({ book: initialBook, estimatedPages }: Props) {
  const [book, setBook] = useState(initialBook);
  const [customSpineWidth, setCustomSpineWidth] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"front" | "back" | "spine" | null>(null);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const spineWidth = customSpineWidth ?? calculateSpineWidth(estimatedPages);

  const uploadImage = async (type: "front" | "back" | "spine", file: File) => {
    setUploading(type);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("bookId", book.id);

    try {
      const res = await fetch(`/api/books/${book.id}/cover`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        const field = type === "front" ? "coverImage" : type === "back" ? "backImage" : "spineImage";
        setBook((prev) => ({ ...prev, [field]: data.url }));
      }
    } finally {
      setUploading(null);
    }
  };

  const saveSpineWidth = async () => {
    setSaving(true);
    try {
      await fetch(`/api/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spineWidth: customSpineWidth ?? spineWidth }),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href={`/books/${book.id}/format`} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-1 block">
          ← Format Mode
        </Link>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Cover &amp; Spine</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Controls */}
        <div className="space-y-5">
          {/* Spine Width */}
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Spine Width</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-[var(--muted-foreground)]">Auto-calculated:</span>
              <span className="text-sm font-medium text-[var(--foreground)]">{calculateSpineWidth(estimatedPages).toFixed(3)}&quot; ({estimatedPages} pages)</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={customSpineWidth ?? ""}
                onChange={(e) => setCustomSpineWidth(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder={calculateSpineWidth(estimatedPages).toFixed(3)}
                step={0.001}
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
              <span className="text-sm text-[var(--muted-foreground)]">inches</span>
              <button onClick={saveSpineWidth} disabled={saving} className="px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 transition disabled:opacity-50">
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Front Cover */}
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Front Cover</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">High-resolution image, 300 DPI minimum. Must match your trim size.</p>
            <input ref={frontRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadImage("front", e.target.files[0]); }} />
            <button
              onClick={() => frontRef.current?.click()}
              disabled={uploading === "front"}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] text-sm hover:bg-[var(--secondary)] transition disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploading === "front" ? "Uploading…" : "Upload Front Cover"}
            </button>
            {book.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.coverImage} alt="Front cover" className="mt-3 rounded-lg border border-[var(--border)] w-full object-cover max-h-48" />
            )}
          </div>

          {/* Back Cover */}
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Back Cover</h3>
            <input ref={backRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadImage("back", e.target.files[0]); }} />
            <button
              onClick={() => backRef.current?.click()}
              disabled={uploading === "back"}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] text-sm hover:bg-[var(--secondary)] transition disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploading === "back" ? "Uploading…" : "Upload Back Cover"}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Full Wrap Preview</h3>
          <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--secondary)] p-4">
            <div className="flex gap-0 items-stretch rounded-lg overflow-hidden shadow-xl">
              {/* Back */}
              <div className="flex-1 bg-gray-200 min-h-64 flex items-center justify-center text-xs text-gray-500">
                {book.backImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.backImage} alt="Back" className="w-full h-full object-cover" />
                ) : "Back Cover"}
              </div>
              {/* Spine */}
              <div
                className="bg-gray-300 flex items-center justify-center text-xs text-gray-600 overflow-hidden"
                style={{ width: Math.max(20, spineWidth * 96) }}
              >
                <span className="rotate-90 whitespace-nowrap text-xs">{book.title}</span>
              </div>
              {/* Front */}
              <div className="flex-1 bg-gray-100 min-h-64 flex items-center justify-center text-xs text-gray-500">
                {book.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverImage} alt="Front" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>{book.title}</p>
                    {book.author && <p className="text-gray-400">{book.author}</p>}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-center text-[var(--muted-foreground)] mt-3">
              Back Cover | Spine ({spineWidth.toFixed(3)}&quot;) | Front Cover
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

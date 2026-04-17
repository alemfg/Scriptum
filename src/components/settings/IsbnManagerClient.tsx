"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, Check, Barcode, BookOpen, Library } from "lucide-react";

type IsbnType = "PAPERBACK" | "HARDCOVER" | "EBOOK";

interface IsbnEntry {
  id: string;
  isbn: string;
  type: IsbnType;
  label: string | null;
  bookId: string | null;
  collectionId: string | null;
  book: { id: string; title: string } | null;
  collection: { id: string; title: string } | null;
}

interface Props {
  isbns: IsbnEntry[];
  books: { id: string; title: string }[];
  collections: { id: string; title: string }[];
}

const TYPE_LABELS: Record<IsbnType, string> = {
  PAPERBACK: "Paperback",
  HARDCOVER: "Hardcover",
  EBOOK: "Ebook",
};

const TYPE_COLORS: Record<IsbnType, string> = {
  PAPERBACK: "bg-blue-50 text-blue-700",
  HARDCOVER: "bg-purple-50 text-purple-700",
  EBOOK: "bg-green-50 text-green-700",
};

export function IsbnManagerClient({ isbns: initial, books, collections }: Props) {
  const [isbns, setIsbns] = useState<IsbnEntry[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ isbn: "", type: "PAPERBACK" as IsbnType, label: "", collectionId: "", bookId: "" });
  const [saving, setSaving] = useState(false);

  const createIsbn = async () => {
    if (!form.isbn.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/isbns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isbn: form.isbn.trim(),
          type: form.type,
          label: form.label || null,
          collectionId: form.collectionId || null,
          bookId: form.bookId || null,
        }),
      });
      if (res.ok) {
        const entry = await res.json();
        setIsbns((prev) => [...prev, entry]);
        setForm({ isbn: "", type: "PAPERBACK", label: "", collectionId: "", bookId: "" });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteIsbn = async (id: string) => {
    await fetch(`/api/isbns/${id}`, { method: "DELETE" });
    setIsbns((prev) => prev.filter((i) => i.id !== id));
  };

  const updateField = async (id: string, field: "bookId" | "collectionId", value: string | null) => {
    const res = await fetch(`/api/isbns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      setIsbns((prev) => prev.map((i) => i.id === id ? updated : i));
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href="/settings"
        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">ISBN Pool</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" />
          Add ISBN
        </button>
      </div>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        Manage all your ISBN numbers here. Assign each to a collection and/or a specific book.
        Use <code className="font-mono text-xs">[isbn_paperback]</code>,{" "}
        <code className="font-mono text-xs">[isbn_barcode]</code> etc. in page templates to substitute them on export.
      </p>

      {showForm && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">New ISBN Entry</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={form.isbn}
              onChange={(e) => setForm({ ...form, isbn: e.target.value })}
              placeholder="978-0-000-00000-0"
              className="col-span-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as IsbnType })}
              className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="PAPERBACK">Paperback</option>
              <option value="HARDCOVER">Hardcover</option>
              <option value="EBOOK">Ebook</option>
            </select>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Label (e.g. Book 1 – PB)"
              className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            {collections.length > 0 && (
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Collection</label>
                <select
                  value={form.collectionId}
                  onChange={(e) => setForm({ ...form, collectionId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="">— none —</option>
                  {collections.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            )}
            {books.length > 0 && (
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Assign to book</label>
                <select
                  value={form.bookId}
                  onChange={(e) => setForm({ ...form, bookId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="">— unassigned —</option>
                  {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={createIsbn}
              disabled={!form.isbn.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {saving ? "Saving…" : "Create"}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm({ isbn: "", type: "PAPERBACK", label: "", collectionId: "", bookId: "" }); }}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] text-sm hover:bg-[var(--secondary)] transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isbns.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-xl">
          <Barcode className="h-10 w-10 text-[var(--muted-foreground)] mx-auto mb-3 opacity-40" />
          <p className="text-[var(--muted-foreground)] text-sm">No ISBNs yet. Add your first ISBN above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {isbns.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] group">
              <Barcode className="h-4 w-4 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-mono text-[var(--foreground)] font-medium">{entry.isbn}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[entry.type]}`}>
                    {TYPE_LABELS[entry.type]}
                  </span>
                  {entry.label && (
                    <span className="text-xs text-[var(--muted-foreground)] italic">{entry.label}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Library className="h-3 w-3 text-[var(--muted-foreground)] flex-shrink-0" />
                    <select
                      value={entry.collectionId ?? ""}
                      onChange={(e) => updateField(entry.id, "collectionId", e.target.value || null)}
                      className="flex-1 text-xs rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    >
                      <option value="">— no collection —</option>
                      {collections.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3 text-[var(--muted-foreground)] flex-shrink-0" />
                    <select
                      value={entry.bookId ?? ""}
                      onChange={(e) => updateField(entry.id, "bookId", e.target.value || null)}
                      className="flex-1 text-xs rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    >
                      <option value="">— unassigned —</option>
                      {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteIsbn(entry.id)}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 transition-all flex-shrink-0 mt-0.5"
                title="Delete ISBN"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

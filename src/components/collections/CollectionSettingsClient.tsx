"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Trash2, Plus, X, BookOpen,
  Barcode, ChevronDown, Check,
} from "lucide-react";
import Link from "next/link";

type BookStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "PUBLISHED";
type IsbnType = "PAPERBACK" | "HARDCOVER" | "EBOOK";

interface BookSummary {
  id: string;
  title: string;
  author?: string | null;
  status?: BookStatus;
}

interface IsbnEntry {
  id: string;
  isbn: string;
  type: IsbnType;
  label: string | null;
  bookId: string | null;
  book: { id: string; title: string } | null;
}

interface CollectionData {
  id: string;
  title: string;
  description: string | null;
  books: BookSummary[];
  isbns: IsbnEntry[];
}

interface Props {
  collection: CollectionData;
  allBooks: { id: string; title: string; collectionId: string | null }[];
}

const ISBN_TYPE_LABELS: Record<IsbnType, string> = {
  PAPERBACK: "Paperback",
  HARDCOVER: "Hardcover",
  EBOOK: "Ebook",
};

export function CollectionSettingsClient({ collection: initial, allBooks }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [books, setBooks] = useState(initial.books);
  const [isbns, setIsbns] = useState<IsbnEntry[]>(initial.isbns);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Add book state
  const [addingBook, setAddingBook] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [addingBookLoading, setAddingBookLoading] = useState(false);

  // ISBN creation state
  const [showIsbnForm, setShowIsbnForm] = useState(false);
  const [newIsbn, setNewIsbn] = useState({ isbn: "", type: "PAPERBACK" as IsbnType, label: "" });
  const [isbnSaving, setIsbnSaving] = useState(false);

  const availableBooks = allBooks.filter((b) => !books.some((cb) => cb.id === b.id));

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/collections/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description || null }),
      });
      if (!res.ok) throw new Error("Save failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteCollection = async () => {
    if (!confirm(`Delete collection "${title}"? Books will not be deleted.`)) return;
    setDeleting(true);
    await fetch(`/api/collections/${initial.id}`, { method: "DELETE" });
    router.push("/collections");
  };

  const addBook = async () => {
    if (!selectedBookId) return;
    setAddingBookLoading(true);
    try {
      const res = await fetch(`/api/books/${selectedBookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId: initial.id }),
      });
      if (res.ok) {
        const book = allBooks.find((b) => b.id === selectedBookId)!;
        setBooks((prev) => [...prev, { id: book.id, title: book.title }]);
        setSelectedBookId("");
        setAddingBook(false);
      }
    } finally {
      setAddingBookLoading(false);
    }
  };

  const removeBook = async (bookId: string) => {
    await fetch(`/api/books/${bookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId: null }),
    });
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    // Unassign any ISBNs that were bound to this book
    setIsbns((prev) => prev.map((i) => i.bookId === bookId ? { ...i, bookId: null, book: null } : i));
  };

  const createIsbn = async () => {
    if (!newIsbn.isbn.trim()) return;
    setIsbnSaving(true);
    try {
      const res = await fetch("/api/isbns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newIsbn, collectionId: initial.id }),
      });
      if (res.ok) {
        const entry = await res.json();
        setIsbns((prev) => [...prev, entry]);
        setNewIsbn({ isbn: "", type: "PAPERBACK", label: "" });
        setShowIsbnForm(false);
      }
    } finally {
      setIsbnSaving(false);
    }
  };

  const deleteIsbn = async (isbnId: string) => {
    await fetch(`/api/isbns/${isbnId}`, { method: "DELETE" });
    setIsbns((prev) => prev.filter((i) => i.id !== isbnId));
  };

  const assignIsbnToBook = async (isbnId: string, bookId: string | null) => {
    const res = await fetch(`/api/isbns/${isbnId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    });
    if (res.ok) {
      const updated = await res.json();
      setIsbns((prev) => prev.map((i) => i.id === isbnId ? updated : i));
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/collections"
        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Collections
      </Link>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-8">Collection Settings</h1>

      <div className="space-y-6">
        {/* Name / Description */}
        <div className="border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Details</h2>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Name *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={save}
            disabled={saving || !title.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {/* Books */}
        <div className="border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Books <span className="font-normal text-[var(--muted-foreground)]">({books.length})</span>
            </h2>
            {!addingBook && (
              <button
                onClick={() => setAddingBook(true)}
                disabled={availableBooks.length === 0}
                className="flex items-center gap-1 text-xs text-[var(--primary)] hover:opacity-80 transition disabled:opacity-40 disabled:cursor-default"
              >
                <Plus className="h-3.5 w-3.5" />
                Add book
              </button>
            )}
          </div>

          {addingBook && (
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none pr-7"
                >
                  <option value="">Select book…</option>
                  {availableBooks.map((b) => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--muted-foreground)] pointer-events-none" />
              </div>
              <button
                onClick={addBook}
                disabled={!selectedBookId || addingBookLoading}
                className="px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {addingBookLoading ? "…" : "Add"}
              </button>
              <button
                onClick={() => { setAddingBook(false); setSelectedBookId(""); }}
                className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] text-xs hover:bg-[var(--secondary)] transition"
              >
                Cancel
              </button>
            </div>
          )}

          {books.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)] italic">No books in this collection.</p>
          ) : (
            <div className="space-y-1.5">
              {books.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] group">
                  <BookOpen className="h-3.5 w-3.5 text-[var(--muted-foreground)] flex-shrink-0" />
                  <Link
                    href={`/books/${b.id}/write`}
                    className="flex-1 text-sm text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate"
                  >
                    {b.title}
                  </Link>
                  <button
                    onClick={() => removeBook(b.id)}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 transition-all"
                    title="Remove from collection"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ISBNs */}
        <div className="border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">ISBN Pool</h2>
            <button
              onClick={() => setShowIsbnForm((v) => !v)}
              className="flex items-center gap-1 text-xs text-[var(--primary)] hover:opacity-80 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add ISBN
            </button>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Create ISBNs for this collection and assign each to a specific book. Use{" "}
            <code className="font-mono">[isbn_paperback]</code>,{" "}
            <code className="font-mono">[isbn_barcode]</code> etc. in page templates.
          </p>

          {showIsbnForm && (
            <div className="mb-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newIsbn.isbn}
                  onChange={(e) => setNewIsbn({ ...newIsbn, isbn: e.target.value })}
                  placeholder="978-0-000-00000-0"
                  className="col-span-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-[var(--foreground)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
                <select
                  value={newIsbn.type}
                  onChange={(e) => setNewIsbn({ ...newIsbn, type: e.target.value as IsbnType })}
                  className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="PAPERBACK">Paperback</option>
                  <option value="HARDCOVER">Hardcover</option>
                  <option value="EBOOK">Ebook</option>
                </select>
                <input
                  type="text"
                  value={newIsbn.label}
                  onChange={(e) => setNewIsbn({ ...newIsbn, label: e.target.value })}
                  placeholder="Label (optional)"
                  className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createIsbn}
                  disabled={!newIsbn.isbn.trim() || isbnSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {isbnSaving ? "Saving…" : "Create"}
                </button>
                <button
                  onClick={() => { setShowIsbnForm(false); setNewIsbn({ isbn: "", type: "PAPERBACK", label: "" }); }}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] text-xs hover:bg-white transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isbns.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)] italic">No ISBNs yet.</p>
          ) : (
            <div className="space-y-2">
              {isbns.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] group">
                  <Barcode className="h-4 w-4 text-[var(--muted-foreground)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[var(--foreground)]">{entry.isbn}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] font-medium">
                        {ISBN_TYPE_LABELS[entry.type]}
                      </span>
                      {entry.label && (
                        <span className="text-[10px] text-[var(--muted-foreground)] italic truncate">{entry.label}</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[10px] text-[var(--muted-foreground)]">Assigned to:</span>
                      <select
                        value={entry.bookId ?? ""}
                        onChange={(e) => assignIsbnToBook(entry.id, e.target.value || null)}
                        className="text-[10px] rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      >
                        <option value="">— unassigned —</option>
                        {books.map((b) => (
                          <option key={b.id} value={b.id}>{b.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteIsbn(entry.id)}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 transition-all"
                    title="Delete ISBN"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="border border-red-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            Delete this collection. Books will remain but will no longer belong to a collection.
          </p>
          <button
            onClick={deleteCollection}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting…" : "Delete Collection"}
          </button>
        </div>
      </div>
    </div>
  );
}

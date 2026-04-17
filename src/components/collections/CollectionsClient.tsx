"use client";
import { useState } from "react";
import Link from "next/link";
import { Library, Plus, BookOpen, X, ChevronDown } from "lucide-react";

interface BookSummary {
  id: string;
  title: string;
  collectionId: string | null;
}

interface Collection {
  id: string;
  title: string;
  description: string | null;
  books: { id: string; title: string }[];
}

interface Props {
  collections: Collection[];
  allBooks: BookSummary[];
}

function CollectionCard({
  collection,
  allBooks,
  onBookAdded,
  onBookRemoved,
}: {
  collection: Collection;
  allBooks: BookSummary[];
  onBookAdded: (collectionId: string, book: BookSummary) => void;
  onBookRemoved: (collectionId: string, bookId: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [loading, setLoading] = useState(false);

  const availableBooks = allBooks.filter(
    (b) => !collection.books.some((cb) => cb.id === b.id)
  );

  const addBook = async () => {
    if (!selectedBookId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${selectedBookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId: collection.id }),
      });
      if (res.ok) {
        const book = allBooks.find((b) => b.id === selectedBookId)!;
        onBookAdded(collection.id, book);
        setSelectedBookId("");
        setAdding(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const removeBook = async (bookId: string) => {
    await fetch(`/api/books/${bookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId: null }),
    });
    onBookRemoved(collection.id, bookId);
  };

  return (
    <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-[var(--secondary)] flex items-center justify-center">
          <Library className="h-5 w-5 text-[var(--muted-foreground)]" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--foreground)]">{collection.title}</h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            {collection.books.length} book{collection.books.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {collection.description && (
        <p className="text-sm text-[var(--muted-foreground)] mb-3">{collection.description}</p>
      )}

      <div className="space-y-1 mb-3">
        {collection.books.map((b) => (
          <div key={b.id} className="flex items-center gap-2 group">
            <Link
              href={`/books/${b.id}/write`}
              className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex-1"
            >
              <BookOpen className="h-3 w-3 flex-shrink-0" />
              {b.title}
            </Link>
            <button
              onClick={() => removeBook(b.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--muted-foreground)] hover:text-red-500 transition-all"
              title="Remove from collection"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)] appearance-none pr-7"
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
            disabled={!selectedBookId || loading}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "…" : "Add"}
          </button>
          <button
            onClick={() => { setAdding(false); setSelectedBookId(""); }}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] text-xs hover:bg-[var(--secondary)] transition"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          disabled={availableBooks.length === 0}
          className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mt-1 disabled:opacity-40 disabled:cursor-default"
          title={availableBooks.length === 0 ? "All your books are already in this collection" : undefined}
        >
          <Plus className="h-3 w-3" />
          Add book
        </button>
      )}
    </div>
  );
}

export function CollectionsClient({ collections: initial, allBooks: initialBooks }: Props) {
  const [collections, setCollections] = useState(initial);
  const [allBooks, setAllBooks] = useState(initialBooks);

  const handleBookAdded = (collectionId: string, book: BookSummary) => {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId ? { ...c, books: [...c.books, book] } : c
      )
    );
    setAllBooks((prev) =>
      prev.map((b) => (b.id === book.id ? { ...b, collectionId } : b))
    );
  };

  const handleBookRemoved = (collectionId: string, bookId: string) => {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId
          ? { ...c, books: c.books.filter((b) => b.id !== bookId) }
          : c
      )
    );
    setAllBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, collectionId: null } : b))
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Collections / Series</h1>
        <Link
          href="/collections/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" />
          New Collection
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-xl">
          <Library className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No collections yet</h3>
          <p className="text-[var(--muted-foreground)] mb-6">Group your books into series or sagas.</p>
          <Link
            href="/collections/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            Create Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {collections.map((col) => (
            <CollectionCard
              key={col.id}
              collection={col}
              allBooks={allBooks}
              onBookAdded={handleBookAdded}
              onBookRemoved={handleBookRemoved}
            />
          ))}
        </div>
      )}
    </div>
  );
}

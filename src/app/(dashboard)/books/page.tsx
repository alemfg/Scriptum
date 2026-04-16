import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatWordCount } from "@/lib/utils";
import { BookOpen, Plus, Users } from "lucide-react";

function BookCard({
  book,
  badge,
}: {
  book: {
    id: string;
    title: string;
    author: string | null;
    status: string;
    genre: string | null;
    wordGoal: number | null;
    chapters: { wordCount: number }[];
    collection: { title: string } | null;
  };
  badge?: string;
}) {
  const words = book.chapters.reduce((s, c) => s + c.wordCount, 0);
  const progress = book.wordGoal ? Math.min(100, Math.round((words / book.wordGoal) * 100)) : null;

  return (
    <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-10 rounded-lg bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-[var(--muted-foreground)]" />
        </div>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700">
              {badge}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            book.status === "COMPLETED" ? "bg-green-100 text-green-700" :
            book.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
            book.status === "PUBLISHED" ? "bg-purple-100 text-purple-700" :
            "bg-[var(--secondary)] text-[var(--muted-foreground)]"
          }`}>
            {book.status.replace("_", " ")}
          </span>
        </div>
      </div>
      <h3 className="font-semibold text-[var(--foreground)] mb-1 line-clamp-2">{book.title}</h3>
      {book.author && <p className="text-xs text-[var(--muted-foreground)] mb-1">{book.author}</p>}
      {book.collection && (
        <p className="text-xs text-[var(--muted-foreground)] mb-2">Series: {book.collection.title}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] mb-4">
        <span>{formatWordCount(words)} words</span>
        <span>·</span>
        <span>{book.chapters.length} chapters</span>
        {book.genre && <><span>·</span><span>{book.genre}</span></>}
      </div>
      {progress !== null && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1">
            <span>Goal progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--secondary)]">
            <div
              className="h-full rounded-full bg-[var(--ring)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 mt-auto">
        <Link
          href={`/books/${book.id}/write`}
          className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition"
        >
          Write
        </Link>
        <Link
          href={`/books/${book.id}/format`}
          className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)] transition"
        >
          Format
        </Link>
      </div>
    </div>
  );
}

export default async function BooksPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [books, sharedAccess] = await Promise.all([
    db.book.findMany({
      where: { userId },
      include: {
        chapters: { select: { wordCount: true } },
        collection: { select: { title: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.projectAccess.findMany({
      where: { userId },
      include: {
        book: {
          include: {
            chapters: { select: { wordCount: true } },
            collection: { select: { title: true } },
          },
        },
      },
    }),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">My Books</h1>
        <Link
          href="/books/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" />
          New Book
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-xl">
          <BookOpen className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No books yet</h3>
          <p className="text-[var(--muted-foreground)] mb-6">Create your first book to get started.</p>
          <Link
            href="/books/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            Create Book
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {books.map((book) => <BookCard key={book.id} book={book} />)}
        </div>
      )}

      {sharedAccess.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Shared with me</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sharedAccess.map((a) => (
              <BookCard key={a.book.id} book={a.book} badge={a.role} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatWordCount } from "@/lib/utils";
import { BookOpen, PenLine, Plus, TrendingUp, Library } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [books, recentSessions, collections] = await Promise.all([
    db.book.findMany({
      where: { userId },
      include: { chapters: { select: { wordCount: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    db.writingSession.findMany({
      where: { book: { userId } },
      orderBy: { date: "desc" },
      take: 7,
    }),
    db.collection.findMany({
      where: { userId },
      include: { books: { select: { id: true, title: true } } },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
  ]);

  const totalWords = books.reduce(
    (acc, b) => acc + b.chapters.reduce((s, c) => s + c.wordCount, 0),
    0
  );
  const sessionWords = recentSessions.reduce((s, r) => s + r.words, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Welcome back, {session!.user.name ?? "Author"}
        </h1>
        <p className="text-[var(--muted-foreground)] mt-1">Here&apos;s your writing overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <span className="text-sm text-indigo-700">Total Books</span>
          </div>
          <p className="text-3xl font-bold text-indigo-900">{books.length}</p>
        </div>
        <div className="p-5 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white">
          <div className="flex items-center gap-2 mb-2">
            <PenLine className="h-4 w-4 text-violet-500" />
            <span className="text-sm text-violet-700">Total Words</span>
          </div>
          <p className="text-3xl font-bold text-violet-900">{formatWordCount(totalWords)}</p>
        </div>
        <div className="p-5 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-amber-700">Last 7 Sessions</span>
          </div>
          <p className="text-3xl font-bold text-amber-900">{formatWordCount(sessionWords)}</p>
        </div>
      </div>

      {/* Recent Books */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent Books</h2>
        <Link
          href="/books/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" />
          New Book
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-xl">
          <BookOpen className="h-10 w-10 text-[var(--muted-foreground)] mx-auto mb-3" />
          <p className="text-[var(--muted-foreground)] mb-4">No books yet. Start writing your first book!</p>
          <Link
            href="/books/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            Create First Book
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => {
            const words = book.chapters.reduce((s, c) => s + c.wordCount, 0);
            return (
              <Link
                key={book.id}
                href={`/books/${book.id}/write`}
                className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--ring)] transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-[var(--secondary)] flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-[var(--muted-foreground)]" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    book.status === "COMPLETED"
                      ? "bg-green-100 text-green-700"
                      : book.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                  }`}>
                    {book.status.replace("_", " ")}
                  </span>
                </div>
                <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--ring)] transition-colors line-clamp-2">
                  {book.title}
                </h3>
                {book.author && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">{book.author}</p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                  <span>{formatWordCount(words)} words</span>
                  <span>·</span>
                  <span>{book.chapters.length} chapters</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {/* Collections */}
      {collections.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Collections</h2>
            <Link href="/collections" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {collections.map((col) => (
              <Link
                key={col.id}
                href="/collections"
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--ring)] transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Library className="h-4 w-4 text-violet-600" />
                  </div>
                  <h3 className="font-medium text-sm text-[var(--foreground)] truncate group-hover:text-[var(--ring)] transition-colors">
                    {col.title}
                  </h3>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {col.books.length} book{col.books.length !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

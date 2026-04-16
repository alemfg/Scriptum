import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatWordCount } from "@/lib/utils";
import { BookOpen, PenLine, Plus, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [books, recentSessions] = await Promise.all([
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
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted-foreground)]">Total Books</span>
          </div>
          <p className="text-3xl font-bold text-[var(--foreground)]">{books.length}</p>
        </div>
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-2">
            <PenLine className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted-foreground)]">Total Words</span>
          </div>
          <p className="text-3xl font-bold text-[var(--foreground)]">{formatWordCount(totalWords)}</p>
        </div>
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted-foreground)]">Last 7 Sessions</span>
          </div>
          <p className="text-3xl font-bold text-[var(--foreground)]">{formatWordCount(sessionWords)}</p>
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
    </div>
  );
}

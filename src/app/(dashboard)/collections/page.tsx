import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Library, Plus, BookOpen } from "lucide-react";

export default async function CollectionsPage() {
  const session = await auth();
  const collections = await db.collection.findMany({
    where: { userId: session!.user.id },
    include: { books: { select: { id: true, title: true } } },
    orderBy: { updatedAt: "desc" },
  });

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
            <div key={col.id} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-[var(--secondary)] flex items-center justify-center">
                  <Library className="h-5 w-5 text-[var(--muted-foreground)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">{col.title}</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">{col.books.length} book{col.books.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              {col.description && <p className="text-sm text-[var(--muted-foreground)] mb-3">{col.description}</p>}
              <div className="space-y-1">
                {col.books.map((b) => (
                  <Link key={b.id} href={`/books/${b.id}/write`} className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                    <BookOpen className="h-3 w-3" />
                    {b.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

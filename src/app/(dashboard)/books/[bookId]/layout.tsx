import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BookNavWrapper } from "@/components/layout/BookNavWrapper";

export default async function BookLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ bookId: string }>;
}) {
  const session = await auth();
  const { bookId } = await params;

  const userId = session!.user.id;

  const [book, access] = await Promise.all([
    db.book.findFirst({
      where: {
        id: bookId,
        OR: [
          { userId },
          { projectAccess: { some: { userId } } },
        ],
      },
      select: { id: true, title: true, userId: true },
    }),
    db.projectAccess.findUnique({
      where: { bookId_userId: { bookId, userId } },
      select: { role: true },
    }),
  ]);

  if (!book) notFound();

  const isOwner = book.userId === userId;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <BookNavWrapper bookId={book.id} bookTitle={book.title} isOwner={isOwner} />
      {children}
    </div>
  );
}

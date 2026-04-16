import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { WriteModeClient } from "@/components/write/WriteModeClient";

export default async function WriteModePage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const session = await auth();
  const { bookId } = await params;

  const userId = session!.user.id;
  const book = await db.book.findFirst({
    where: {
      id: bookId,
      OR: [
        { userId },
        { projectAccess: { some: { userId } } },
      ],
    },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        include: {
          scenes: { orderBy: { order: "asc" } },
          versions: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, createdAt: true, label: true, wordCount: true },
          },
        },
      },
    },
  });

  if (!book) notFound();

  const isOwner = book.userId === userId;
  const access = isOwner ? null : await db.projectAccess.findUnique({
    where: { bookId_userId: { bookId, userId } },
    select: { role: true },
  });
  const readOnly = !isOwner && access?.role === "VIEWER";

  return <WriteModeClient book={book} userId={userId} readOnly={readOnly} />;
}

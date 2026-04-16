import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BookSettingsClient } from "@/components/layout/BookSettingsClient";

export default async function BookSettingsPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const session = await auth();
  const { bookId } = await params;

  const book = await db.book.findFirst({
    where: { id: bookId, userId: session!.user.id },
    include: {
      collection: { select: { id: true, title: true } },
    },
  });

  if (!book) notFound();

  const collections = await db.collection.findMany({
    where: { userId: session!.user.id },
    select: { id: true, title: true },
  });

  return <BookSettingsClient book={book} collections={collections} />;
}

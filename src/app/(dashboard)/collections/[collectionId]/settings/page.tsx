import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CollectionSettingsClient } from "@/components/collections/CollectionSettingsClient";

export default async function CollectionSettingsPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const session = await auth();
  const { collectionId } = await params;

  const [collection, allBooks] = await Promise.all([
    db.collection.findFirst({
      where: { id: collectionId, userId: session!.user.id },
      include: {
        books: {
          select: { id: true, title: true, author: true, status: true },
          orderBy: { title: "asc" },
        },
        isbns: {
          include: { book: { select: { id: true, title: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    db.book.findMany({
      where: { userId: session!.user.id },
      select: { id: true, title: true, collectionId: true },
      orderBy: { title: "asc" },
    }),
  ]);

  if (!collection) notFound();

  return <CollectionSettingsClient collection={collection} allBooks={allBooks} />;
}

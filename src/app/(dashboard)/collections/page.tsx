import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CollectionsClient } from "@/components/collections/CollectionsClient";

export default async function CollectionsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [collections, allBooks] = await Promise.all([
    db.collection.findMany({
      where: { userId },
      include: { books: { select: { id: true, title: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.book.findMany({
      where: { userId },
      select: { id: true, title: true, collectionId: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return <CollectionsClient collections={collections} allBooks={allBooks} />;
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { IsbnManagerClient } from "@/components/settings/IsbnManagerClient";

export default async function IsbnSettingsPage() {
  const session = await auth();

  const [isbns, books, collections] = await Promise.all([
    db.isbnEntry.findMany({
      where: { userId: session!.user.id },
      include: {
        book: { select: { id: true, title: true } },
        collection: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.book.findMany({
      where: { userId: session!.user.id },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    db.collection.findMany({
      where: { userId: session!.user.id },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return <IsbnManagerClient isbns={isbns} books={books} collections={collections} />;
}

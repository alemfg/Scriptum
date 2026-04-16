import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { FormatModeClient } from "@/components/format/FormatModeClient";

export default async function FormatModePage({
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
        include: { scenes: { orderBy: { order: "asc" } } },
      },
      formatSettings: true,
    },
  });

  if (!book) notFound();

  return <FormatModeClient book={book} />;
}

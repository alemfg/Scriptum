import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ImportClient } from "@/components/import/ImportClient";

export default async function ImportPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const session = await auth();
  const { bookId } = await params;

  const book = await db.book.findFirst({
    where: { id: bookId },
    select: { id: true, title: true },
  });

  if (!book) notFound();

  return <ImportClient book={book} />;
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { BackupClient } from "@/components/backup/BackupClient";

export default async function BackupPage({
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

  const backups = await db.backup.findMany({
    where: { bookId },
    orderBy: { createdAt: "desc" },
  });

  return <BackupClient book={book} backups={backups} />;
}

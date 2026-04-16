import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CoverClient } from "@/components/cover/CoverClient";
import { estimatePageCount, calculateSpineWidth } from "@/lib/utils";

export default async function CoverPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const session = await auth();
  const { bookId } = await params;

  const book = await db.book.findFirst({
    where: { id: bookId },
    include: {
      chapters: { select: { wordCount: true } },
      formatSettings: { select: { trimSize: true } },
    },
  });

  if (!book) notFound();

  const totalWords = book.chapters.reduce((s, c) => s + c.wordCount, 0);
  const estimatedPages = estimatePageCount(totalWords, book.formatSettings?.trimSize ?? "6x9");
  const spineWidth = calculateSpineWidth(estimatedPages);

  return (
    <CoverClient
      book={{
        id: book.id,
        title: book.title,
        author: book.author,
        coverImage: book.coverImage,
        backImage: book.backImage,
        spineImage: book.spineImage,
        spineWidth: book.spineWidth ?? spineWidth,
      }}
      estimatedPages={estimatedPages}
    />
  );
}

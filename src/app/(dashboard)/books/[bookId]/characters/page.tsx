import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CharactersClient } from "@/components/characters/CharactersClient";

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const session = await auth();
  const { bookId } = await params;

  const book = await db.book.findFirst({
    where: { id: bookId },
    include: { characters: { orderBy: { name: "asc" } } },
  });

  if (!book) notFound();

  return <CharactersClient book={book} />;
}

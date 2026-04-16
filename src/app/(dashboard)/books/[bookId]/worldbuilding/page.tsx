import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { WorldbuildingClient } from "@/components/worldbuilding/WorldbuildingClient";

export default async function WorldbuildingPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const session = await auth();
  const { bookId } = await params;

  const book = await db.book.findFirst({
    where: { id: bookId },
    include: { worldbuilding: { orderBy: [{ type: "asc" }, { order: "asc" }] } },
  });

  if (!book) notFound();

  return <WorldbuildingClient book={book} />;
}

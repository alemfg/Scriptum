import { db } from "@/lib/db";

/**
 * Verifies a user can read a book (owner or any collaborator).
 * Returns the book record or null.
 */
export async function verifyBookReadAccess(bookId: string, userId: string) {
  return db.book.findFirst({
    where: {
      id: bookId,
      OR: [
        { userId },
        { projectAccess: { some: { userId } } },
      ],
    },
  });
}

/**
 * Verifies a user can write to a book (owner or EDITOR collaborator).
 * Returns the book record or null.
 */
export async function verifyBookWriteAccess(bookId: string, userId: string) {
  return db.book.findFirst({
    where: {
      id: bookId,
      OR: [
        { userId },
        { projectAccess: { some: { userId, role: "EDITOR" } } },
      ],
    },
  });
}

/**
 * Verifies a user owns a book (used for destructive/admin operations).
 * Returns the book record or null.
 */
export async function verifyBookOwner(bookId: string, userId: string) {
  return db.book.findFirst({ where: { id: bookId, userId } });
}

"use client";
import { usePathname } from "next/navigation";
import { BookNav } from "./BookNav";

export function BookNavWrapper({ bookId, bookTitle, isOwner }: { bookId: string; bookTitle: string; isOwner: boolean }) {
  const pathname = usePathname();
  // Write and Format modes are full-screen — they handle their own layout
  const isFullScreen = pathname.endsWith("/write") || pathname.endsWith("/format");
  if (isFullScreen) return null;
  return <BookNav bookId={bookId} bookTitle={bookTitle} isOwner={isOwner} />;
}

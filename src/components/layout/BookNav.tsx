"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenLine, Layout, Users, Globe, Image, Upload, Database, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = (bookId: string) => [
  { href: `/books/${bookId}/write`, label: "Write", icon: PenLine, ownerOnly: false },
  { href: `/books/${bookId}/format`, label: "Format", icon: Layout, ownerOnly: false },
  { href: `/books/${bookId}/characters`, label: "Characters", icon: Users, ownerOnly: false },
  { href: `/books/${bookId}/worldbuilding`, label: "World", icon: Globe, ownerOnly: false },
  { href: `/books/${bookId}/cover`, label: "Cover", icon: Image, ownerOnly: false },
  { href: `/books/${bookId}/import`, label: "Import", icon: Upload, ownerOnly: false },
  { href: `/books/${bookId}/backup`, label: "Backup", icon: Database, ownerOnly: true },
  { href: `/books/${bookId}/settings`, label: "Settings", icon: Settings, ownerOnly: true },
];

export function BookNav({ bookId, bookTitle, isOwner }: { bookId: string; bookTitle: string; isOwner: boolean }) {
  const pathname = usePathname();

  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)] px-6">
      <div className="flex items-center gap-1 overflow-x-auto">
        {NAV_ITEMS(bookId).filter(({ ownerOnly }) => !ownerOnly || isOwner).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors",
              pathname === href
                ? "border-[var(--ring)] text-[var(--foreground)] font-medium"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

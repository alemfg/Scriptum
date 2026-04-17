"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Settings,
  LogOut,
  ChevronRight,
  PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/books", label: "Books", icon: BookOpen },
  { href: "/collections", label: "Collections", icon: Library },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const pathname = usePathname();

  // Write and Format modes are full-screen — bypass the shell entirely
  if (pathname.endsWith("/write") || pathname.endsWith("/format")) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Sidebar */}
      <aside className="sidebar w-[var(--sidebar-width)] flex-shrink-0 border-r border-[var(--border)] flex flex-col bg-[var(--sidebar-bg)]">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-[var(--border)]">
          <PenLine className="h-5 w-5 text-[var(--primary)]" />
          <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">Scriptum</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-[var(--muted-foreground)] hover:bg-white/60 hover:text-[var(--foreground)]"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {active && <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="h-8 w-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-xs font-semibold">
              {user.name?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                {user.name ?? "Author"}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

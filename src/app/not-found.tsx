import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--muted-foreground)] mb-4">404</h1>
        <p className="text-lg text-[var(--foreground)] mb-6">Page not found</p>
        <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

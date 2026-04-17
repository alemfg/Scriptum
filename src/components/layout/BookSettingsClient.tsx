"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, ArrowLeft, UserPlus, X } from "lucide-react";
import Link from "next/link";
import type { Book } from "@/types";

const GENRES = ["Fiction", "Fantasy", "Science Fiction", "Mystery", "Romance", "Thriller", "Horror", "Non-Fiction", "Biography", "Self-Help", "Poetry", "Other"];
const STATUSES = ["DRAFT", "IN_PROGRESS", "COMPLETED", "PUBLISHED"];

interface Collaborator {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string };
}

interface Props {
  book: Book & { collection: { id: string; title: string } | null };
  collections: { id: string; title: string }[];
}

export function BookSettingsClient({ book: initialBook, collections }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initialBook.title,
    author: initialBook.author ?? "",
    genre: initialBook.genre ?? "",
    description: initialBook.description ?? "",
    language: initialBook.language ?? "en",
    status: initialBook.status,
    wordGoal: initialBook.wordGoal?.toString() ?? "",
    collectionId: initialBook.collection?.id ?? "",
    isbnPaperback: (initialBook as Book & { isbnPaperback?: string | null }).isbnPaperback ?? "",
    isbnHardcover: (initialBook as Book & { isbnHardcover?: string | null }).isbnHardcover ?? "",
    isbnEbook: (initialBook as Book & { isbnEbook?: string | null }).isbnEbook ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Collaborators
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EDITOR");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    fetch(`/api/books/${initialBook.id}/collaborators`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCollaborators(data); })
      .catch(() => {});
  }, [initialBook.id]);

  const inviteCollaborator = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");
    try {
      const res = await fetch(`/api/books/${initialBook.id}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error ?? "Invite failed");
      } else {
        setCollaborators((prev) => [...prev, data]);
        setInviteEmail("");
      }
    } finally {
      setInviting(false);
    }
  };

  const removeCollaborator = async (userId: string) => {
    await fetch(`/api/books/${initialBook.id}/collaborators/${userId}`, { method: "DELETE" });
    setCollaborators((prev) => prev.filter((c) => c.user.id !== userId));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/books/${initialBook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          wordGoal: form.wordGoal ? parseInt(form.wordGoal) : null,
          collectionId: form.collectionId || null,
          isbnPaperback: form.isbnPaperback || null,
          isbnHardcover: form.isbnHardcover || null,
          isbnEbook: form.isbnEbook || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteBook = async () => {
    if (!confirm(`Delete "${initialBook.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/books/${initialBook.id}`, { method: "DELETE" });
    router.push("/books");
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href={`/books/${initialBook.id}/write`} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to {initialBook.title}
      </Link>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-8">Book Settings</h1>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Title *</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Author</label>
          <input type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Genre</label>
            <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
              <option value="">Select genre</option>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Collection / Series</label>
          <select value={form.collectionId} onChange={(e) => setForm({ ...form, collectionId: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
            <option value="">No collection</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3} className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Word Goal</label>
          <input type="number" value={form.wordGoal} onChange={(e) => setForm({ ...form, wordGoal: e.target.value })}
            placeholder="e.g. 80000" className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
        </div>

        <div className="border border-[var(--border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">ISBNs</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">Used in export placeholders: <code className="font-mono">[isbn_paperback]</code>, <code className="font-mono">[isbn_ebook]</code></p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Paperback ISBN-13</label>
              <input type="text" value={form.isbnPaperback} onChange={(e) => setForm({ ...form, isbnPaperback: e.target.value })}
                placeholder="978-0-000-00000-0" maxLength={17}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Hardcover ISBN-13</label>
              <input type="text" value={form.isbnHardcover} onChange={(e) => setForm({ ...form, isbnHardcover: e.target.value })}
                placeholder="978-0-000-00000-0" maxLength={17}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Ebook ISBN-13</label>
              <input type="text" value={form.isbnEbook} onChange={(e) => setForm({ ...form, isbnEbook: e.target.value })}
                placeholder="978-0-000-00000-0" maxLength={17}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {/* Collaborators */}
        <div className="border border-[var(--border)] rounded-xl p-4 mt-8">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Collaborators</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">Invite other Scriptum users by email to view or edit this book.</p>

          <div className="flex gap-2 mb-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") inviteCollaborator(); }}
              placeholder="user@example.com"
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-2 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <button
              onClick={inviteCollaborator}
              disabled={inviting || !inviteEmail.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              {inviting ? "Inviting…" : "Invite"}
            </button>
          </div>

          {inviteError && <p className="text-xs text-red-600 mb-3">{inviteError}</p>}

          {collaborators.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)] italic">No collaborators yet.</p>
          ) : (
            <div className="space-y-2">
              {collaborators.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{c.user.name ?? c.user.email}</p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">{c.user.email}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)]">{c.role}</span>
                  <button
                    onClick={() => removeCollaborator(c.user.id)}
                    className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                    title="Remove collaborator"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="border border-red-200 rounded-xl p-4 mt-8">
          <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">Permanently delete this book and all its content. This cannot be undone.</p>
          <button onClick={deleteBook} disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition disabled:opacity-50">
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting…" : "Delete Book"}
          </button>
        </div>
      </div>
    </div>
  );
}

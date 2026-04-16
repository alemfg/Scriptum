"use client";
import { useRef, useState } from "react";
import { Archive, Clock, HardDrive, RefreshCw, Upload } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { Backup } from "@/types";

interface Props {
  book: { id: string; title: string };
  backups: Backup[];
}

export function BackupClient({ book, backups: initialBackups }: Props) {
  const [backups, setBackups] = useState(initialBackups);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const createBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/books/${book.id}/backup`, { method: "POST" });
      if (!res.ok) throw new Error("Backup failed");

      const contentDisposition = res.headers.get("Content-Disposition");
      const filename = contentDisposition?.split("filename=")[1]?.replace(/"/g, "") ?? `${book.title}-backup.zip`;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      // Refresh backups list
      const r = await fetch(`/api/books/${book.id}/backup`);
      if (r.ok) setBackups(await r.json());
    } finally {
      setCreating(false);
    }
  };

  const restoreFromZip = async (file: File) => {
    if (!confirm("Restore from this backup? All current chapters, characters, worldbuilding, and format settings will be replaced. This cannot be undone.")) return;
    setRestoring(true);
    setRestoreError(null);
    setRestoreSuccess(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/books/${book.id}/restore`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setRestoreError(data.error ?? "Restore failed");
      } else {
        setRestoreSuccess(true);
      }
    } catch {
      setRestoreError("Network error during restore");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/books/${book.id}/write`} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-1 block">
          ← {book.title}
        </Link>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Backup & Restore</h1>
      </div>

      {/* Create backup */}
      <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] mb-6">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Create Backup</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Downloads a ZIP containing all chapters, characters, worldbuilding, scenes, and format settings.
        </p>
        <div className="flex flex-wrap gap-2 mb-4 text-xs text-[var(--muted-foreground)]">
          {["Text content", "Format settings", "Characters", "Worldbuilding", "Scenes"].map((item) => (
            <span key={item} className="px-2 py-0.5 rounded-full bg-[var(--secondary)]">{item}</span>
          ))}
        </div>
        <button
          onClick={createBackup}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
          {creating ? "Creating backup…" : "Create & Download Backup"}
        </button>
      </div>

      {/* Restore from ZIP */}
      <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] mb-6">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Restore from Backup</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Upload a previously downloaded backup ZIP to restore chapters, characters, worldbuilding, and format settings.
          The book title and author are not changed.
        </p>
        {restoreError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{restoreError}</p>
        )}
        {restoreSuccess && (
          <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-3">
            Restore complete. Reload the page to see the updated content.
          </p>
        )}
        <input
          ref={restoreInputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) restoreFromZip(file);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => restoreInputRef.current?.click()}
          disabled={restoring}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)] hover:bg-[var(--secondary)] transition disabled:opacity-50"
        >
          {restoring ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {restoring ? "Restoring…" : "Upload & Restore Backup"}
        </button>
      </div>

      {/* Backup history */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Backup History</h3>
        {backups.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-[var(--border)] rounded-xl text-[var(--muted-foreground)] text-sm">
            No backups yet.
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]">
                <Archive className="h-4 w-4 text-[var(--muted-foreground)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">{b.filename}</p>
                  <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(b.createdAt), "PPp")}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {(b.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

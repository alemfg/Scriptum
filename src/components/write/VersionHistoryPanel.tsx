"use client";
import { useState, useEffect } from "react";
import { Clock, RotateCcw, Save, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Version {
  id: string;
  createdAt: string;
  label: string | null;
  wordCount: number;
}

interface Props {
  chapterId: string;
  onRestore: () => void;
}

export function VersionHistoryPanel({ chapterId, onRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [label, setLabel] = useState("");

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/versions`);
      if (res.ok) setVersions(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [chapterId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSnapshot = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label || null }),
      });
      if (res.ok) {
        setLabel("");
        await fetchVersions();
      }
    } finally {
      setSaving(false);
    }
  };

  const restoreVersion = async (versionId: string) => {
    if (!confirm("Restore this version? Your current content will be auto-saved as a version first.")) return;
    setRestoringId(versionId);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: true, versionId }),
      });
      if (res.ok) {
        onRestore();
        await fetchVersions();
      }
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-[var(--muted-foreground)]" />
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Version History</h3>
      </div>

      {/* Save snapshot */}
      <div className="space-y-2 mb-4 pb-4 border-b border-[var(--border)]">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Snapshot label (optional)"
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
        <button
          onClick={saveSnapshot}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--secondary)] transition disabled:opacity-50"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save Snapshot"}
        </button>
      </div>

      {/* Version list */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : versions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <div>
            <Clock className="h-8 w-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-40" />
            <p className="text-xs text-[var(--muted-foreground)]">
              No versions yet. Versions are saved automatically as you write, or save a snapshot manually.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {versions.map((v) => (
            <div key={v.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {v.label && (
                    <p className="text-xs font-medium text-[var(--foreground)] truncate mb-0.5">{v.label}</p>
                  )}
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">{v.wordCount} words</p>
                </div>
                <button
                  onClick={() => restoreVersion(v.id)}
                  disabled={restoringId === v.id}
                  title="Restore this version"
                  className="flex-shrink-0 p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
                >
                  {restoringId === v.id
                    ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    : <RotateCcw className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

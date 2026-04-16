"use client";
import { useState } from "react";
import { Plus, Sparkles, Globe, Trash2, Edit2, Save, X, MapPin, BookOpen, Clock, Zap } from "lucide-react";
import Link from "next/link";
import type { WorldBuilding, WorldBuildingType } from "@/types";

const TYPES: { value: WorldBuildingType; label: string; icon: React.ElementType }[] = [
  { value: "LOCATION", label: "Locations", icon: MapPin },
  { value: "LORE", label: "Lore", icon: BookOpen },
  { value: "TIMELINE", label: "Timeline", icon: Clock },
  { value: "RULE", label: "World Rules", icon: Zap },
  { value: "OTHER", label: "Other", icon: Globe },
];

interface Book {
  id: string;
  title: string;
  worldbuilding: WorldBuilding[];
}

export function WorldbuildingClient({ book: initialBook }: { book: Book }) {
  const [entries, setEntries] = useState(initialBook.worldbuilding);
  const [activeType, setActiveType] = useState<WorldBuildingType>("LOCATION");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [extracting, setExtracting] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "LOCATION" as WorldBuildingType });

  const filteredEntries = entries.filter((e) => e.type === activeType);

  const saveEntry = async () => {
    const res = await fetch(`/api/books/${initialBook.id}/worldbuilding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const entry = await res.json();
      setEntries((prev) => [...prev, entry]);
      setCreating(false);
      setForm({ title: "", content: "", type: activeType });
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/books/${initialBook.id}/worldbuilding/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const startEdit = (entry: WorldBuilding) => {
    setEditing(entry.id);
    setEditForm({ title: entry.title, content: entry.content ?? "" });
  };

  const updateEntry = async (id: string) => {
    const res = await fetch(`/api/books/${initialBook.id}/worldbuilding/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setEntries((prev) => prev.map((e) => e.id === id ? updated : e));
      setEditing(null);
    }
  };

  const extractWorldbuilding = async () => {
    setExtracting(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capability: "extract_worldbuilding",
          content: `Book: ${initialBook.title}. Extract worldbuilding elements.`,
        }),
      });
      const data = await res.json();
      if (data.result) {
        const extracted: Array<{ type: WorldBuildingType; title: string; content?: string }> = JSON.parse(data.result);
        for (const item of extracted) {
          const r = await fetch(`/api/books/${initialBook.id}/worldbuilding`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...item, aiExtracted: true }),
          });
          if (r.ok) {
            const entry = await r.json();
            setEntries((prev) => [...prev, entry]);
          }
        }
      }
    } finally {
      setExtracting(false);
    }
  };

  const currentType = TYPES.find((t) => t.value === activeType);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/books/${initialBook.id}/write`} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-1 block">
            ← {initialBook.title}
          </Link>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Worldbuilding</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={extractWorldbuilding}
            disabled={extracting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)] hover:bg-[var(--secondary)] transition disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
            {extracting ? "Extracting…" : "AI Extract"}
          </button>
          <button
            onClick={() => { setCreating(true); setForm({ title: "", content: "", type: activeType }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            New Entry
          </button>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
        {TYPES.map(({ value, label, icon: Icon }) => {
          const count = entries.filter((e) => e.type === value).length;
          return (
            <button
              key={value}
              onClick={() => setActiveType(value)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeType === value
                  ? "border-[var(--ring)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--secondary)]">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Create form */}
      {creating && (
        <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--card)] mb-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">New {currentType?.label.slice(0, -1)}</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
            <textarea
              placeholder="Content / Notes"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
            <div className="flex gap-2">
              <button onClick={saveEntry} disabled={!form.title} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
                <Save className="h-3.5 w-3.5" /> Save
              </button>
              <button onClick={() => setCreating(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] text-sm hover:bg-[var(--secondary)] transition">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries */}
      {filteredEntries.length === 0 && !creating ? (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-xl">
          {currentType && <currentType.icon className="h-10 w-10 text-[var(--muted-foreground)] mx-auto mb-3" />}
          <p className="text-[var(--muted-foreground)]">No {currentType?.label.toLowerCase()} yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="border border-[var(--border)] rounded-xl p-4 bg-[var(--card)]">
              {editing === entry.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                  />
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => updateEntry(entry.id)} disabled={!editForm.title} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
                      <Save className="h-3.5 w-3.5" /> Save
                    </button>
                    <button onClick={() => setEditing(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] text-sm hover:bg-[var(--secondary)] transition">
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-[var(--foreground)]">{entry.title}</h3>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(entry)} className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--secondary)] transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteEntry(entry.id)} className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {entry.content && <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{entry.content}</p>}
                  {entry.aiExtracted && (
                    <p className="text-xs text-purple-500 mt-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI-extracted
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

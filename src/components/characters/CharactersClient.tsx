"use client";
import { useState } from "react";
import { Plus, Sparkles, User, Trash2, Edit2, Save, X } from "lucide-react";
import Link from "next/link";
import type { Character } from "@/types";

interface Book {
  id: string;
  title: string;
  chapters?: Array<{ content: string | null }>;
  characters: Character[];
}

export function CharactersClient({ book: initialBook }: { book: Book }) {
  const [characters, setCharacters] = useState(initialBook.characters);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", description: "", traits: "", notes: "" });

  const resetForm = () => setForm({ name: "", role: "", description: "", traits: "", notes: "" });

  const saveCharacter = async () => {
    const res = await fetch(`/api/books/${initialBook.id}/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        traits: form.traits ? form.traits.split(",").map((t) => t.trim()) : [],
      }),
    });
    if (res.ok) {
      const ch = await res.json();
      setCharacters((prev) => [...prev, ch]);
      setCreating(false);
      resetForm();
    }
  };

  const updateCharacter = async (id: string) => {
    const res = await fetch(`/api/books/${initialBook.id}/characters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        traits: form.traits ? form.traits.split(",").map((t) => t.trim()) : [],
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCharacters((prev) => prev.map((c) => c.id === id ? updated : c));
      setEditing(null);
      resetForm();
    }
  };

  const deleteCharacter = async (id: string) => {
    if (!confirm("Delete this character?")) return;
    await fetch(`/api/books/${initialBook.id}/characters/${id}`, { method: "DELETE" });
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const extractCharacters = async () => {
    setExtracting(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capability: "extract_characters",
          content: `Book: ${initialBook.title}. Extract all named characters from this book.`,
        }),
      });
      const data = await res.json();
      if (data.result) {
        try {
          const extracted: Array<{ name: string; description?: string; traits?: string[]; role?: string }> = JSON.parse(data.result);
          for (const ch of extracted) {
            const r = await fetch(`/api/books/${initialBook.id}/characters`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...ch, aiExtracted: true }),
            });
            if (r.ok) {
              const newCh = await r.json();
              setCharacters((prev) => [...prev, newCh]);
            }
          }
        } catch {
          alert("AI returned unexpected format. Try again.");
        }
      }
    } finally {
      setExtracting(false);
    }
  };

  const startEdit = (ch: Character) => {
    setEditing(ch.id);
    setForm({
      name: ch.name,
      role: ch.role ?? "",
      description: ch.description ?? "",
      traits: ch.traits ? (JSON.parse(ch.traits) as string[]).join(", ") : "",
      notes: ch.notes ?? "",
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/books/${initialBook.id}/write`} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-1 block">
            ← {initialBook.title}
          </Link>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Characters</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={extractCharacters}
            disabled={extracting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)] hover:bg-[var(--secondary)] transition disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
            {extracting ? "Extracting…" : "AI Extract"}
          </button>
          <button
            onClick={() => { setCreating(true); resetForm(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            New Character
          </button>
        </div>
      </div>

      {/* Create form */}
      {creating && (
        <CharacterForm
          form={form}
          setForm={setForm}
          onSave={saveCharacter}
          onCancel={() => { setCreating(false); resetForm(); }}
          title="New Character"
        />
      )}

      {/* Character list */}
      {characters.length === 0 && !creating ? (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-xl">
          <User className="h-10 w-10 text-[var(--muted-foreground)] mx-auto mb-3" />
          <p className="text-[var(--muted-foreground)]">No characters yet. Add one manually or use AI to extract from your text.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((ch) => (
            <div key={ch.id} className="border border-[var(--border)] rounded-xl p-4 bg-[var(--card)]">
              {editing === ch.id ? (
                <CharacterForm
                  form={form}
                  setForm={setForm}
                  onSave={() => updateCharacter(ch.id)}
                  onCancel={() => { setEditing(null); resetForm(); }}
                  title="Edit Character"
                />
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                        <User className="h-4 w-4 text-[var(--muted-foreground)]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--foreground)]">{ch.name}</h3>
                        {ch.role && <p className="text-xs text-[var(--muted-foreground)]">{ch.role}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(ch)} className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--secondary)] transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteCharacter(ch.id)} className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {ch.description && <p className="text-sm text-[var(--foreground)] mb-2">{ch.description}</p>}
                  {ch.traits && (
                    <div className="flex flex-wrap gap-1">
                      {(JSON.parse(ch.traits) as string[]).map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)]">{t}</span>
                      ))}
                    </div>
                  )}
                  {ch.aiExtracted && (
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

function CharacterForm({
  form,
  setForm,
  onSave,
  onCancel,
  title,
}: {
  form: { name: string; role: string; description: string; traits: string; notes: string };
  setForm: (f: { name: string; role: string; description: string; traits: string; notes: string }) => void;
  onSave: () => void;
  onCancel: () => void;
  title: string;
}) {
  return (
    <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--card)] mb-4">
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">{title}</h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
        <input
          type="text"
          placeholder="Role (e.g. Protagonist, Antagonist)"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
        <input
          type="text"
          placeholder="Traits (comma separated)"
          value={form.traits}
          onChange={(e) => setForm({ ...form, traits: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
        <textarea
          placeholder="Notes (private, not exported)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
        <div className="flex gap-2">
          <button onClick={onSave} disabled={!form.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
            <Save className="h-3.5 w-3.5" /> Save
          </button>
          <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] text-sm hover:bg-[var(--secondary)] transition">
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

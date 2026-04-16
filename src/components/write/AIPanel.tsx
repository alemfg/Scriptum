"use client";
import { useState } from "react";
import { Sparkles, Send, Copy, RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const CAPABILITIES = [
  { value: "suggest", label: "Continue writing" },
  { value: "rewrite", label: "Rewrite" },
  { value: "expand", label: "Expand" },
  { value: "grammar", label: "Grammar & style" },
  { value: "tone", label: "Adjust tone" },
  { value: "translate", label: "Translate" },
  { value: "extract_characters", label: "Extract characters" },
  { value: "extract_worldbuilding", label: "Extract worldbuilding" },
];

interface AIPanelProps {
  bookId: string;
  chapterId: string;
  content: string;
}

export function AIPanel({ bookId, chapterId, content }: AIPanelProps) {
  const [capability, setCapability] = useState("suggest");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capability,
          content,
          prompt: prompt || undefined,
          bookId,
          chapterId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI request failed");
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const copyResult = () => {
    navigator.clipboard.writeText(result);
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <h3 className="text-sm font-semibold text-[var(--foreground)]">AI Assistant</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Action</label>
          <div className="relative">
            <select
              value={capability}
              onChange={(e) => setCapability(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {CAPABILITIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Instructions (optional)</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Additional instructions…"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <button
          onClick={run}
          disabled={loading || !content}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {loading ? "Running…" : "Run"}
        </button>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Result</span>
            <button
              onClick={copyResult}
              className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <Copy className="h-3 w-3" />
              Copy
            </button>
          </div>
          <div className="flex-1 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] overflow-y-auto whitespace-pre-wrap">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}

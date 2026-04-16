"use client";
import { useState } from "react";
import { Save, Eye, EyeOff, Server } from "lucide-react";
import type { AISettings } from "@/types";

const AI_PROVIDERS = [
  { value: "OPENAI", label: "OpenAI", placeholder: "sk-..." },
  { value: "CLAUDE", label: "Claude (Anthropic)", placeholder: "sk-ant-..." },
  { value: "OLLAMA", label: "Ollama (Local)", placeholder: "ollama (no key needed)" },
  { value: "CUSTOM", label: "Custom API", placeholder: "API key" },
];

const OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];
const CLAUDE_MODELS = ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"];
const OLLAMA_MODELS = ["llama3.2", "mistral", "codellama", "phi3"];

interface User { id: string; name?: string | null; email?: string | null; }

export function SettingsClient({
  user,
  aiSettings,
}: {
  user: User;
  aiSettings: AISettings | null;
}) {
  const [provider, setProvider] = useState(aiSettings?.provider ?? "OPENAI");
  const [apiKey, setApiKey] = useState(aiSettings?.apiKey ?? "");
  const [model, setModel] = useState(aiSettings?.model ?? "");
  const [baseUrl, setBaseUrl] = useState(aiSettings?.baseUrl ?? "http://localhost:11434/v1");
  const [mcpEnabled, setMcpEnabled] = useState(aiSettings?.mcpEnabled ?? false);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const models = provider === "OPENAI" ? OPENAI_MODELS
    : provider === "CLAUDE" ? CLAUDE_MODELS
    : provider === "OLLAMA" ? OLLAMA_MODELS
    : [];

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey, model, baseUrl, mcpEnabled }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const currentProvider = AI_PROVIDERS.find((p) => p.value === provider);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-8">Settings</h1>

      {/* Profile section */}
      <section className="mb-8 p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Account</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Name</span>
            <span className="text-[var(--foreground)]">{user.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Email</span>
            <span className="text-[var(--foreground)]">{user.email}</span>
          </div>
        </div>
      </section>

      {/* AI Settings */}
      <section className="mb-8 p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-1">AI Configuration</h2>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Scriptum uses your own AI subscription. Your API key is stored securely and only used for your requests.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {AI_PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => { setProvider(p.value as typeof provider); setModel(""); }}
                  className={`px-3 py-2 rounded-lg text-sm text-left transition-colors border ${
                    provider === p.value
                      ? "border-[var(--ring)] bg-blue-50 text-[var(--ring)] font-medium"
                      : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {provider !== "OLLAMA" && (
            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={currentProvider?.placeholder}
                  className="w-full pr-9 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {provider === "OLLAMA" || provider === "CUSTOM" ? (
            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434/v1"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">Model</label>
            {models.length > 0 ? (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                <option value="">Default</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. llama3.2"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            )}
          </div>
        </div>
      </section>

      {/* MCP Server */}
      <section className="mb-8 p-5 rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-[var(--muted-foreground)]" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">MCP Server</h2>
          </div>
          <button
            onClick={() => setMcpEnabled(!mcpEnabled)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${mcpEnabled ? "bg-[var(--ring)]" : "bg-[var(--border)]"}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${mcpEnabled ? "translate-x-4" : "translate-x-1"}`} />
          </button>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          Enable the MCP server to allow external AI tools (like Claude Desktop) to control Scriptum. The server runs on stdio and exposes book management, chapter writing, formatting, and export tools.
        </p>
        {mcpEnabled && (
          <div className="mt-3 p-3 rounded-lg bg-[var(--secondary)] text-xs font-mono text-[var(--foreground)]">
            npx scriptum-mcp
          </div>
        )}
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving…" : saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

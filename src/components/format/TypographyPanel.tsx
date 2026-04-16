"use client";
import { useRef, useState } from "react";
import { Upload, X, RefreshCw } from "lucide-react";
import type { FormatSettings } from "@/types";

const PRESETS = [
  { value: "classic", label: "Classic Novel" },
  { value: "modern", label: "Modern Minimal" },
  { value: "fantasy", label: "Fantasy / Epic" },
  { value: "scifi", label: "Sci-Fi" },
  { value: "nonfiction", label: "Non-Fiction" },
];

const PRESET_CONFIGS: Record<string, Partial<FormatSettings>> = {
  classic: { fontFamily: "Garamond", fontSize: 11, lineSpacing: 1.4, indentation: 0.3, dropCaps: true, justification: "justify" },
  modern: { fontFamily: "Georgia", fontSize: 11, lineSpacing: 1.6, indentation: 0, dropCaps: false, justification: "left" },
  fantasy: { fontFamily: "Palatino", fontSize: 11.5, lineSpacing: 1.5, indentation: 0.4, dropCaps: true, justification: "justify" },
  scifi: { fontFamily: "Arial", fontSize: 10.5, lineSpacing: 1.5, indentation: 0, dropCaps: false, justification: "left" },
  nonfiction: { fontFamily: "Times New Roman", fontSize: 11, lineSpacing: 1.4, indentation: 0, dropCaps: false, justification: "justify" },
};

const FONTS = [
  "Garamond", "Georgia", "Palatino", "Times New Roman", "Baskerville",
  "Caslon", "Didot", "Minion Pro", "Arial", "Helvetica",
];

const SEPARATOR_PRESETS = ["* * *", "—", "◆", "⁂", "∞"];

interface Props {
  bookId: string;
  settings: Partial<FormatSettings>;
  onUpdate: (updates: Partial<FormatSettings>) => void;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-[var(--foreground)] mb-1">{children}</label>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

function SliderRow({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  unit?: string; onChange: (v: number) => void;
}) {
  return (
    <Row>
      <div className="flex justify-between mb-1">
        <Label>{label}</Label>
        <span className="text-xs text-[var(--muted-foreground)]">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--ring)]"
      />
    </Row>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-[var(--foreground)]">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? "bg-[var(--ring)]" : "bg-[var(--border)]"}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value ? "translate-x-4" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

export function TypographyPanel({ bookId, settings, onUpdate }: Props) {
  const svgInputRef = useRef<HTMLInputElement>(null);
  const [svgUploading, setSvgUploading] = useState(false);
  const [svgUrl, setSvgUrl] = useState<string | null>(settings.sceneSeparatorSvg ?? null);

  const fontInputRef = useRef<HTMLInputElement>(null);
  const [fontUploading, setFontUploading] = useState(false);
  const [customFonts, setCustomFonts] = useState<Array<{ fontFamily: string; url: string; ext: string }>>([]);

  const uploadFont = async (file: File) => {
    setFontUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/fonts", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setCustomFonts((prev) => [...prev, data]);
        onUpdate({ fontFamily: data.fontFamily });
      }
    } finally {
      setFontUploading(false);
    }
  };

  const uploadSvg = async (file: File) => {
    setSvgUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/books/${bookId}/format/svg-separator`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setSvgUrl(data.url);
        onUpdate({ sceneSeparatorSvg: data.url, sceneSeparator: "" });
      }
    } finally {
      setSvgUploading(false);
    }
  };

  const removeSvg = async () => {
    await fetch(`/api/books/${bookId}/format/svg-separator`, { method: "DELETE" });
    setSvgUrl(null);
    onUpdate({ sceneSeparatorSvg: null, sceneSeparator: "* * *" });
  };

  return (
    <div className="space-y-1">
      {/* Presets */}
      <Row>
        <Label>Preset</Label>
        <div className="grid grid-cols-1 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => onUpdate({ preset: p.value, ...PRESET_CONFIGS[p.value] })}
              className={`px-3 py-1.5 rounded-lg text-xs text-left transition-colors border ${
                settings.preset === p.value
                  ? "border-[var(--ring)] bg-blue-50 text-[var(--ring)] font-medium"
                  : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Row>

      <div className="border-t border-[var(--border)] pt-4">
        {/* Inject @font-face for custom fonts */}
        {customFonts.length > 0 && (
          <style>{customFonts.map((f) => `@font-face { font-family: '${f.fontFamily}'; src: url('${f.url}'); }`).join("\n")}</style>
        )}

        {/* Font Family */}
        <Row>
          <Label>Font Family</Label>
          <select
            value={settings.fontFamily ?? "Garamond"}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)] mb-1.5"
          >
            {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            {customFonts.map((f) => <option key={f.url} value={f.fontFamily}>{f.fontFamily} (custom)</option>)}
          </select>
          <input
            ref={fontInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFont(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fontInputRef.current?.click()}
            disabled={fontUploading}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:border-[var(--ring)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
          >
            {fontUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {fontUploading ? "Uploading…" : "Upload custom font"}
          </button>
        </Row>

        <SliderRow label="Font Size" value={settings.fontSize ?? 11} min={8} max={14} step={0.5} unit="pt" onChange={(v) => onUpdate({ fontSize: v })} />
        <SliderRow label="Line Spacing" value={settings.lineSpacing ?? 1.4} min={1} max={2.5} step={0.1} onChange={(v) => onUpdate({ lineSpacing: v })} />
        <SliderRow label="Paragraph Spacing" value={settings.paragraphSpacing ?? 0} min={0} max={1} step={0.1} unit="em" onChange={(v) => onUpdate({ paragraphSpacing: v })} />
        <SliderRow label="Indentation" value={settings.indentation ?? 0.3} min={0} max={1} step={0.05} unit="in" onChange={(v) => onUpdate({ indentation: v })} />

        {/* Justification */}
        <Row>
          <Label>Text Alignment</Label>
          <div className="flex gap-1.5">
            {["left", "center", "right", "justify"].map((j) => (
              <button
                key={j}
                onClick={() => onUpdate({ justification: j })}
                className={`flex-1 py-1 rounded text-xs capitalize transition-colors border ${
                  settings.justification === j
                    ? "border-[var(--ring)] bg-blue-50 text-[var(--ring)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
                }`}
              >
                {j}
              </button>
            ))}
          </div>
        </Row>

        <Toggle label="Drop Caps" value={settings.dropCaps ?? true} onChange={(v) => onUpdate({ dropCaps: v })} />
        <Toggle label="Widow/Orphan Control" value={settings.widowControl ?? true} onChange={(v) => onUpdate({ widowControl: v })} />
        <Toggle label="Header" value={settings.headerEnabled ?? true} onChange={(v) => onUpdate({ headerEnabled: v })} />
        <Toggle label="Footer / Page Numbers" value={settings.footerEnabled ?? true} onChange={(v) => onUpdate({ footerEnabled: v })} />
      </div>

      {/* Scene Separator */}
      <div className="border-t border-[var(--border)] pt-4">
        <Label>Scene Separator</Label>

        {svgUrl ? (
          <div className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] bg-[var(--background)] mb-2">
            <img src={svgUrl} alt="SVG separator" className="h-6 max-w-[120px] object-contain" />
            <span className="text-xs text-[var(--muted-foreground)] flex-1">Custom SVG</span>
            <button onClick={removeSvg} className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 transition-colors" title="Remove SVG">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-2">
              {SEPARATOR_PRESETS.map((sep) => (
                <button
                  key={sep}
                  onClick={() => onUpdate({ sceneSeparator: sep })}
                  className={`flex-1 py-1 rounded text-sm transition-colors border ${
                    settings.sceneSeparator === sep
                      ? "border-[var(--ring)] bg-blue-50"
                      : "border-[var(--border)] hover:bg-[var(--secondary)]"
                  }`}
                >
                  {sep}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={settings.sceneSeparator ?? "* * *"}
              onChange={(e) => onUpdate({ sceneSeparator: e.target.value })}
              className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)] mb-2"
              placeholder="Custom separator"
            />
          </>
        )}

        <input
          ref={svgInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadSvg(file);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => svgInputRef.current?.click()}
          disabled={svgUploading}
          className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:border-[var(--ring)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
        >
          {svgUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {svgUploading ? "Uploading…" : "Upload SVG separator"}
        </button>
      </div>
    </div>
  );
}

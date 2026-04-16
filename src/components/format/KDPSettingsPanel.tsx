"use client";
import type { FormatSettings } from "@/types";

const TRIM_SIZES = [
  { value: "5x8", label: '5" × 8"' },
  { value: "5.25x8", label: '5.25" × 8"' },
  { value: "5.5x8.5", label: '5.5" × 8.5"' },
  { value: "6x9", label: '6" × 9" (most popular)' },
  { value: "6.14x9.21", label: '6.14" × 9.21"' },
  { value: "7x10", label: '7" × 10"' },
  { value: "8.5x11", label: '8.5" × 11"' },
];

interface Props {
  settings: Partial<FormatSettings>;
  onUpdate: (updates: Partial<FormatSettings>) => void;
  estimatedPages: number;
  spineWidth: number;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-[var(--foreground)] mb-1">{children}</label>;
}

function NumberInput({ label, value, step, unit, onChange }: {
  label: string; value: number; step?: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          step={step ?? 0.01}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
        {unit && <span className="text-xs text-[var(--muted-foreground)]">{unit}</span>}
      </div>
    </div>
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

export function KDPSettingsPanel({ settings, onUpdate, estimatedPages, spineWidth }: Props) {
  return (
    <div className="space-y-4">
      {/* Page Stats */}
      <div className="p-3 rounded-lg bg-[var(--secondary)] text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-[var(--muted-foreground)]">Estimated pages</span>
          <span className="font-medium text-[var(--foreground)]">{estimatedPages}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--muted-foreground)]">Spine width</span>
          <span className="font-medium text-[var(--foreground)]">{spineWidth.toFixed(3)}&quot;</span>
        </div>
      </div>

      {/* Trim Size */}
      <div>
        <Label>Trim Size</Label>
        <div className="space-y-1.5">
          {TRIM_SIZES.map((t) => (
            <button
              key={t.value}
              onClick={() => onUpdate({ trimSize: t.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs text-left transition-colors border ${
                settings.trimSize === t.value
                  ? "border-[var(--ring)] bg-blue-50 text-[var(--ring)] font-medium"
                  : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Margins */}
      <div className="border-t border-[var(--border)] pt-4">
        <Label>Margins (inches)</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <NumberInput label="Top" value={settings.marginTop ?? 0.75} unit="in" onChange={(v) => onUpdate({ marginTop: v })} />
          <NumberInput label="Bottom" value={settings.marginBottom ?? 0.75} unit="in" onChange={(v) => onUpdate({ marginBottom: v })} />
          <NumberInput label="Inner (gutter)" value={settings.marginInner ?? 0.875} unit="in" onChange={(v) => onUpdate({ marginInner: v })} />
          <NumberInput label="Outer" value={settings.marginOuter ?? 0.5} unit="in" onChange={(v) => onUpdate({ marginOuter: v })} />
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-2">
          KDP requires a minimum gutter of 0.375&quot; for books under 150 pages, 0.75&quot; for 300+
        </p>
      </div>

      <Toggle label="Bleed (0.125&quot;)" value={settings.bleed ?? false} onChange={(v) => onUpdate({ bleed: v })} />
      <Toggle label="Chapters start on right page" value={settings.chapterStartRight ?? true} onChange={(v) => onUpdate({ chapterStartRight: v })} />

      {/* KDP compliance note */}
      <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
        <p className="font-medium mb-1">KDP Guidelines</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>Minimum 24 pages</li>
          <li>PDF must be print-ready with embedded fonts</li>
          <li>Cover resolution: 300 DPI minimum</li>
        </ul>
      </div>
    </div>
  );
}

import React from "react";

export type TauPresetKey = "classic" | "br" | "smooth";

export function brazilishTenors() {
  return [0.25, 0.5, 1, 2, 3, 4, 5, 10];
}

export function classicTenors() {
  // A compact set spanning short to long (tweak as you like)
  return [0.08, 0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30];
}

export function smoothTenors(maxYears = 10, pointsPerYear = 52) {
  const step = 1 / pointsPerYear;
  const t: number[] = [];
  // start near 0 but not 0 to avoid visual kinks; compute handles 0 safely anyway
  for (let x = step; x <= maxYears + 1e-12; x += step) t.push(+x.toFixed(6));
  return t;
}

export function getPreset(key: TauPresetKey): number[] {
  if (key === "classic") return classicTenors();
  if (key === "br") return brazilishTenors();
  return smoothTenors(10, 50);
}

export default function TauPresets({
  preset,
  setPreset,
  input,
  setInput,
  onApplyPreset
}: {
  preset: TauPresetKey;
  setPreset: (k: TauPresetKey) => void;
  input: string;
  setInput: (s: string) => void;
  onApplyPreset: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-slate-300">τ Preset:</label>
        <select
          className="rounded bg-slate-900 px-3 py-2 ring-1 ring-slate-700 focus:ring-indigo-500 outline-none"
          value={preset}
          onChange={(e) => setPreset(e.target.value as TauPresetKey)}
        >
          <option value="smooth">Smooth (52 pts/year, 10y)</option>
          <option value="classic">Classic (0.25…30y)</option>
          <option value="br">Brazil-ish (0.08…10y)</option>
        </select>
        <button
          className="rounded bg-indigo-600 px-3 py-2 text-sm hover:bg-indigo-500"
          onClick={onApplyPreset}
          title="Replace the custom list with the preset values"
        >
          Apply preset
        </button>
      </div>

      <div className="text-sm text-slate-300">Custom τ (years, comma-separated)</div>
      <textarea
        className="w-full h-24 rounded bg-slate-900 px-3 py-2 outline-none ring-1 ring-slate-700 focus:ring-indigo-500 font-mono text-xs"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
    </div>
  );
}

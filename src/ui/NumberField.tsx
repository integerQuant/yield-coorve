import React from "react";

type Props = {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
};

export default function NumberField({ label, value, step = 0.001, min = -1, max = 1, onChange }: Props) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-slate-300">{label}</div>
      <div className="flex items-center gap-3">
        <input
          className="w-32 rounded bg-slate-900 px-2 py-1 outline-none ring-1 ring-slate-700 focus:ring-indigo-500"
          type="number"
          step={step}
          min={min}
          max={max}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <input
          className="flex-1"
          type="range"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </div>
    </label>
  );
}

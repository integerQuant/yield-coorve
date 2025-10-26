import React from "react";
import UiDropdown, { UiDropdownOption } from "./UiDropdown";

export type TauPresetKey =
  | "classic"
  | "br"
  | "smoothFixed"
  | "smoothCustom";

// Brazil style discrete tenor set
export function brazilishTenors() {
  return [0.25, 0.5, 1, 2, 3, 4, 5, 10];
}

// Classic US style tenors
export function classicTenors() {
  return [0.08, 0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30];
}

// Dense smooth grid from near-0 to maxYears
export function smoothTenors(maxYears = 10, pointsPerYear = 252) {
  const step = 1 / pointsPerYear;
  const t: number[] = [];
  for (let x = step; x <= maxYears + 1e-12; x += step) {
    t.push(+x.toFixed(6));
  }
  return t;
}

// Helper to get tenors for each preset
export function getPresetTenors(
  key: TauPresetKey,
  customYears: number,
  customPointsPerYear: number
): number[] {
  if (key === "classic") return classicTenors();
  if (key === "br") return brazilishTenors();
  if (key === "smoothFixed") return smoothTenors(10, 252);
  // smoothCustom
  return smoothTenors(customYears, customPointsPerYear);
}

const PRESET_OPTIONS: UiDropdownOption<TauPresetKey>[] = [
  {
    value: "smoothFixed",
    label: "Smooth fixed",
    hint: "252 pts/yr, 10y"
  },
  {
    value: "classic",
    label: "Classic",
    hint: "1m…30y"
  },
  {
    value: "br",
    label: "Brazil-ish",
    hint: "3m…10y"
  },
  {
    value: "smoothCustom",
    label: "Custom",
    hint: "Custom density"
  }
];

// clamp helpers
function clampInt(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  if (n < min) return min;
  if (n > max) return max;
  return Math.round(n);
}

function clampFloat(n: number, min: number, max: number, step = 0.25) {
  if (Number.isNaN(n)) return min;
  if (n < min) n = min;
  if (n > max) n = max;
  const snapped = Math.round(n / step) * step;
  return +snapped.toFixed(6);
}

export default function TauPresets({
  preset,
  setPreset,
  customYears,
  setCustomYears,
  customPointsPerYear,
  setCustomPointsPerYear
}: {
  preset: TauPresetKey;
  setPreset: (k: TauPresetKey) => void;
  customYears: number;
  setCustomYears: (n: number) => void;
  customPointsPerYear: number;
  setCustomPointsPerYear: (n: number) => void;
}) {
  function handlePointsPerYearChange(raw: string) {
    const n = clampInt(+raw, 1, 500); // min 1, max 500
    setCustomPointsPerYear(n);
  }

  function handleYearsChange(raw: string) {
    const n = clampFloat(+raw, 0.25, 99, 0.25); // min 0.25, max 99
    setCustomYears(n);
  }

  const showCustomControls = preset === "smoothCustom";

  return (
    <div className="tau-presets">
      {/* Row 1: preset dropdown */}
      <UiDropdown<TauPresetKey>
        labelId="tauPresetLabel"
        labelText="τ Preset:"
        activeValue={preset}
        options={PRESET_OPTIONS}
        onSelect={(val) => {
          setPreset(val);
        }}
      />

      {/* Row 2: smoothCustom settings */}
      <div
        className="tau-custom-wrapper"
        data-open={showCustomControls ? "true" : "false"}
        aria-hidden={showCustomControls ? "false" : "true"}
      >
        <div className="tau-card">
          <div className="tau-row">
            <div className="tau-field">
              <label className="tau-field-label" htmlFor="pointsPerYearInput">
                pts/yr
              </label>
              <input
                id="pointsPerYearInput"
                type="number"
                min={1}
                max={500}
                step={1}
                className="tau-input"
                value={customPointsPerYear}
                onChange={(e) => handlePointsPerYearChange(e.target.value)}
              />
            </div>

            <div className="tau-field">
              <label className="tau-field-label" htmlFor="yearsInput">
                years
              </label>
              <input
                id="yearsInput"
                type="number"
                min={0.25}
                max={99}
                step={0.25}
                className="tau-input"
                value={customYears}
                onChange={(e) => handleYearsChange(e.target.value)}
              />
            </div>
          </div>

          <div className="tau-hint">
            Max 500 pts/yr and 99y.
          </div>
        </div>
      </div>
    </div>
  );
}

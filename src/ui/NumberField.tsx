import React, { useRef, useEffect } from "react";

type Props = {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
};

export default function NumberField({
  label,
  value,
  step = 0.001,
  min = -1,
  max = 1,
  onChange
}: Props) {
  const rangeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (rangeRef.current) {
      // Required for Firefox to honor vertical orientation
      rangeRef.current.setAttribute("orient", "vertical");
      // Improve a11y for assistive tech
      rangeRef.current.setAttribute("aria-orientation", "vertical");
    }
  }, []);

  const safe = Number.isFinite(value) ? value : 0;

  return (
    <label className="numberField">
      <span className="numberField__label">{label}</span>

      <input
        className="number-field__number"
        type="number"
        step={step}
        min={min}
        max={max}
        value={safe}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        inputMode="decimal"
      />

      <input
        ref={rangeRef}
        className="number-field__range-vertical"
        type="range"
        min={min}
        max={max}
        step={step}
        value={safe}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

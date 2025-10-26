import React from "react";

export type UiDropdownOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
};

export type UiDropdownProps<T extends string> = {
  labelId: string;
  labelText: string;
  activeValue: T;
  options: UiDropdownOption<T>[];
  onSelect: (value: T) => void;
};

export default function UiDropdown<T extends string>({
  labelId,
  labelText,
  activeValue,
  options,
  onSelect
}: UiDropdownProps<T>) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const active = options.find((o) => o.value === activeValue);

  function handleSelect(v: T) {
    onSelect(v);
    setOpen(false);
  }

  return (
    <div className="ui-selector">
      <label className="ui-label" id={labelId}>
        {labelText}
      </label>

      <div className="ui-select-shell" ref={dropdownRef}>
        <button
          type="button"
          className={`ui-select-button ${
            open ? "ui-select-button--open" : ""
          }`}
          aria-haspopup="listbox"
          aria-labelledby={labelId}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="ui-select-button-text">
            <span className="ui-select-main">
              {active ? active.label : "Select"}
            </span>
            {active?.hint && (
              <span className="ui-select-hint">{active.hint}</span>
            )}
          </span>

          <span
            className={`ui-caret ${open ? "ui-caret--rot" : ""}`}
            aria-hidden="true"
          >
            ▾
          </span>

          <span className="glow-ring" aria-hidden="true" />
        </button>

        <ul
          className={`ui-select-menu ${open ? "ui-select-menu--open" : ""}`}
          role="listbox"
          aria-activedescendant={activeValue}
          tabIndex={-1}
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              id={opt.value}
              role="option"
              aria-selected={activeValue === opt.value}
              className={`ui-select-option ${
                activeValue === opt.value ? "is-active" : ""
              }`}
              onClick={() => handleSelect(opt.value)}
            >
              <div className="ui-option-line">
                <span className="ui-option-label">{opt.label}</span>
                {opt.hint && (
                  <span className="ui-option-hint">{opt.hint}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

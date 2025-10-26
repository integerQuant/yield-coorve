import React from "react";
import UiDropdown, { UiDropdownOption } from "./UiDropdown";

export type CurveType = "pre" | "ipca";

const CURVE_OPTIONS: UiDropdownOption<CurveType>[] = [
  {
    value: "pre",
    label: "Pré",
    hint: "Nominal fixed-rate curve"
  },
  {
    value: "ipca",
    label: "IPCA",
    hint: "Real curve indexed to IPCA"
  }
];

type CurveTypeSelectProps<TParams> = {
  curveType: CurveType;
  setCurveType: (ct: CurveType) => void;
  latestByType: Record<
    CurveType,
    {
      params: TParams;
    }
  >;
  setParams: React.Dispatch<React.SetStateAction<TParams>>;
};

export default function CurveTypeSelect<TParams>({
  curveType,
  setCurveType,
  latestByType,
  setParams
}: CurveTypeSelectProps<TParams>) {
  function handleSelectCurveType(ct: CurveType) {
    setCurveType(ct);
    setParams(latestByType[ct].params);
  }

  return (
    <div className="curve-type-select">
      <UiDropdown<CurveType>
        labelId="curveTypeLabel"
        labelText="Parameter set"
        activeValue={curveType}
        options={CURVE_OPTIONS}
        onSelect={handleSelectCurveType}
      />
    </div>
  );
}

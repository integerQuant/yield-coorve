import React, { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";

type Trace = {
  x: number[];
  y: number[];
  name: string;
};

type Props = {
  title: string;
  traces: Trace[];
  xTitle?: string;
  yTitle?: string;
};

export default function Plot({
  title,
  traces,
  xTitle = "Maturity (years)",
  yTitle = "Rate (%)"
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const data = traces.map((t) => ({
      x: t.x,
      y: t.y, // values are decimals (e.g., 0.085). We'll format as % in the axis/hover.
      name: t.name,
      mode: "lines+markers",
      hovertemplate: "τ=%{x:.2f}<br>%{y:.2%}<extra>%{fullData.name}</extra>"
    }));

    const layout: any = {
      title: { text: title },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: "#e2e8f0" },
      xaxis: { title: xTitle, zeroline: false, gridcolor: "#1f2937" },
      // percent formatting multiplies by 100 automatically
      yaxis: { title: yTitle, zeroline: false, gridcolor: "#1f2937", tickformat: ".1%" },
      legend: { orientation: "h", x: 0, y: 1.15 }
    };

    Plotly.react(ref.current, data as any, layout, { displayModeBar: true, responsive: true });

    const onResize = () => Plotly.Plots.resize(ref.current!);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [title, traces, xTitle, yTitle]);

  return <div className="w-full h-[420px]" ref={ref} />;
}

import React, { useEffect, useMemo, useRef, useState } from "react";
// @ts-ignore – we purposefully skip types for the min build
import Plotly from "plotly.js-dist-min";

type Trace = { x: number[]; y: number[]; name: string };

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

  // Mobile-friendly plot height + UI
  const [width, setWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const height = useMemo(() => {
    if (width < 380) return 260;
    if (width < 640) return 300;
    if (width < 1024) return 360;
    return 420;
  }, [width]);

  const showModeBar = width >= 640; // hide toolbar on tiny screens

  useEffect(() => {
    if (!ref.current) return;

    const data = traces.map((t) => ({
      x: t.x,
      y: t.y,
      name: t.name,
      mode: "lines+markers",
      marker: { size: width < 640 ? 4 : 6 },
      hovertemplate: "τ=%{x:.2f}<br>%{y:.2%}<extra>%{fullData.name}</extra>"
    }));

    const layout: any = {
      title: { text: title },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: "#e2e8f0", size: width < 640 ? 12 : 14 },
      height,
      margin: { l: 50, r: 10, t: 40, b: 40 },
      xaxis: {
        title: { text: xTitle },
        zeroline: false,
        gridcolor: "#1f2937",
        tickfont: { size: width < 640 ? 10 : 12 },
        titlefont: { size: width < 640 ? 11 : 13 }
      },
      yaxis: {
        title: { text: yTitle },
        zeroline: false,
        gridcolor: "#1f2937",
        tickformat: ".2%",
        tickfont: { size: width < 640 ? 10 : 12 },
        titlefont: { size: width < 640 ? 11 : 13 }
      },
      legend: {
        orientation: width < 640 ? "v" : "h",
        x: 0,
        y: 1.1
      }
    };

    Plotly.react(ref.current, data as any, layout, {
      displayModeBar: showModeBar,
      responsive: true
    });

    const onResize = () => Plotly.Plots.resize(ref.current!);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [title, traces, xTitle, yTitle, height, width, showModeBar]);

  return <div className="w-full" ref={ref} />;
}

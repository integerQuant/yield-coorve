import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  CSSProperties,
} from "react";

type Series = {
  name: string;
  x: number[];
  y: number[];
  color?: string;
};

type HeightRule = {
  maxWidth: number; // when container width <= maxWidth, use this height
  height: number;
};

type ResponsiveFastCurveChartProps = {
  series: Series[];

  // visual styling
  bgColor?: string;
  gridColor?: string;
  axisColor?: string;
  fontColor?: string;

  xLabel?: string;
  yLabel?: string;
  yTickFormat?: (v: number) => string;
  xTickFormat?: (v: number) => string;

  padding?: { left: number; right: number; top: number; bottom: number };

  showLegend?: boolean;

  // responsive height policy
  // evaluated from smallest to largest maxWidth, first match wins
  // final fallback is aspectRatio if nothing matches
  heightRules?: HeightRule[];

  // fallback aspect ratio (width / height)
  aspectRatio?: number;
};

export default function ResponsiveFastCurveChart({
  series,

  bgColor = "rgba(0,0,0,0)",
  gridColor = "#494949ff",   // slate-800
  axisColor = "#9ca3af",   // slate-400
  fontColor = "#e2e8f0",   // slate-200

  xLabel = "Maturity τ (years)",
  yLabel = "Yield (%)",
  yTickFormat = (v) => (v * 100).toFixed(1) + "%",
  xTickFormat = (v) => v.toFixed(1),

  padding = { left: 56, right: 16, top: 16, bottom: 40 },

  showLegend = true,

  heightRules = [
    // mobile-ish
    { maxWidth: 800, height: 300 },
    // tablet-ish
    { maxWidth: 1000, height: 500 },
    // big screens will fall through to aspectRatio
  ],

  aspectRatio = 1000 / 500 // ~1.875
}: ResponsiveFastCurveChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<HTMLCanvasElement | null>(null);
  const fgRef = useRef<HTMLCanvasElement | null>(null);

  const heightRulesRef = useRef(heightRules);
  const aspectRatioRef = useRef(aspectRatio);

  useEffect(() => {
    heightRulesRef.current = heightRules;
  }, [heightRules]);

  useEffect(() => {
    aspectRatioRef.current = aspectRatio;
  }, [aspectRatio]);

  // measured size
  const [dims, setDims] = useState<{ w: number; h: number }>({
    w: 600,
    h: 420,
  });

  // Tooltip state
  const [hoverInfo, setHoverInfo] = useState<{
    px: number;
    py: number;
    xv: number;
    yv: number;
    name: string;
    color: string;
    show: boolean;
  }>({
    px: 0,
    py: 0,
    xv: 0,
    yv: 0,
    name: "",
    color: "#fff",
    show: false,
  });

  // observe container width and pick dimensions
useEffect(() => {
  const el = containerRef.current;
  if (!el) return;

  const chooseHeight = (widthPx: number) => {
    for (const rule of heightRulesRef.current) {
      if (widthPx <= rule.maxWidth) {
        return rule.height;
      }
    }
    const ar = aspectRatioRef.current;
    return Math.max(160, Math.round(widthPx / ar));
  };

  // initial measure
  const rect = el.getBoundingClientRect();
  const startW = rect.width;
  const startH = chooseHeight(startW);
  setDims({ w: startW, h: startH });

  // observer
  const obs = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const newW = entry.contentRect.width;
      const newH = chooseHeight(newW);

      // avoid useless setState spam
      setDims((prev) =>
        prev.w === newW && prev.h === newH
          ? prev
          : { w: newW, h: newH }
      );
    }
  });

  obs.observe(el);
  return () => {
    obs.disconnect();
  };
}, []); // run once on mount


  // palette / series prep
  const palette = ["#38bdf8", "#a78bfa", "#f472b6", "#facc15", "#4ade80"];
  const preparedSeries = useMemo(() => {
    return series.map((s, idx) => ({
      ...s,
      color: s.color ?? palette[idx % palette.length],
      len: Math.min(s.x.length, s.y.length),
    }));
  }, [series]);

  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    let xmin = Infinity;
    let xmax = -Infinity;
    let ymin = Infinity;
    let ymax = -Infinity;

    for (const s of preparedSeries) {
      for (let i = 0; i < s.len; i++) {
        const xv = s.x[i];
        const yv = s.y[i];
        if (xv < xmin) xmin = xv;
        if (xv > xmax) xmax = xv;
        if (yv < ymin) ymin = yv;
        if (yv > ymax) ymax = yv;
      }
    }

    if (!isFinite(xmin)) {
      xmin = 0;
      xmax = 1;
      ymin = 0;
      ymax = 1;
    }

    const yPad = (ymax - ymin || 1) * 0.05;
    const xPad = (xmax - xmin || 1) * 0.02;

    return {
      xMin: xmin - xPad,
      xMax: xmax + xPad,
      yMin: ymin - yPad,
      yMax: ymax + yPad,
    };
  }, [preparedSeries]);

  const scale = useMemo(() => {
    const { w: width, h: height } = dims;
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const xScale = (xv: number) => {
      if (xMax === xMin) return padding.left + plotW / 2;
      return padding.left + ((xv - xMin) / (xMax - xMin)) * plotW;
    };

    const yScale = (yv: number) => {
      if (yMax === yMin) return padding.top + plotH / 2;
      return padding.top + (1 - (yv - yMin) / (yMax - yMin)) * plotH;
    };

    return { xScale, yScale, plotW, plotH };
  }, [dims, xMin, xMax, yMin, yMax, padding]);

  function niceTicks(min: number, max: number, count = 5) {
    if (min === max) return [min];
    const span = max - min;
    const step = span / (count - 1);
    const ticks: number[] = [];
    for (let i = 0; i < count; i++) {
      ticks.push(min + step * i);
    }
    return ticks;
  }

  const xTicks = useMemo(
    () => niceTicks(xMin, xMax, 5),
    [xMin, xMax]
  );
  const yTicks = useMemo(
    () => niceTicks(yMin, yMax, 5),
    [yMin, yMax]
  );

  // HiDPI setup whenever dims change
  useEffect(() => {
    const ratio = window.devicePixelRatio || 1;
    const { w: width, h: height } = dims;

    function setupCanvas(c: HTMLCanvasElement | null) {
      if (!c) return;
      c.width = width * ratio;
      c.height = height * ratio;
      c.style.width = width + "px";
      c.style.height = height + "px";
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
    }

    setupCanvas(bgRef.current);
    setupCanvas(fgRef.current);
  }, [dims]);

  // draw background (grid, axes, labels)
  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return;
    const ctx = bg.getContext("2d");
    if (!ctx) return;

    const { w: width, h: height } = dims;

    ctx.clearRect(0, 0, width, height);

    if (bgColor && bgColor !== "transparent" && bgColor !== "rgba(0,0,0,0)") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.lineWidth = 1;
    ctx.font = "12px system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillStyle = fontColor;
    ctx.strokeStyle = gridColor;

    // horizontal grid and y tick labels
    yTicks.forEach((yv) => {
      const py = scale.yScale(yv);

      ctx.strokeStyle = gridColor;
      ctx.beginPath();
      ctx.moveTo(padding.left, py);
      ctx.lineTo(width - padding.right, py);
      ctx.stroke();

      ctx.fillStyle = fontColor;
      ctx.textAlign = "right";
      ctx.fillText(yTickFormat(yv), padding.left - 6, py);
    });

    // vertical grid and x tick labels
    xTicks.forEach((xv) => {
      const px = scale.xScale(xv);

      ctx.strokeStyle = gridColor;
      ctx.beginPath();
      ctx.moveTo(px, padding.top);
      ctx.lineTo(px, height - padding.bottom);
      ctx.stroke();

      ctx.fillStyle = fontColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(
        xTickFormat(xv),
        px,
        height - padding.bottom + 4
      );
    });

    // axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;

    // x axis
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // y axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();

    // axis labels
    ctx.fillStyle = fontColor;
    ctx.font = "13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(
      xLabel,
      padding.left + scale.plotW / 2,
      height - 4
    );

const yLabelX = 0

ctx.save();
ctx.translate(yLabelX, padding.top + scale.plotH / 2);
ctx.rotate(-Math.PI / 2);
ctx.textAlign = "center";
ctx.textBaseline = "top";
ctx.fillText(yLabel, 0, 0);
ctx.restore();
  }, [
    dims,
    bgColor,
    gridColor,
    axisColor,
    fontColor,
    padding,
    scale,
    xTicks,
    yTicks,
    xLabel,
    yLabel,
    yTickFormat,
    xTickFormat,
  ]);

  // draw foreground (all lines + markers)
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const ctx = fg.getContext("2d");
    if (!ctx) return;

    const { w: width, h: height } = dims;

    ctx.clearRect(0, 0, width, height);

    for (const s of preparedSeries) {
      if (!s.len) continue;

      ctx.lineWidth = 2;
      ctx.strokeStyle = s.color!;
      ctx.beginPath();
      ctx.moveTo(scale.xScale(s.x[0]), scale.yScale(s.y[0]));
      for (let i = 1; i < s.len; i++) {
        ctx.lineTo(scale.xScale(s.x[i]), scale.yScale(s.y[i]));
      }
      ctx.stroke();

      ctx.fillStyle = s.color!;
      for (let i = 0; i < s.len; i++) {
        const px = scale.xScale(s.x[i]);
        const py = scale.yScale(s.y[i]);
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [preparedSeries, dims, scale]);

  // hover (nearest point across all series)
  useEffect(() => {
    const root = containerRef.current;
    const fg = fgRef.current;
    if (!root || !fg) return;

    function handleMove(evt: MouseEvent) {
      if (!fg) return;
      const rect = fg.getBoundingClientRect();
      const mx = evt.clientX - rect.left;
      const my = evt.clientY - rect.top;

let best = {
  dist2: Infinity, // squared distance for speed
  px: 0,
  py: 0,
  xv: 0,
  yv: 0,
  name: "",
  color: "#fff",
};

for (const s of preparedSeries) {
  for (let i = 0; i < s.len; i++) {
    const px = scale.xScale(s.x[i]);
    const py = scale.yScale(s.y[i]);

    const dx = px - mx;
    const dy = py - my;
    const d2 = dx * dx + dy * dy; // no sqrt needed

    if (d2 < best.dist2) {
      best = {
        dist2: d2,
        px,
        py,
        xv: s.x[i],
        yv: s.y[i],
        name: s.name,
        color: s.color!,
      };
    }
  }
}

      const { w: width, h: height } = dims;
      const inPlot =
        mx >= padding.left &&
        mx <= width - padding.right &&
        my >= padding.top &&
        my <= height - padding.bottom;

      if (!inPlot) {
        setHoverInfo((h) => ({ ...h, show: false }));
        return;
      }

      setHoverInfo({
        px: best.px,
        py: best.py,
        xv: best.xv,
        yv: best.yv,
        name: best.name,
        color: best.color,
        show: true,
      });
    }

    function handleLeave() {
      setHoverInfo((h) => ({ ...h, show: false }));
    }

    root.addEventListener("mousemove", handleMove);
    root.addEventListener("mouseleave", handleLeave);
    return () => {
      root.removeEventListener("mousemove", handleMove);
      root.removeEventListener("mouseleave", handleLeave);
    };
  }, [preparedSeries, dims, padding, scale]);

  const tooltipStyle: CSSProperties = useMemo(() => {
    if (!hoverInfo.show) return { display: "none" };
    const left = hoverInfo.px + 12;
    const top = hoverInfo.py + 12;
    return {
      position: "absolute",
      left,
      top,
      backgroundColor: "rgba(15,23,42,0.9)",
      color: "#e2e8f0",
      fontSize: "11px",
      lineHeight: 1.3,
      padding: "6px 8px",
      borderRadius: "4px",
      border: "1px solid rgba(148,163,184,0.4)",
      pointerEvents: "none",
      whiteSpace: "nowrap",
    };
  }, [hoverInfo]);

  const legend = (
    <div
      style={{
        position: "absolute",
        top: padding.top + 4,
        left: padding.left + 4,
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 12px",
        fontSize: "11px",
        lineHeight: 1.2,
        color: fontColor,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
        backgroundColor: "rgba(0,0,0,0)",
        pointerEvents: "none",
      }}
    >
      {preparedSeries.map((s, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "rgba(15,23,42,0.6)",
            borderRadius: "4px",
            border: "1px solid rgba(148,163,184,0.4)",
            padding: "2px 6px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "999px",
              backgroundColor: s.color,
              boxShadow: `0 0 4px ${s.color}`,
            }}
          />
          <div style={{ whiteSpace: "nowrap" }}>{s.name}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        // height is controlled by us through canvas size:
        // we don't hard set container height, we let absolutely
        // positioned canvases define layout via an extra wrapper below.
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      }}
    >
      {/* absolutely positioned drawing layer */}
      <div
        style={{
          position: "relative",
          width: dims.w,
          height: dims.h,
        }}
      >
        <canvas
          ref={bgRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: dims.w,
            height: dims.h,
          }}
        />
        <canvas
          ref={fgRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: dims.w,
            height: dims.h,
          }}
        />

        {/* Legend */}
        {showLegend && legend}

        {/* Hover crosshair, marker, tooltip */}
        {hoverInfo.show && (
          <>
            <div
              style={{
                position: "absolute",
                left: hoverInfo.px,
                top: padding.top,
                width: 1,
                height: dims.h - padding.top - padding.bottom,
                backgroundColor: "rgba(226,232,240,0.4)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: hoverInfo.px - 4,
                top: hoverInfo.py - 4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: hoverInfo.color,
                pointerEvents: "none",
                boxShadow: `0 0 6px ${hoverInfo.color}`,
              }}
            />

            <div style={tooltipStyle}>
              <div
                style={{
                  color: hoverInfo.color,
                  fontWeight: 600,
                }}
              >
                {hoverInfo.name}
              </div>
              <div>τ = {hoverInfo.xv.toFixed(2)} yr</div>
              <div>
                y = {(hoverInfo.yv * 100).toFixed(2)}%
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

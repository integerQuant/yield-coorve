import React, { useMemo, useState, useEffect } from "react";
import { computeNSSCurve, NSSParams } from "../nss";
import NumberField from "./NumberField";
import { latestByType, CurveType } from "../defaultParams";
import TauPresets, { getPresetTenors, TauPresetKey } from "./TauPresets";
import CurveTypeSelect from "./CurveTypeSelect";
import FastCurveChart from "./FastCurveChart";

import "./App.css";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="section-box">
      <h2 className="section-heading">{title}</h2>
      <div className="section-content">{children}</div>
    </section>
  );
}

function ParamGrid({
  params,
  setParams
}: {
  params: NSSParams;
  setParams: (p: NSSParams) => void;
}) {
  return (
    <div className="param-grid">
      <NumberField
        label="β1"
        value={params.b1}
        min={-0.5}
        max={0.5}
        step={0.00005}
        onChange={(v) => setParams({ ...params, b1: v })}
      />
      <NumberField
        label="β2"
        value={params.b2}
        min={-0.5}
        max={0.5}
        step={0.00005}
        onChange={(v) => setParams({ ...params, b2: v })}
      />
      <NumberField
        label="β3"
        value={params.b3}
        min={-0.5}
        max={0.5}
        step={0.00005}
        onChange={(v) => setParams({ ...params, b3: v })}
      />
      <NumberField
        label="β4"
        value={params.b4}
        min={-0.5}
        max={0.5}
        step={0.00005}
        onChange={(v) => setParams({ ...params, b4: v })}
      />
      <NumberField
        label="λ1"
        value={params.l1}
        min={0.01}
        max={5}
        step={0.0005}
        onChange={(v) => setParams({ ...params, l1: v })}
      />
      <NumberField
        label="λ2"
        value={params.l2}
        min={0.01}
        max={5}
        step={0.0005}
        onChange={(v) => setParams({ ...params, l2: v })}
      />
    </div>
  );
}

export default function App() {
  // which curve params snapshot
  const [curveType, setCurveType] = useState<CurveType>("pre");
  const [params, setParams] = useState<NSSParams>(latestByType["pre"].params);

  // τ preset controls (UI state)
  const [preset, setPreset] = React.useState<TauPresetKey>("smoothFixed");
  const [customYears, setCustomYears] = React.useState(10);
  const [customPointsPerYear, setCustomPointsPerYear] = React.useState(252);

  // this is the actual τ grid used for the math and chart
  const [tauVec, setTauVec] = React.useState<number[]>(() =>
    getPresetTenors("smoothFixed", 10, 252)
  );

  // whenever preset or custom inputs change, recompute tauVec automatically
  useEffect(() => {
    const newTaus = getPresetTenors(preset, customYears, customPointsPerYear);
    setTauVec(newTaus);
  }, [preset, customYears, customPointsPerYear]);

  // recompute the curve from params and tauVec
  const { t, spot, forward } = useMemo(
    () => computeNSSCurve(params, tauVec),
    [params, tauVec]
  );

  return (
    <div className="bgfx">
      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">yield coorve</h1>
          <p className="app-subtitle">
            an interactive term structure demonstration by{" "}
            <a
              href="https://rmtb.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="ext-link"
            >
              rmtb
            </a>
          </p>
        </header>

        <div className="controls-shell">
          <div className="controls-main">
            <div className="controls-left">
              <TauPresets
                preset={preset}
                setPreset={setPreset}
                customYears={customYears}
                setCustomYears={setCustomYears}
                customPointsPerYear={customPointsPerYear}
                setCustomPointsPerYear={setCustomPointsPerYear}
              />
            </div>

            <div className="controls-right">
              <CurveTypeSelect
                curveType={curveType}
                setCurveType={setCurveType}
                latestByType={latestByType}
                setParams={setParams}
              />
            </div>
          </div>

          <FastCurveChart
            series={[
              {
                name: "spot",
                x: t,
                y: spot,
                color: "#238dd3ff" // cyan-400
              },
              {
                name: "forward",
                x: t,
                y: forward,
                color: "#40beaeff" // violet-400
              }
            ]}
            xLabel="Maturity τ (years)"
            yLabel="Yield (%)"
          />

          <ParamGrid params={params} setParams={setParams} />

          <div className="flex-container" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p className="tip-text tip-anim">
              Tip: increase λ to pull curvature toward the short end; decrease to move
              humps out the curve. last update: {latestByType[curveType].date}
            </p>

            <button
              className="reset-button"
              onClick={() => setParams(latestByType[curveType].params)}
              type="button"
            >
              <span className="reset-label">Reset Params</span>
              <div className="glow-ring" aria-hidden="true" />
            </button>
          </div>
        </div>

        <Section title="What this is">
          <p>
            This page is a hands-on explainer and sandbox for the Nelson–Siegel–Svensson (NSS)
            term-structure model. Use the controls to set parameters{" "}
            <code>β1…β4, λ1, λ2</code>, choose a maturity grid <code>τ</code>, and
            visualize the resulting <strong>spot curve</strong> <code>y(τ)</code> and
            the <strong>instantaneous forward curve</strong> <code>f(τ)</code>.
          </p>
          <ul>
            <li>
              <strong>Preset params:</strong> switch between <code>pre</code> (nominal)
              and <code>ipca</code> (inflation-linked) and reset to the latest snapshot.
            </li>
            <li>
              <strong>τ presets:</strong> discrete classroom set, a Brazil-ish set,
              or a smooth grid (<strong>252 pts/year</strong>) for silky curves.
            </li>
          </ul>
        </Section>

        <Section title="Quick primer: NSS in one minute">
          <p>
            The NSS model expresses the spot yield at maturity <code>τ</code> as a
            sum of basis functions with coefficients <code>β1…β4</code> and decay
            rates <code>λ1, λ2</code>. The first term (<code>β1</code>) sets the
            overall level. The second (<code>β2</code>) governs the short-end slope.
            The third and fourth (<code>β3, β4</code>) add one or two “humps”
            (curvature). The <code>λ</code>'s control where those humps live on the
            τ-axis.
          </p>
          <ul>
            <li>
              <strong>β1 (level):</strong> shifts the entire curve up/down.
            </li>
            <li>
              <strong>β2 (slope):</strong> mostly impacts the short end; more
              positive → steeper upward slope near τ≈0.
            </li>
            <li>
              <strong>β3, β4 (curvature):</strong> create mid-maturity bumps/troughs;
              signs determine hump vs. dip.
            </li>
            <li>
              <strong>λ1, λ2 (shape):</strong> larger λ pulls curvature toward the
              short end; smaller pushes it out the curve.
            </li>
          </ul>
        </Section>

        <Section title="Where do these parameters come from?">
          <p>
            NSS parameters are estimated by fitting observed market prices/yields with
            a Svensson curve (non-linear least squares). In the <strong>U.S.</strong>,
            the Fed staff (GSW series) publishes daily Svensson fits for the Treasury
            curve. In <strong>Brazil</strong>, <strong>ANBIMA</strong> estimates and
            publishes the ETTJ using the Svensson model; all six parameters are
            estimated daily for the released curves.
          </p>
        </Section>

        <Section title='What are “pre” and “ipca”?'>
          <ul>
            <li>
              <strong>Pré</strong> = Brazil’s fixed-rate nominal curve (<em>prefixado</em>,
              e.g., LTN / NTN-F).
            </li>
            <li>
              <strong>IPCA</strong> = inflation-linked curve (Tesouro
              IPCA+, formerly NTN-B), which pays a real yield plus IPCA inflation.
            </li>
          </ul>
        </Section>

        <Section title="Spot vs. instantaneous forward">
          <p>
            The <strong>spot curve</strong> <code>y(τ)</code> is the
            continuously-compounded yield for a zero-coupon payoff at maturity{" "}
            <code>τ</code>. The <strong>instantaneous forward</strong>{" "}
            <code>f(τ)</code> is the marginal rate for borrowing/lending over an
            infinitesimal interval starting at <code>τ</code>. In differentiable
            models like NSS, they’re linked by{" "}
            <code>{"f(τ) = y(τ) + τ·dy/dτ"}</code>.
          </p>
          <p>
            Put another way: the <strong>spot curve</strong> tells you the
            all-in yield you would get if you locked in your money from today
            until a specific maturity. The <strong>forward curve</strong> asks:
            if I am already invested until time τ, what interest rate could I
            lock in starting at τ for the next instant? Forward rates highlight
            where the market expects rises or falls ahead. Humps and dips often
            line up with anticipated policy moves or cycle turns.
          </p>
        </Section>
      </div>
    </div>
  );
}

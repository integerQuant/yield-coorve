import React, { useMemo, useState } from "react";
import { computeNSSCurve, NSSParams } from "../nss";
import NumberField from "./NumberField";
import { latestByType, CurveType } from "../defaultParams";
import TauPresets, { getPreset, TauPresetKey, smoothTenors } from "./TauPresets";
import FastCurveChart from "./FastCurveChart";

import "./App.css";

const DEFAULT_TENORS = smoothTenors();

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
        label="β1 (level)"
        value={params.b1}
        min={-0.5}
        max={0.5}
        step={0.0001}
        onChange={(v) => setParams({ ...params, b1: v })}
      />
      <NumberField
        label="β2 (slope)"
        value={params.b2}
        min={-0.5}
        max={0.5}
        step={0.0001}
        onChange={(v) => setParams({ ...params, b2: v })}
      />
      <NumberField
        label="β3 (curv.1)"
        value={params.b3}
        min={-0.5}
        max={0.5}
        step={0.0001}
        onChange={(v) => setParams({ ...params, b3: v })}
      />
      <NumberField
        label="β4 (curv.2)"
        value={params.b4}
        min={-0.5}
        max={0.5}
        step={0.0001}
        onChange={(v) => setParams({ ...params, b4: v })}
      />
      <NumberField
        label="λ1 (shape 1)"
        value={params.l1}
        min={0.01}
        max={5}
        step={0.0001}
        onChange={(v) => setParams({ ...params, l1: v })}
      />
      <NumberField
        label="λ2 (shape 2)"
        value={params.l2}
        min={0.01}
        max={5}
        step={0.0001}
        onChange={(v) => setParams({ ...params, l2: v })}
      />
    </div>
  );
}

export default function App() {
  const [curveType, setCurveType] = useState<CurveType>("pre");
  const [params, setParams] = useState<NSSParams>(latestByType["pre"].params);

  // τ controls
  const [tauPreset, setTauPreset] = useState<TauPresetKey>("smooth");
  const [tenorsInput, setTenorsInput] = useState(DEFAULT_TENORS.join(", "));

  const applyPreset = () => {
    const arr = getPreset(tauPreset);
    setTenorsInput(arr.join(", "));
  };

  const tenors = useMemo(() => {
    try {
      const arr = tenorsInput
        .split(",")
        .map((s) => parseFloat(s.trim()))
        .filter((v) => Number.isFinite(v) && v >= 0);
      const uniq = Array.from(new Set(arr)).sort((a, b) => a - b);
      return uniq.length ? uniq : DEFAULT_TENORS;
    } catch {
      return DEFAULT_TENORS;
    }
  }, [tenorsInput]);

  const { t, spot, forward } = useMemo(
    () => computeNSSCurve(params, tenors),
    [params, tenors]
  );

  return (
    <div className="bgfx">
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">yield coorve fitoor</h1>
        <p className="app-subtitle">
          an interactive vibe coded article by{" "}
          <a
            href="https://github.com/internQuant"
            target="_blank"
            rel="noopener noreferrer"
            className="ext-link"
          >
            internQuant
          </a>
        </p>
      </header>

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
        <p>
          <strong>pre</strong> = Brazil’s fixed-rate nominal curve (<em>prefixado</em>,
          e.g., LTN / NTN-F). <strong>ipca</strong> = inflation-linked curve (Tesouro
          IPCA+, formerly NTN-B), which pays a real yield plus IPCA inflation.
        </p>
      </Section>

      <Section title="Pick maturities (τ)">
        <TauPresets
          preset={tauPreset}
          setPreset={setTauPreset}
          input={tenorsInput}
          setInput={setTenorsInput}
          onApplyPreset={applyPreset}
        />
      </Section>

      <Section title="Choose parameters">
        <div className="controls-row">
          <label className="controls-label">Parameter set:</label>

          <div className="controls-group">
            <select
              className="select-input"
              value={curveType}
              onChange={(e) => {
                const ct = e.target.value as CurveType;
                setCurveType(ct);
                setParams(latestByType[ct].params);
              }}
            >
              <option value="pre">pre</option>
              <option value="ipca">ipca</option>
            </select>

            <button
              className="reset-button"
              onClick={() => setParams(latestByType[curveType].params)}
            >
              Reset to latest
            </button>
          </div>

          <span className="latest-span">
            Latest: {latestByType[curveType].date}
          </span>

          <p className="tip-text">
            Tip: increase λ to pull curvature toward the short end; decrease to
            move humps out the curve.
          </p>
        </div>

        <ParamGrid params={params} setParams={setParams} />
      </Section>

      <div className="chart-wrapper">
        <section className="chart-section">
          <FastCurveChart
            series={[
              {
                name: "spot",
                x: t,
                y: spot,
                color: "#38bdf8" // cyan-400
              },
              {
                name: "forward",
                x: t,
                y: forward,
                color: "#a78bfa" // violet-400
              }
            ]}
            xLabel="Maturity τ (years)"
            yLabel="Yield (%)"
          />

          <div className="formula-text">
            {
              "y(τ) = β1 + β2·[(1 - e^(-λ1·τ))/(λ1·τ)] + β3·([(1 - e^(-λ1·τ))/(λ1·τ) - e^(-λ1·τ)]) + β4·([(1 - e^(-λ2·τ))/(λ2·τ) - e^(-λ2·τ)])"
            }
          </div>

          <div className="formula-text">
            {
              "y(τ) = β1 + β2·[(1 - e^(-λ1·τ))/(λ1·τ)] + β3·([(1 - e^(-λ1·τ))/(λ1·τ) - e^(-λ1·τ)]) + β4·([(1 - e^(-λ2·τ))/(λ2·τ) - e^(-λ2·τ)])"
            }
          </div>
        </section>
      </div>

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

import React, { useMemo, useState } from "react";
import { computeNSSCurve, NSSParams } from "../nss";
import Plot from "./Plot";
import NumberField from "./NumberField";
import { latestByType, CurveType } from "../defaultParams";
import TauPresets, { getPreset, TauPresetKey, smoothTenors } from "./TauPresets";

const DEFAULT_TENORS = smoothTenors();

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-800 p-6 bg-slate-950/40">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="prose prose-invert max-w-none">{children}</div>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <NumberField label="β1 (level)" value={params.b1} min={-0.5} max={0.5} step={0.0005}
        onChange={(v) => setParams({ ...params, b1: v })} />
      <NumberField label="β2 (slope)" value={params.b2} min={-0.5} max={0.5} step={0.0005}
        onChange={(v) => setParams({ ...params, b2: v })} />
      <NumberField label="β3 (curv.1)" value={params.b3} min={-0.5} max={0.5} step={0.0005}
        onChange={(v) => setParams({ ...params, b3: v })} />
      <NumberField label="β4 (curv.2)" value={params.b4} min={-0.5} max={0.5} step={0.0005}
        onChange={(v) => setParams({ ...params, b4: v })} />
      <NumberField label="λ1 (shape 1)" value={params.l1} min={0.01} max={5} step={0.0005}
        onChange={(v) => setParams({ ...params, l1: v })} />
      <NumberField label="λ2 (shape 2)" value={params.l2} min={0.01} max={5} step={0.0005}
        onChange={(v) => setParams({ ...params, l2: v })} />
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
      // ensure ascending & unique
      const uniq = Array.from(new Set(arr)).sort((a, b) => a - b);
      return uniq.length ? uniq : DEFAULT_TENORS;
    } catch {
      return DEFAULT_TENORS;
    }
  }, [tenorsInput]);

  const { t, spot, forward } = useMemo(() => computeNSSCurve(params, tenors), [params, tenors]);

  return (
    <div className="min-h-screen p-6 sm:p-10 space-y-8 max-w-4xl mx-auto">
      <header className="mb-2">
        <h1 className="text-3xl font-semibold tracking-tight">yield coorve fitoor</h1>
        <p className="text-sm text-slate-400">
          an interactive vibe coded article by{" "}
          <a
            href="https://github.com/internQuant"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-indigo-400"
          >
            internQuant
          </a>
        </p>
      </header>

      {/* Intro / What this page does */}
      <Section title="What this is">
        <p>
          This page is a hands-on explainer and sandbox for the Nelson–Siegel–Svensson (NSS) term-structure model.
          Use the controls to set parameters <code>β1…β4, λ1, λ2</code>, choose a maturity grid <code>τ</code>,
          and visualize the resulting <strong>spot curve</strong> <code>y(τ)</code> and the
          <strong> instantaneous forward curve</strong> <code>f(τ)</code>.
        </p>
        <ul>
          <li><strong>Preset params:</strong> switch between <code>pre</code> (nominal) and <code>ipca</code> (inflation-linked) and reset to the latest snapshot.</li>
          <li><strong>τ presets:</strong> discrete classroom set, a Brazil-ish set, or a smooth grid (<strong>252 pts/year</strong>) for silky curves.</li>
        </ul>
      </Section>

      {/* How are parameters obtained / who publishes them */}
      <Section title="Where do these parameters come from?">
        <p>
          In practice, NSS parameters are estimated by minimizing the distance between observed market prices/yields and the model’s
          fitted curve (a non-linear least-squares problem). In the <strong>United States</strong>, the Federal Reserve Board’s staff
          publishes a daily Svensson fit of the nominal Treasury curve (the well-known Gürkaynak–Sack–Wright series), including the six
          parameters and the smoothed yields. It’s a research series (not an official statistical release). For <strong>Brazil</strong>,
          <strong> ANBIMA</strong> estimates and releases the ETTJ (term structure) using the Svensson model and explicitly states that
          all six parameters are estimated daily for the curves it publishes.
        </p>
        <p className="text-xs text-slate-400">
          Sources: FRB “Nominal Yield Curve” (GSW) and ANBIMA’s “Estimated Interest Rates Term Structure and Implicit Inflation Methodology”.
        </p>
      </Section>

      {/* What are pre and IPCA */}
      <Section title="What are “pre” and “ipca”?">
        <p>
          In this app, <strong>pre</strong> refers to Brazil’s fixed-rate (nominal, <em>prefixado</em>) government bond curve
          — e.g., LTN / NTN-F (Tesouro Prefixado). The yield is stated in nominal terms. <strong>ipca</strong> refers to the
          inflation-linked curve (Tesouro IPCA+, historically NTN-B), where the investor earns a real yield plus the inflation
          measured by the IPCA index.
        </p>
        <p className="text-xs text-slate-400">
          In the official Tesouro Direto docs, “títulos prefixados” pay a fixed nominal rate, while “títulos indexados ao IPCA”
          are corrected by the IPCA (inflation) plus a fixed real rate.
        </p>
      </Section>

      {/* Tau presets */}
      <Section title="Pick maturities (τ)">
        <TauPresets
          preset={tauPreset}
          setPreset={setTauPreset}
          input={tenorsInput}
          setInput={setTenorsInput}
          onApplyPreset={applyPreset}
        />
      </Section>

      {/* Parameters + curve type */}
      <Section title="Choose parameters">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-300">Parameter set:</label>
          <select
            className="rounded bg-slate-900 px-3 py-2 ring-1 ring-slate-700 focus:ring-indigo-500 outline-none"
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
            className="rounded bg-indigo-600 px-3 py-2 text-sm hover:bg-indigo-500"
            onClick={() => setParams(latestByType[curveType].params)}
          >
            Reset to latest
          </button>
          <span className="text-xs text-slate-500">
            Latest: {latestByType[curveType].date}
          </span>
          
        <p className="text-slate-400 text-xs">
        Tip: increase λ to pull curvature toward the short end; decrease to move humps out along the curve.
      </p>
        </div>
        <ParamGrid params={params} setParams={setParams} />
      </Section>

      {/* Plots */}
      <div className="grid grid-cols-1 gap-8">
        <section className="rounded-xl border border-slate-800 p-4">
          <Plot
            title="Spot Curve  y(τ)"
            traces={[{ x: t, y: spot, name: "spot" }]}
            xTitle="Maturity τ (years)"
            yTitle="Yield (%)"
          />
          <div className="text-xs text-slate-400 mt-2">
            {"y(τ) = β1 + β2·[(1 - e^(-λ1·τ))/(λ1·τ)] + β3·([(1 - e^(-λ1·τ))/(λ1·τ) - e^(-λ1·τ)]) + β4·([(1 - e^(-λ2·τ))/(λ2·τ) - e^(-λ2·τ)])"}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 p-4">
          <Plot
            title="Instantaneous Forward Curve  f(τ)"
            traces={[{ x: t, y: forward, name: "forward" }]}
            xTitle="Maturity τ (years)"
            yTitle="Rate (%)"
          />
          <div className="text-xs text-slate-400 mt-2">
            {"f(τ) = y(τ) + τ·dy/dτ"}
          </div>
        </section>
      </div>

      {/* Primer */}
      <Section title="Quick primer: NSS in one minute">
        <p>
          The NSS model expresses the spot yield at maturity <code>τ</code> as a sum of basis functions with
          coefficients <code>β1…β4</code> and decay rates <code>λ1, λ2</code>. The first term (<code>β1</code>) sets the overall level.
          The second (<code>β2</code>) governs the short-end slope. The third and fourth (<code>β3, β4</code>) add one or two “humps”
          (curvature). The <code>λ</code>’s control where those humps live on the τ-axis.
        </p>
        <ul>
          <li><strong>β1 (level):</strong> shifts the entire curve up/down.</li>
          <li><strong>β2 (slope):</strong> mostly impacts the short end; more positive → steeper upward slope near τ≈0.</li>
          <li><strong>β3, β4 (curvature):</strong> create mid-maturity bumps/troughs; signs determine hump vs. dip.</li>
          <li><strong>λ1, λ2 (shape):</strong> larger λ pulls curvature toward the short end; smaller λ pushes it out the curve.</li>
        </ul>
      </Section>

      <Section title="Spot vs. instantaneous forward">
        <p>
          The <strong>spot curve</strong> <code>y(τ)</code> is the continuously-compounded yield for a zero-coupon payoff at maturity <code>τ</code>.
          The <strong>instantaneous forward</strong> <code>f(τ)</code> is the marginal rate for borrowing/lending over an infinitesimal interval starting at <code>τ</code>.
          In differentiable models like NSS, they’re linked by <code>{"f(τ) = y(τ) + τ·dy/dτ"}</code>.
        </p>
        <p>
  Put another way: the <strong>spot curve</strong> tells you the “all-in” yield you’d get if you locked in your money from today 
  until a specific maturity. The <strong>forward curve</strong> instead asks: “if I’m already invested until time&nbsp;τ, 
  what interest rate could I lock in <em>starting at τ</em> for the next instant?”  
  Forward rates highlight where the market expects rates to rise or fall in the future — 
  humps and dips often line up with anticipated monetary policy moves or economic cycles.
</p>
      </Section>

      <Section title="Current parameters">
        <p>
          The controls reflect the latest provided parameters for the selected type:
        </p>
        <ul>
          <li><code>pre</code> on <code>{latestByType.pre.date}</code>: β1={latestByType.pre.params.b1.toFixed(6)}, β2={latestByType.pre.params.b2.toFixed(6)}, β3={latestByType.pre.params.b3.toFixed(6)}, β4={latestByType.pre.params.b4.toFixed(6)}, λ1={latestByType.pre.params.l1.toFixed(6)}, λ2={latestByType.pre.params.l2.toFixed(6)}</li>
          <li><code>ipca</code> on <code>{latestByType.ipca.date}</code>: β1={latestByType.ipca.params.b1.toFixed(6)}, β2={latestByType.ipca.params.b2.toFixed(6)}, β3={latestByType.ipca.params.b3.toFixed(6)}, β4={latestByType.ipca.params.b4.toFixed(6)}, λ1={latestByType.ipca.params.l1.toFixed(6)}, λ2={latestByType.ipca.params.l2.toFixed(6)}</li>
        </ul>
        <p className="text-slate-400 text-xs">
          Click “Reset to latest” anytime to snap back to these values.
        </p>
      </Section>

    </div>
  );
}

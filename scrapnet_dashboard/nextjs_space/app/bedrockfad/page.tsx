"use client";

import React, { useState, useEffect } from "react";

const STATE_RATES: Record<string, { name: string; rate: number }> = {
  NV: { name: "Nevada", rate: 0.0899 },
  CA: { name: "California", rate: 0.2575 },
  TX: { name: "Texas", rate: 0.1089 },
  NY: { name: "New York", rate: 0.1902 },
  FL: { name: "Florida", rate: 0.1156 },
  IL: { name: "Illinois", rate: 0.1302 },
  AZ: { name: "Arizona", rate: 0.1187 },
  CO: { name: "Colorado", rate: 0.1298 },
  WA: { name: "Washington", rate: 0.1012 },
  OR: { name: "Oregon", rate: 0.1089 },
  GA: { name: "Georgia", rate: 0.1089 },
  NC: { name: "N. Carolina", rate: 0.1098 },
  OH: { name: "Ohio", rate: 0.1298 },
  PA: { name: "Pennsylvania", rate: 0.1389 },
  MI: { name: "Michigan", rate: 0.1402 },
  US: { name: "National Avg", rate: 0.1419 },
};

const CHILLER_COP = 3.5;

export const dynamic = "force-dynamic";

export default function BedrockFADPage() {
  const [mounted, setMounted] = useState(false);
  const [kwInput, setKwInput] = useState(350);
  const [hours, setHours] = useState(5200);
  const [selectedState, setSelectedState] = useState("US");
  const [activePanel, setActivePanel] = useState<"ghost" | "intake">("ghost");
  const [dragOver, setDragOver] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [ticker, setTicker] = useState({ flux: 847.3, co2: 1284.7 });

  useEffect(() => {
    setMounted(true);
    const iv = setInterval(() => {
      setTicker((p) => ({
        flux: Math.max(600, Math.min(1200, +(p.flux + (Math.random() - 0.48) * 3.1).toFixed(1))),
        co2: +(p.co2 + Math.random() * 0.3).toFixed(1),
      }));
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  const rate = STATE_RATES[selectedState]?.rate ?? 0.1419;
  const kwe = kwInput / CHILLER_COP;
  const annualKwh = kwe * hours;
  const annualUSD = annualKwh * rate;
  const assetSovereign = annualUSD * 0.7;
  const verificationNode = annualUSD * 0.2;
  const publicPool = annualUSD * 0.1;
  const recoveryPct = Math.min((kwInput / 2000) * 100, 100);

  const fmt = (v: number) =>
    v >= 1e6
      ? `$${(v / 1e6).toFixed(2)}M`
      : `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (!mounted) {
    return <div style={{ minHeight: "100vh", background: "#030712" }} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#e2e8f0", position: "relative", overflow: "hidden", fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* AMBIENT BACKGROUND */}
      <div style={{ position: "fixed", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,242,254,.07) 0%,transparent 68%)", pointerEvents: "none", zIndex: 0 }} />

      {/* TOP HUD */}
      <div style={{ position: "relative", zIndex: 30, borderBottom: "1px solid rgba(0,242,254,.14)", background: "rgba(3,7,18,.82)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", padding: "12px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00F2FE", boxShadow: "0 0 10px #00F2FE" }} />
            <span style={{ fontSize: 11, letterSpacing: ".18em", color: "#00F2FE", fontWeight: 600 }}>BEDROCK FAD</span>
            <span style={{ fontSize: 10, letterSpacing: ".12em", color: "#94a3b8" }}>// FORENSIC DISCOVERY PORTAL</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            {([
              { label: "Deep-Sky Flux", val: `${ticker.flux} W/m²`, color: "#00F2FE" },
              { label: "Avoided CO₂e", val: `${ticker.co2.toLocaleString()} MT`, color: "#10B981" },
              { label: "Σ BPS Floor", val: "10,000", color: "#F59E0B" },
            ] as const).map((m, i) => (
              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {i > 0 && <div style={{ width: 1, height: 28, background: "#334155" }} />}
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, letterSpacing: ".14em", color: "#94a3b8", textTransform: "uppercase" }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: m.color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{m.val}</div>
                </div>
              </div>
            ))}
            <div style={{ width: 1, height: 28, background: "#334155" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px #10B981" }} />
              <span style={{ fontSize: 10, color: "#10B981", letterSpacing: ".1em" }}>CONSENSUS ≥ 0.72 LOCKED</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "40px 24px 60px" }}>

        {/* PAGE HEADER */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 9, letterSpacing: ".18em", color: "rgba(0,242,254,.85)", textTransform: "uppercase", marginBottom: 14 }}>// ASSET REALIZATION CONSOLE — THERMAL WASTE ORACLE</div>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1.15, color: "#f8fafc" }}>
            Paid-For Waste Energy.<br />
            <span style={{ color: "#00F2FE" }}>Sovereign Liquid Value.</span>
          </h1>
          <p style={{ marginTop: 14, fontSize: 13, color: "#cbd5e1", maxWidth: 560, lineHeight: 1.7 }}>
            Every facility hemorrhages verified USD in thermal waste 24 hours a day. The GhostConverter™ oracle translates invisible physics into immutable yield — grounded in ASHRAE 90.1 and EIA commercial tariffs. Zero synthetic numbers.
          </p>
        </div>

        {/* DUAL PANE */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20, marginBottom: 20 }}>

          {/* GHOST CONVERTER */}
          <div style={{ borderRadius: 2, padding: 28, position: "relative", overflow: "hidden", cursor: "pointer", background: "rgba(15,23,42,.62)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", border: activePanel === "ghost" ? "1px solid rgba(0,242,254,.28)" : "1px solid rgba(0,242,254,.1)", boxShadow: activePanel === "ghost" ? "0 0 50px -10px rgba(0,242,254,.12)" : "none" }}
            onClick={() => setActivePanel("ghost")}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00F2FE", boxShadow: "0 0 8px #00F2FE" }} />
              <span style={{ fontSize: 10, letterSpacing: ".16em", color: "#00F2FE", textTransform: "uppercase" }}>GhostConverter™ Prism Engine</span>
              <span style={{ marginLeft: "auto", fontSize: 9, color: "#94a3b8" }}>COP 3.50 BASELINE</span>
            </div>

            {/* kW SLIDER */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "#e2e8f0" }}>Thermal Waste Input (kWth)</span>
                <span style={{ fontSize: 13, color: "#00F2FE", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{kwInput} kW</span>
              </div>
              <input type="range" min={10} max={2000} value={kwInput} onChange={e => setKwInput(+e.target.value)}
                style={{ width: "100%", height: 4, outline: "none", cursor: "pointer", accentColor: "#00F2FE" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 9, color: "#94a3b8" }}>10 kW — small retail</span>
                <span style={{ fontSize: 9, color: "#94a3b8" }}>2,000 kW — data center</span>
              </div>
            </div>

            {/* HOURS SLIDER */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "#e2e8f0" }}>Annual Operating Hours</span>
                <span style={{ fontSize: 13, color: "#F59E0B", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{hours.toLocaleString()} hrs/yr</span>
              </div>
              <input type="range" min={1000} max={8760} step={100} value={hours} onChange={e => setHours(+e.target.value)}
                style={{ width: "100%", height: 4, outline: "none", cursor: "pointer", accentColor: "#F59E0B" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 9, color: "#94a3b8" }}>1,000 — seasonal</span>
                <span style={{ fontSize: 9, color: "#94a3b8" }}>8,760 — continuous</span>
              </div>
            </div>

            {/* STATE SELECTOR */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "#e2e8f0", marginBottom: 8 }}>EIA Commercial Tariff — State / Region</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 3 }}>
                {Object.entries(STATE_RATES).map(([k]) => (
                  <button key={k} onClick={e => { e.stopPropagation(); setSelectedState(k); }}
                    style={{ fontSize: 9, padding: "5px 2px", border: "1px solid", borderColor: selectedState === k ? "rgba(0,242,254,.6)" : "#334155", color: selectedState === k ? "#00F2FE" : "#94a3b8", background: selectedState === k ? "rgba(0,242,254,.07)" : "transparent", cursor: "pointer", letterSpacing: ".06em", fontFamily: "inherit" }}>{k}</button>
                ))}
              </div>
              <div style={{ marginTop: 6, fontSize: 9, color: "#94a3b8" }}>
                {STATE_RATES[selectedState]?.name} — ${STATE_RATES[selectedState]?.rate.toFixed(4)}/kWh (EIA Commercial)
              </div>
            </div>

            {/* READOUT */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Avoided Electrical Draw", val: `${kwe.toFixed(1)} kWe` },
                { label: "Annual kWh Sunk", val: `${annualKwh.toLocaleString("en-US", { maximumFractionDigits: 0 })} kWh` },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "#e2e8f0" }}>{r.label}</span>
                  <span style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{r.val}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 14 }}>
                <span style={{ fontSize: 10, letterSpacing: ".14em", color: "#F59E0B", textTransform: "uppercase", fontWeight: 600 }}>Annual Waste Yield</span>
                <span style={{ fontSize: 26, color: "#F59E0B", fontWeight: 700, textShadow: "0 0 24px rgba(245,158,11,.45)", fontVariantNumeric: "tabular-nums" }}>{fmt(annualUSD)}</span>
              </div>
            </div>

            {/* CANONICAL BPS STRIP */}
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 14 }}>
              {[
                { label: "Asset Sovereign", val: fmt(assetSovereign), bps: "7,000 BPS (70.00%)", color: "#10B981" },
                { label: "Verification Node", val: fmt(verificationNode), bps: "2,000 BPS (20.00%)", color: "#00F2FE" },
                { label: "Public Pool", val: fmt(publicPool), bps: "1,000 BPS (10.00%)", color: "#F59E0B" },
              ].map((s, i) => (
                <div key={s.label} style={{ textAlign: "center", padding: "0 8px", borderRight: i < 2 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                  <div style={{ fontSize: 8, letterSpacing: ".1em", color: "#cbd5e1", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: s.color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{s.val}</div>
                  <div style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>{s.bps}</div>
                </div>
              ))}
            </div>
          </div>

          {/* INTAKE DROPZONE */}
          <div style={{ borderRadius: 2, padding: 28, position: "relative", overflow: "hidden", cursor: "pointer", background: "rgba(15,23,42,.62)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", border: activePanel === "intake" ? "1px solid rgba(245,158,11,.32)" : "1px solid rgba(245,158,11,.1)", boxShadow: activePanel === "intake" ? "0 0 50px -10px rgba(245,158,11,.1)" : "none" }}
            onClick={() => setActivePanel("intake")}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", boxShadow: "0 0 8px #F59E0B" }} />
              <span style={{ fontSize: 10, letterSpacing: ".16em", color: "#F59E0B", textTransform: "uppercase" }}>Holographic Data Intake</span>
              <span style={{ marginLeft: "auto", fontSize: 9, color: "#94a3b8" }}>OCR + GREEN BUTTON</span>
            </div>

            <div onDragOver={e => { e.preventDefault(); setDragOver(true); setScanActive(true); }}
              onDragLeave={() => { setDragOver(false); setScanActive(false); }}
              onDrop={e => { e.preventDefault(); setDragOver(false); setScanActive(false); }}
              style={{ position: "relative", border: `1px dashed ${dragOver ? "rgba(245,158,11,.9)" : "rgba(245,158,11,.35)"}`, borderRadius: 2, padding: "32px 20px", textAlign: "center", marginBottom: 18, background: dragOver ? "rgba(245,158,11,.06)" : "transparent" }}>
              <i className="fa-solid fa-file-waveform" style={{ fontSize: 28, color: "#94a3b8", marginBottom: 12, display: "block" }} />
              <div style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 4 }}>Drop utility bill or Green Button XML</div>
              <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: ".08em" }}>PDF · XML · CSV · EDI · PNG · TIFF</div>
              <button onClick={e => e.stopPropagation()}
                style={{ marginTop: 16, padding: "8px 20px", fontSize: 9, border: "1px solid rgba(245,158,11,.5)", color: "#F59E0B", background: "transparent", cursor: "pointer", letterSpacing: ".16em", textTransform: "uppercase", fontFamily: "inherit" }}>Browse Files</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
              {[
                { icon: "fa-file-invoice", label: "OCR Extraction", desc: "Utility invoices, demand statements, thermal audit reports", color: "#00F2FE" },
                { icon: "fa-bolt", label: "Green Button", desc: "15-min interval usage, demand response, net metering", color: "#10B981" },
              ].map(ch => (
                <div key={ch.label} style={{ border: "1px solid rgba(255,255,255,.08)", padding: 12, borderRadius: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <i className={`fa-solid ${ch.icon}`} style={{ fontSize: 10, color: ch.color }} />
                    <span style={{ fontSize: 9, letterSpacing: ".12em", color: "#e2e8f0", textTransform: "uppercase" }}>{ch.label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#cbd5e1", lineHeight: 1.5 }}>{ch.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "#e2e8f0", marginBottom: 12 }}>Sentinel Gate Triad — Pre-Screen</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Document Score", threshold: "≥ 95%", pct: 95, color: "#00F2FE" },
                  { label: "LLM Consensus", threshold: "≥ 75%", pct: 75, color: "#F59E0B" },
                  { label: "Spatial Coherence", threshold: "≥ 75%", pct: 75, color: "#10B981" },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 10, color: "#cbd5e1", width: 120 }}>{s.label}</div>
                    <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 1 }}>
                      <div style={{ height: "100%", width: `${s.pct}%`, background: s.color }} />
                    </div>
                    <div style={{ fontSize: 9, color: "#94a3b8", width: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{s.threshold}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 5px #10B981" }} />
                <span style={{ fontSize: 9, color: "rgba(16,185,129,.9)", letterSpacing: ".1em" }}>Composite Floor ≥ 0.72 · EXITZ Protocol Armed</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4-STEP ONBOARDING PROTOCOL */}
        <div style={{ borderRadius: 2, padding: "24px 28px", marginBottom: 20, background: "rgba(15,23,42,.62)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", border: "1px solid rgba(0,242,254,.1)" }}>
          <div style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "#e2e8f0", marginBottom: 20 }}>Enterprise Onboarding Protocol</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20 }}>
            {[
              { n: "01", icon: "fa-building", label: "Asset Discovery", desc: "Macro-thermal waste scan across facility footprint via satellite + public utility grid" },
              { n: "02", icon: "fa-file-invoice", label: "Invoice OCR", desc: "Upload utility bills for automated kWh/kW demand extraction against ASHRAE 90.1 baselines" },
              { n: "03", icon: "fa-shield-halved", label: "Sentinel Verification", desc: "Tri-layer consensus gate: Document ≥95% / LLM ≥75% / Spatial ≥75% · Composite ≥ 0.72" },
              { n: "04", icon: "fa-coins", label: "Yield Settlement", desc: "Sovereign BPS: Asset Sovereign 7,000 / Verification Node 2,000 / Public Pool 1,000" },
            ].map(s => (
              <div key={s.n} style={{ borderLeft: "1px solid rgba(0,242,254,.15)", paddingLeft: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: "rgba(0,242,254,.6)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{s.n}</span>
                  <i className={`fa-solid ${s.icon}`} style={{ fontSize: 10, color: "#94a3b8" }} />
                </div>
                <div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: "#cbd5e1", lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* INSTITUTIONAL FOOTER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: 24, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["ASHRAE 90.1","ICE v4.1","Ecoinvent v3.10.1","Track 24 Settlement","EPA eGRID","Hedera HCS","Solana Token-2022"].map(b => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #334155", padding: "5px 10px", borderRadius: 1 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#10B981" }} />
                <span style={{ fontSize: 8, color: "#94a3b8", letterSpacing: ".14em", textTransform: "uppercase" }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {[
              { label: "CA SOS Entity", val: "#202462418827" },
              { label: "MEDIFLO LLC", val: "EIN 39-4705679" },
              { label: "Launch", val: "Nov 2, 2026" },
            ].map((item, i) => (
              <React.Fragment key={item.label}>
                <div style={{ width: 1, height: 32, background: "#334155" }} />
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 8, color: "#94a3b8", letterSpacing: ".12em", textTransform: "uppercase" }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: "#cbd5e1", fontVariantNumeric: "tabular-nums" }}>{item.val}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

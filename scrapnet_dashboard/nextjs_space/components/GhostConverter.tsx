"use client";

import React, { useState, useId } from "react";

const STATE_RATES: Record<string, { name: string; rate: number }> = {
  NV: { name: "Nevada (Las Vegas Strip)", rate: 0.1042 },
  CA: { name: "California (Edison / PG&E)", rate: 0.2575 },
  NY: { name: "New York (ConEd)", rate: 0.2180 },
  IN: { name: "Indiana (AES / NIPSCO)", rate: 0.1284 },
  TX: { name: "Texas (ERCOT Commercial)", rate: 0.0985 },
  GLOBAL: { name: "Global Benchmark (ASHFAE / UAE)", rate: 0.1450 }
};

const FACILITY_PROFILES: Record<string, { name: string; hours: number; defaultKw: number }> = {
  CASINO: { name: "Resort & Casino Complex (24/7/365)", hours: 8760, defaultKw: 22800 },
  SKYSCRAPER: { name: "Commercial High-Rise Tower", hours: 4500, defaultKw: 14200 },
  DATACENTER: { name: "Hyperscale Data Center (Continuous)", hours: 8760, defaultKw: 18600 },
  WAREHOUSE: { name: "Industrial Logistics Hub", hours: 3500, defaultKw: 4800 },
  DISPENSARY: { name: "Indoor Controlled Ag / Retail", hours: 6200, defaultKw: 1200 }
};

export default function GhostConverter() {
  const [thermalKw, setThermalKw] = useState<number>(14200);
  const [facilityType, setFacilityType] = useState<string>("SKYSCRAPER");
  const [region, setRegion] = useState<string>("GLOBAL");

  const thermalInputId = useId();
  const facilitySelectId = useId();
  const regionSelectId = useId();

  const chillerCop = 3.5;
  const electricalKw = thermalKw / chillerCop;
  const annualHours = FACILITY_PROFILES[facilityType].hours;
  const ratePerKkh = STATE_RATES[region].rate;

  const annualKwhAvoided = electricalKw * annualHours;
  const totalAnnualValueUsd = annualKwhAvoided * ratePerKkh;
  const sovereignYieldUsd = totalAnnualValueUsd * 0.70;
  const verificationNodeUsd = totalAnnualValueUsd * 0.20;
  const publicResilienceUsd = totalAnnualValueUsd * 0.10;

  const metricTonnesCo2Avoided = (annualKwhAvoided * 0.000322).toFixed(1);

  const handleFacilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextType = e.target.value;
    setFacilityType(nextType);
    setThermalKw(FACILITY_PROFILES[nextType].defaultKw);
  };

  return (
    <div className="w-full max-w-4l mx-auto bg-stone-900 border border-stone-800 rounded-lg p-6 text-stone-100 font-mono shadow-2xl">
      <div className="flex flex-wrap justify-between items-center border-b border-stone-800 pb-4 mb-6 gap-2">
        <div>
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
            Thermodynamic Forensic Oracle
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Energy Ghost™ Financial Recovery Calculator
          </h2>
        </div>
        <div className="bg-stone-800/80 px-3 py-1 rounded border border-stone-700 text-xs text-stone-300">
          ASHRAE 90.1 Baseline: <span className="text-amber-400 font-bold">COP 3.50</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor={facilitySelectId} className="block text-xs uppercase text-stone-400 mb-2">
            Asset Profile
          </label>
          <select
            id={facilitySelectId}
            value={facilityType}
            onChange={handleFacilityChange}
            className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-sm text-stone-200 focus:border-emerald-500 focus:outline-none">
            {Object.entries(FACILITY_PROFILES).map(([key, val]) => (
              <option key={key} value={key}>{val.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={regionSelectId} className="block text-xs uppercase text-stone-400 mb-2">
            Jurisdiction / Tariff
          </label>
          <select
            id={regionSelectId}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-sm text-stone-200 focus:border-emerald-500 focus:outline-none">
            {Object.entries(STATE_RATES).map(([key, val]) => (
              <option key={key} value={key}>{val.name} (${val.rate.toFixed(4)}/kWh</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={thermalInputId} className="block text-xs uppercase text-stone-400 mb-2">
            Thermal Waste Signature (kW)
          </label>
          <input
            id={thermalInputId}
            type="number"
            min="100"
            max="100000"
            step="100"
            value={thermalKw}
            onChange={(e) => setThermalKw(Number(e.target.value))}
            className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-sm text-amber-400 font-bold focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-stone-950 border border-stone-800 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase text-stone-500 mb-1">Annual Recoverable Energy</div>
            <div className="text-2xl font-bold text-stone-200">
              {Math.round(annualKwhAvoided).toLocaleString()} <span className="text-xs text-stone-400">kWh/yr</span>
            </div>
            <div className="text-xs text-stone-400 mt-1">
              Equivalent: {metricTonnesCo2Avoided} Metric Tonnes CO2’e Avoided
            </div>
          </div>
          <div className="sm:border-l sm:border-stone-800 sm:pl-6">
            <div className="text-xs uppercase text-emerald-400 font-bold mb-1">
              Total Annual Balance-Sheet Leakage
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              ${Math.round(totalAnnualValueUsd).toLocaleString()} <span className="text-xs text-stone-400 font-normal">USD / year</span>
            </div>
            <div className="text-xs text-stone-500 mt-1">
              Hemorrhaged sensible heat across structural building envelope
            </div>
          </div>
        </div>
      </div>

      <div className="border border-stone-800 rounded-lg p-4 bg-stone-800/40">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase text-stone-400 font-bold">
            Programmatic Token-2022 Settlement Distribution (3� = 10,000 BPS)
          </span>
          <span className="text-xs text-stone-500">Dust-Free Routing</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
          <div className="bg-stone-900 p-3 rounded border border-stone-800">
            <div className="text-xs text-stone-400">Asset Sovereign (7,000 BPS)</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">
              ${Math.round(sovereignYieldUsd).toLocaleString()}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">70.00% Owner Net Yield</div>
          </div>
          <div className="bg-stone-900 p-3 rounded border border-stone-800">
            <div className="text-xs text-stone-400">Verification Node (2,000 BPS)</div>
            <div className="text-lg font-bold text-amber-400 mt-1">
              ${Math.round(verificationNodeUsd).toLocaleString()}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">20.00% Oracle Sentinel Attestation</div>
          </div>
          <div className="bg-stone-900 p-3 rounded border border-stone-800">
            <div className="text-xs text-stone-400">Public Resilience Pool (1,000 BPS)</div>
            <div className="text-lg font-bold text-sky-400 mt-1">
              ${Math.round(publicResilienceUsd).toLocaleString()}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">10.00% Community Infrastructure</div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-stone-500">
        Physical remediation verified via Aethexer Sovereign Skin™ PDRG metamaterials (8 – 13 οm Deep-Sky sink).
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ImpactEngine, EMISSION_FACTORS, CONSTRUCTION_EMISSION_FACTORS } from '@/lib/carbon-calculator';
import { useBpsTable } from '@/lib/use-bps-table';
import {
  Calculator, Scale, AlertCircle, Leaf, TrendingUp, ArrowUpRight
} from 'lucide-react';

export default function ImpactCalculationEngine() {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('SOLID_HARDWOOD');
  const [weightKg, setWeightKg] = useState<number>(100);
  const [impactResult, setImpactResult] = useState<ReturnType<typeof ImpactEngine.calculateWithSplit> | null>(null);
  const [calcError, setCalcError] = useState<string>('');
  const bpsTable = useBpsTable();

  const materialCategories = useMemo(() => {
    const categories: Record<string, Array<{ key: string; label: string; factor: number }>> = {};
    Object.entries(CONSTRUCTION_EMISSION_FACTORS).forEach(([key, factor]) => {
      const category = 'CONSTRUCTION';
      if (!categories[category]) categories[category] = [];
      categories[category].push({ key, label: key.replace(/_/g, ' '), factor });
    });
    Object.entries(EMISSION_FACTORS).forEach(([key, data]) => {
      if (!categories[data.category]) categories[data.category] = [];
      categories[data.category].push({ key, label: data.description, factor: data.factor });
    });
    return categories;
  }, []);

  useEffect(() => {
    if (selectedMaterial && weightKg > 0) {
      try {
        const result = ImpactEngine.calculateWithSplit(selectedMaterial, weightKg);
        setImpactResult(result);
        setCalcError('');
      } catch (err: any) {
        setCalcError(err.message);
        setImpactResult(null);
      }
    }
  }, [selectedMaterial, weightKg]);

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Impact Calculation Engine</h3>
          <p className="text-sm text-gray-400">Calculate carbon credits from recycled materials</p>
        </div>
      </div>

      {/* Material & Weight Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Material Type</label>
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-gray-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          >
            {Object.entries(materialCategories).map(([category, materials]) => (
              <optgroup key={category} label={category}>
                {materials.map((mat) => (
                  <option key={mat.key} value={mat.key}>
                    {mat.label} ({mat.factor} kg CO₂e/kg)
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Weight (kg)</label>
          <div className="relative">
            <input
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(Math.max(0, parseFloat(e.target.value) || 0))}
              min="0"
              step="0.1"
              className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-gray-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              placeholder="Enter weight in kg"
            />
            <Scale className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Error */}
      {calcError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400">{calcError}</span>
        </div>
      )}

      {/* Results */}
      {impactResult && (
        <div className="bg-[#0a0a0a] rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Carbon Impact Calculation</span>
            <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Avoided Emissions
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-[#1a1a1a]">
              <p className="text-2xl font-bold text-emerald-400">{impactResult.carbonSavedTonnes.toFixed(4)}</p>
              <p className="text-xs text-gray-500">Tonnes CO₂e</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-[#1a1a1a]">
              <p className="text-2xl font-bold text-cyan-400">${impactResult.valueUsd.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Total Value</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-[#1a1a1a]">
              <p className="text-2xl font-bold text-violet-400">${impactResult.founderYield70.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Asset Sovereign{bpsTable ? ` (${bpsTable.earnerPct}%)` : ''}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-[#1a1a1a]">
              <p className="text-2xl font-bold text-amber-400">${impactResult.publicOverflow10.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Public Resilience{bpsTable ? ` (${bpsTable.depinPct}%)` : ''}</p>
            </div>
          </div>

          {/* Factor Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800 pt-3">
            <span>Factor: {impactResult.emissionFactor} kg CO₂e/kg | Processing: {impactResult.processingCost} kg CO₂e/kg</span>
            <span>Carbon Price: ${impactResult.carbonPricePerTon}/ton</span>
          </div>
        </div>
      )}
    </div>
  );
}

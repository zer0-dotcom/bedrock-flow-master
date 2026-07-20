'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Recycle,
  Scale,
  Leaf,
  Car,
  TreePine,
  Zap,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Shield,
  Factory,
} from 'lucide-react';

type MaterialType = 'ALUMINUM' | 'STEEL' | 'COPPER' | 'BIOCHAR' | 'RAP';
type WeightUnit = 'kg' | 'tonnes';

// 2026 Industrial Carbon Factors (kg CO2e per kg material)
const CARBON_FACTORS: Record<MaterialType, { factor: number; label: string; description: string }> = {
  ALUMINUM: { factor: 9.70, label: 'Aluminum', description: 'Cans, extrusions, scrap' },
  STEEL: { factor: 1.89, label: 'Steel', description: 'Structural, rebar, sheet' },
  COPPER: { factor: 2.80, label: 'Copper', description: 'Wire, pipes, components' },
  BIOCHAR: { factor: 2.87, label: 'Biochar', description: 'Carbon sequestration' },
  RAP: { factor: 0.065, label: 'RAP (Asphalt)', description: 'Reclaimed asphalt pavement' },
};

interface CalculationResult {
  materialType: MaterialType;
  weightKg: number;
  purityPercent: number;
  effectiveWeightKg: number;
  avoidedEmissionsKg: number;
  avoidedEmissionsTonnes: number;
  carsOffRoad: number; // ~4.6 tonnes CO2/car/year
  treesPlanted: number; // ~21 kg CO2/tree/year
  homePowerDays: number; // ~30 kg CO2/day average home
}

function calculateImpact(
  materialType: MaterialType,
  weight: number,
  unit: WeightUnit,
  purity: number
): CalculationResult {
  const weightKg = unit === 'tonnes' ? weight * 1000 : weight;
  const effectiveWeightKg = weightKg * (purity / 100);
  const factor = CARBON_FACTORS[materialType].factor;
  const avoidedEmissionsKg = effectiveWeightKg * factor;
  const avoidedEmissionsTonnes = avoidedEmissionsKg / 1000;

  return {
    materialType,
    weightKg,
    purityPercent: purity,
    effectiveWeightKg,
    avoidedEmissionsKg,
    avoidedEmissionsTonnes,
    carsOffRoad: avoidedEmissionsTonnes / 4.6, // Annual car emissions
    treesPlanted: Math.round(avoidedEmissionsKg / 21), // Tree absorption/year
    homePowerDays: Math.round(avoidedEmissionsKg / 30), // Home power days
  };
}

export default function PublicCalculator() {
  const [materialType, setMaterialType] = useState<MaterialType>('STEEL');
  const [weight, setWeight] = useState<number>(1000);
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [purity, setPurity] = useState<number>(90);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Real-time calculation
  useEffect(() => {
    if (weight > 0) {
      setIsCalculating(true);
      const timer = setTimeout(() => {
        const calc = calculateImpact(materialType, weight, unit, purity);
        setResult(calc);
        setIsCalculating(false);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setResult(null);
    }
  }, [materialType, weight, unit, purity]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Recycle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Bedrock ESG</h1>
              <p className="text-xs text-slate-400">Impact Calculator</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Full Platform →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <Sparkles className="h-4 w-4" />
            2026 Industrial Carbon Factors
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Calculate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Carbon Impact</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            See the real-time environmental impact of recycling materials.
            No signup required.
          </p>
        </div>

        {/* Calculator Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          {/* Input Section */}
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Factory className="h-5 w-5 text-slate-400" />
              Material Details
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Material Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Material Type</label>
                <div className="relative">
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value as MaterialType)}
                    className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    {Object.entries(CARBON_FACTORS).map(([key, { label, description }]) => (
                      <option key={key} value={key}>
                        {label} - {description}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-xs text-slate-500">
                  Factor: {CARBON_FACTORS[materialType].factor} kg CO₂e/kg
                </p>
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Weight</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Enter weight"
                  />
                  <div className="flex rounded-xl border border-slate-700 overflow-hidden">
                    <button
                      onClick={() => setUnit('kg')}
                      className={cn(
                        'px-4 py-3 text-sm font-medium transition-all',
                        unit === 'kg'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800/50 text-slate-400 hover:text-white'
                      )}
                    >
                      kg
                    </button>
                    <button
                      onClick={() => setUnit('tonnes')}
                      className={cn(
                        'px-4 py-3 text-sm font-medium transition-all',
                        unit === 'tonnes'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800/50 text-slate-400 hover:text-white'
                      )}
                    >
                      tonnes
                    </button>
                  </div>
                </div>
              </div>

              {/* Purity */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Purity (%)</label>
                  <span className="text-sm font-bold text-emerald-400">{purity}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={purity}
                  onChange={(e) => setPurity(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full bg-slate-700 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

          {/* Results Section */}
          <div className="p-6 bg-slate-900/30">
            {result ? (
              <div className="space-y-6">
                {/* Main Result */}
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-2">Avoided CO₂ Emissions</p>
                  <div className={cn(
                    'text-5xl md:text-6xl font-bold transition-all duration-300',
                    isCalculating ? 'opacity-50' : 'opacity-100'
                  )}>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                      {result.avoidedEmissionsTonnes >= 1
                        ? result.avoidedEmissionsTonnes.toFixed(2)
                        : result.avoidedEmissionsKg.toFixed(1)}
                    </span>
                    <span className="text-xl text-slate-400 ml-2">
                      {result.avoidedEmissionsTonnes >= 1 ? 'tonnes' : 'kg'} CO₂e
                    </span>
                  </div>
                </div>

                {/* Conversion Visuals */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Cars off Road */}
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 mb-3">
                      <Car className="h-6 w-6 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-blue-400">
                      {result.carsOffRoad >= 1
                        ? result.carsOffRoad.toFixed(1)
                        : (result.carsOffRoad * 12).toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {result.carsOffRoad >= 1 ? 'Cars off road (1 year)' : 'Car-months avoided'}
                    </p>
                  </div>

                  {/* Trees Planted */}
                  <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-3">
                      <TreePine className="h-6 w-6 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-green-400">
                      {result.treesPlanted.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">Trees planted equivalent</p>
                  </div>

                  {/* Home Power */}
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mb-3">
                      <Zap className="h-6 w-6 text-amber-400" />
                    </div>
                    <p className="text-2xl font-bold text-amber-400">
                      {result.homePowerDays.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">Days of home power</p>
                  </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="rounded-xl bg-slate-800/30 p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Input Weight</span>
                    <span>{weight.toLocaleString()} {unit}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Effective Weight (at {purity}% purity)</span>
                    <span>{result.effectiveWeightKg.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Carbon Factor ({CARBON_FACTORS[materialType].label})</span>
                    <span>{CARBON_FACTORS[materialType].factor} kg CO₂e/kg</span>
                  </div>
                  <div className="h-px bg-slate-700 my-2" />
                  <div className="flex justify-between font-medium text-white">
                    <span>Total Avoided Emissions</span>
                    <span>{result.avoidedEmissionsKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO₂e</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter material details to see your impact</p>
              </div>
            )}
          </div>
        </div>

        {/* Lead Magnet CTA */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-6 md:p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-2">
            <Shield className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white">
            Verified this batch?
          </h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Join Bedrock ESG to mint your verified recycling data as <strong className="text-emerald-400">Carbon Credits</strong> on the blockchain.
            Get certified, earn credits, and contribute to a sustainable future.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/signup/agent"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              <Leaf className="h-5 w-5" />
              Join Bedrock ESG
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800/50 transition-colors"
            >
              Explore Platform
            </Link>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            World Steel Association Factors
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            IAI Aluminum Standards
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            EPA GHG Equivalencies
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          <p>© 2026 Bedrock ESG. Circular Trifecta Carbon Platform.</p>
        </div>
      </footer>
    </div>
  );
}

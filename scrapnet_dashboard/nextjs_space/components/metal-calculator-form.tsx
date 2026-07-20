'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Scale, Leaf, TreePine, Car, Save, Calculator, AlertCircle } from 'lucide-react';
import { METAL_DESCRIPTIONS } from '@/lib/metal-calculator';

type MetalType = 'STEEL' | 'ALUMINUM' | 'COPPER' | 'BRASS' | 'STAINLESS' | 'MIXED' | 'OTHER';

interface CalculationResult {
  metalType: MetalType;
  weightKg: number;
  purityPercent: number;
  effectiveWeightKg: number;
  emissionFactor: number;
  avoidedEmissionsKg: number;
  avoidedEmissionsTonnes: number;
  equivalentTreesPlanted: number;
  equivalentCarMilesAvoided: number;
  blockchainMetadata: {
    timestamp: string;
    calculationVersion: string;
    metalType: string;
    emissionFactor: number;
    verificationHash: string;
  };
}

const metalTypes: MetalType[] = ['STEEL', 'ALUMINUM', 'COPPER', 'BRASS', 'STAINLESS', 'MIXED', 'OTHER'];

export default function MetalCalculatorForm() {
  const [formData, setFormData] = useState({
    metalType: 'STEEL' as MetalType,
    weightKg: 1000,
    purityPercent: 90,
    sourceDescription: '',
    sourceGps: '',
    notes: '',
  });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/metal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'calculate', ...formData }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.calculation);
      } else {
        setError(data.error || 'Calculation failed');
      }
    } catch {
      setError('Failed to calculate');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/metal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', ...formData }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Form */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-cyan-500" />
          Recovery Details
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Metal Type</label>
            <select
              value={formData.metalType}
              onChange={(e) => setFormData({ ...formData, metalType: e.target.value as MetalType })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {metalTypes.map((type) => (
                <option key={type} value={type}>
                  {type} - {METAL_DESCRIPTIONS[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Weight (kg)</label>
            <input
              type="number"
              min="1"
              value={formData.weightKg}
              onChange={(e) => setFormData({ ...formData, weightKg: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Purity (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.purityPercent}
              onChange={(e) => setFormData({ ...formData, purityPercent: parseFloat(e.target.value) || 90 })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <p className="text-xs text-muted-foreground mt-1">Metal purity percentage (affects effective weight)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Source Description (optional)</label>
            <input
              type="text"
              value={formData.sourceDescription}
              onChange={(e) => setFormData({ ...formData, sourceDescription: e.target.value })}
              placeholder="e.g., Construction site demolition"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <button
            onClick={handleCalculate}
            disabled={loading || formData.weightKg <= 0}
            className={cn(
              'w-full rounded-lg px-4 py-3 font-medium text-white transition-colors',
              'bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? 'Calculating...' : 'Calculate Avoided Emissions'}
          </button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-500" />
          Calculation Results
        </h3>

        {result ? (
          <div className="space-y-4">
            {/* Main Result */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 text-center">
              <p className="text-sm text-muted-foreground">Avoided CO₂ Emissions</p>
              <p className="text-4xl font-bold text-cyan-500">
                {result.avoidedEmissionsTonnes.toFixed(3)}
              </p>
              <p className="text-lg text-cyan-400">tonnes CO₂e</p>
            </div>

            {/* Details */}
            <div className="grid gap-3 grid-cols-2">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Effective Weight</p>
                <p className="font-semibold">{result.effectiveWeightKg.toFixed(1)} kg</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Emission Factor</p>
                <p className="font-semibold">{result.emissionFactor} kg/kg</p>
              </div>
            </div>

            {/* Equivalencies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                <span className="text-sm flex items-center gap-2">
                  <TreePine className="h-4 w-4 text-green-500" /> Trees Planted
                </span>
                <span className="font-bold text-green-500">
                  {result.equivalentTreesPlanted.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                <span className="text-sm flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-500" /> Car Miles Avoided
                </span>
                <span className="font-bold text-blue-500">
                  {result.equivalentCarMilesAvoided.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Blockchain Metadata */}
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Verification Hash</p>
              <p className="font-mono text-xs break-all">
                {result.blockchainMetadata.verificationHash}
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={cn(
                'w-full rounded-lg px-4 py-3 font-medium text-white transition-colors flex items-center justify-center gap-2',
                saved
                  ? 'bg-green-600'
                  : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50'
              )}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : saved ? 'Saved to Recovery Log' : 'Save to Recovery Log'}
            </button>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter recovery details and calculate to see results</p>
          </div>
        )}
      </div>
    </div>
  );
}

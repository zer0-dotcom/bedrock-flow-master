'use client';

import { useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StatusBadge } from '@/components/ui/status-badge';
import { CalculatorResult } from '@/lib/types';
import { cn, downloadJson, getCarbonScoreBgColor, getCarbonScoreColor } from '@/lib/utils';
import {
  Calculator,
  Leaf,
  Save,
  Download,
  CheckCircle2,
  XCircle,
  Gauge,
  Truck,
  Layers,
  FileJson,
} from 'lucide-react';

export default function CalculatorForm() {
  const [formData, setFormData] = useState({
    plannedTonnage: '',
    targetRapPercentage: '',
    tripDistance: '',
    mixType: 'HMA' as 'HMA' | 'WMA',
    layerType: 'surface' as 'surface' | 'base',
    carbonCap: '60',
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleCalculate = async () => {
    setLoading(true);
    setProgress('Initializing calculation...');
    setResult(null);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plannedTonnage: parseFloat(formData.plannedTonnage),
          targetRapPercentage: parseFloat(formData.targetRapPercentage),
          tripDistance: parseFloat(formData.tripDistance),
          mixType: formData.mixType,
          layerType: formData.layerType,
          carbonCap: parseFloat(formData.carbonCap) || 60,
        }),
      });

      if (!response.ok) throw new Error('Calculation failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let partialRead = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split('\n');
        partialRead = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.status === 'processing') {
                setProgress(parsed.message || 'Processing...');
              } else if (parsed.status === 'completed') {
                setResult(parsed.result);
                setProgress('');
                setLoading(false);
                return;
              } else if (parsed.status === 'error') {
                throw new Error(parsed.message || 'Calculation failed');
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleSave = async () => {
    if (!result) return;

    setSaving(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: result.project_id,
          plannedTonnage: formData.plannedTonnage,
          targetRapPercentage: formData.targetRapPercentage,
          tripDistance: formData.tripDistance,
          mixType: formData.mixType,
          layerType: formData.layerType,
          carbonCap: formData.carbonCap,
          predictedCo2Emissions: result.predicted_co2_emissions,
          optimalRapPercentage: result.optimal_rap_percentage,
          carbonScore: result.carbon_score,
          tonsCo2Saved: result.tons_co2_saved,
          mixRecommendation: result.mix_recommendation,
          meetsGreenTarget: result.meets_green_target,
          carbonCapCompliance: result.carbon_cap_compliance,
          gpsCoordinates: result.gps_coordinates,
          blockchainTimestamp: result.timestamp,
          blockchainJson: JSON.stringify(result),
        }),
      });

      if (!response.ok) throw new Error('Failed to save project');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    downloadJson(result, `carbon-project-${result.project_id}.json`);
  };

  const maxRap = formData.layerType === 'surface' ? 25 : 40;
  const rapWarning = parseFloat(formData.targetRapPercentage) > maxRap;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Form */}
      <div className="rounded-xl border bg-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <Calculator className="h-5 w-5 text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold">Project Parameters</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Planned Tonnage
            </label>
            <input
              type="number"
              name="plannedTonnage"
              value={formData.plannedTonnage}
              onChange={handleInputChange}
              placeholder="e.g., 5000"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Leaf className="h-4 w-4 text-muted-foreground" />
              Target RAP %
            </label>
            <input
              type="number"
              name="targetRapPercentage"
              value={formData.targetRapPercentage}
              onChange={handleInputChange}
              placeholder="e.g., 20"
              className={cn(
                'w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-1',
                rapWarning
                  ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500'
                  : 'focus:border-emerald-500 focus:ring-emerald-500'
              )}
            />
            {rapWarning && (
              <p className="text-xs text-amber-500">
                Warning: Max RAP for {formData.layerType} is {maxRap}%
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              Trip Distance (km)
            </label>
            <input
              type="number"
              name="tripDistance"
              value={formData.tripDistance}
              onChange={handleInputChange}
              placeholder="e.g., 50"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mix Type</label>
            <select
              name="mixType"
              value={formData.mixType}
              onChange={handleInputChange}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="HMA">HMA (Hot Mix Asphalt)</option>
              <option value="WMA">WMA (Warm Mix Asphalt)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Layer Type</label>
            <select
              name="layerType"
              value={formData.layerType}
              onChange={handleInputChange}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="surface">Surface (Max RAP: 25%)</option>
              <option value="base">Base (Max RAP: 40%)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              Carbon Cap (kg/ton)
            </label>
            <input
              type="number"
              name="carbonCap"
              value={formData.carbonCap}
              onChange={handleInputChange}
              placeholder="60"
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading || !formData.plannedTonnage || !formData.targetRapPercentage || !formData.tripDistance}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              {progress || 'Calculating...'}
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4" />
              Calculate Carbon Score
            </>
          )}
        </button>

        {error && (
          <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}
      </div>

      {/* Results Panel */}
      <div className="rounded-xl border bg-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Gauge className="h-5 w-5 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold">Results</h2>
          </div>
          {result && (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {saving ? <LoadingSpinner size="sm" /> : <Save className="h-3.5 w-3.5" />}
                {saved ? 'Saved!' : 'Save Project'}
              </button>
              <button
                onClick={handleExport}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Export JSON
              </button>
            </div>
          )}
        </div>

        {result ? (
          <div className="space-y-4">
            {/* Carbon Score */}
            <div className={cn(
              'rounded-xl p-6 text-center',
              getCarbonScoreBgColor(result.carbon_score)
            )}>
              <p className="text-sm font-medium text-muted-foreground">Carbon Score</p>
              <p className={cn('text-5xl font-bold mt-1', getCarbonScoreColor(result.carbon_score))}>
                {result.carbon_score?.toFixed?.(1) ?? '0'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">kg CO₂ / ton</p>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                status={result.meets_green_target ? 'success' : 'warning'}
                label={result.meets_green_target ? 'Meets Green Target' : 'Above Green Target'}
              />
              <StatusBadge
                status={result.carbon_cap_compliance ? 'success' : 'error'}
                label={result.carbon_cap_compliance ? 'Within Carbon Cap' : 'Exceeds Carbon Cap'}
              />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Predicted CO₂ Emissions</p>
                <p className="text-xl font-bold">{result.predicted_co2_emissions?.toFixed?.(2) ?? '0'}</p>
                <p className="text-xs text-muted-foreground">tonnes</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Carbon Saved vs Baseline</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {result.tons_co2_saved?.toFixed?.(2) ?? '0'}
                </p>
                <p className="text-xs text-muted-foreground">tonnes CO₂</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Optimal RAP %</p>
                <p className="text-xl font-bold">{result.optimal_rap_percentage?.toFixed?.(1) ?? '0'}%</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Project ID</p>
                <p className="text-sm font-mono truncate">{result.project_id?.slice?.(0, 8) ?? 'N/A'}...</p>
              </div>
            </div>

            {/* Mix Recommendation */}
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">Mix Recommendation</p>
              <p className="text-sm text-muted-foreground">{result.mix_recommendation || 'N/A'}</p>
            </div>

            {/* Blockchain JSON */}
            <div className="rounded-lg border">
              <button
                onClick={() => {
                  const el = document.getElementById('blockchain-json');
                  if (el) el.classList.toggle('hidden');
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Blockchain-Ready JSON</span>
                </div>
                <span className="text-xs text-muted-foreground">Click to toggle</span>
              </button>
              <div id="blockchain-json" className="hidden border-t p-4">
                <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Gauge className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Enter project parameters and click Calculate</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Results will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

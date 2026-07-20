'use client';

import { useState, useEffect } from 'react';
import { Flame, Thermometer, Beaker, MapPin, Download, Save, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { cn, formatNumber, downloadJson } from '@/lib/utils';
import { BiocharCalculatorResult, FeedstockType, FarmerData, isTemperatureCompliant } from '@/lib/types';

const feedstockOptions: { value: FeedstockType; label: string; carbon: number }[] = [
  { value: 'agricultural_waste', label: 'Agricultural Waste', carbon: 42 },
  { value: 'wood_chips', label: 'Wood Chips / Sawdust', carbon: 48 },
  { value: 'used_soil', label: 'Used Soil / Compost', carbon: 35 },
  { value: 'crop_residues', label: 'Crop Residues', carbon: 45 },
];

export default function BiocharCalculatorForm() {
  const [formData, setFormData] = useState({
    feedstockType: 'agricultural_waste' as FeedstockType,
    dryWeightKg: 1000,
    moistureContentPercent: 15,
    pyrolysisTempCelsius: 550,
    hCorgRatio: 0.35,
    farmerId: '',
    gpsCoordinates: '',
  });

  const [result, setResult] = useState<BiocharCalculatorResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [farmers, setFarmers] = useState<FarmerData[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/farmers')
      .then((res) => res.json())
      .then((data) => setFarmers(Array.isArray(data) ? data : []))
      .catch(() => setFarmers([]));
  }, []);

  const handleCalculate = async () => {
    setIsLoading(true);
    setResult(null);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/biochar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'calculate', ...formData }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/biochar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', ...formData }),
      });

      if (response.ok) {
        setSaveMessage('Batch saved successfully!');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage('Failed to save batch');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportGuardian = () => {
    if (!result) return;
    downloadJson(result.hedera_guardian_metadata, `guardian-${result.batch_id}.json`);
  };

  const getTempColor = (temp: number) => {
    if (temp < 400 || temp > 700) return 'text-red-500';
    if (temp >= 500 && temp <= 600) return 'text-emerald-500';
    return 'text-amber-500';
  };

  const getStabilityColor = (stability: string) => {
    switch (stability) {
      case 'high': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <Flame className="h-5 w-5 text-amber-500" />
          Biochar Production Parameters
        </h2>

        <div className="space-y-5">
          {/* Feedstock Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Feedstock Type
            </label>
            <select
              value={formData.feedstockType}
              onChange={(e) => setFormData({ ...formData, feedstockType: e.target.value as FeedstockType })}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {feedstockOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.carbon}% carbon)
                </option>
              ))}
            </select>
          </div>

          {/* Dry Weight */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Dry Weight (kg)
            </label>
            <input
              type="number"
              value={formData.dryWeightKg}
              onChange={(e) => setFormData({ ...formData, dryWeightKg: parseFloat(e.target.value) || 0 })}
              min={0}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Moisture Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Moisture Content (%)
            </label>
            <input
              type="number"
              value={formData.moistureContentPercent}
              onChange={(e) => setFormData({ ...formData, moistureContentPercent: parseFloat(e.target.value) || 0 })}
              min={0}
              max={50}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Pyrolysis Temperature */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-2">
                <Thermometer className={cn('h-4 w-4', getTempColor(formData.pyrolysisTempCelsius))} />
                Pyrolysis Temperature (°C)
                {!isTemperatureCompliant(formData.pyrolysisTempCelsius) && (
                  <span className="text-xs text-red-500 ml-1">⚠ Out of range</span>
                )}
              </div>
            </label>
            <input
              type="number"
              value={formData.pyrolysisTempCelsius}
              onChange={(e) => setFormData({ ...formData, pyrolysisTempCelsius: parseFloat(e.target.value) || 0 })}
              min={300}
              max={800}
              className={cn(
                "w-full rounded-lg border px-4 py-2.5 focus:ring-2 dark:bg-slate-800 dark:text-white",
                isTemperatureCompliant(formData.pyrolysisTempCelsius)
                  ? "border-slate-300 bg-white text-slate-900 focus:border-amber-500 focus:ring-amber-500/20 dark:border-slate-700"
                  : "border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
              )}
            />
            <p className={cn(
              "mt-1 text-xs",
              isTemperatureCompliant(formData.pyrolysisTempCelsius) ? "text-slate-500" : "text-red-500"
            )}>
              {isTemperatureCompliant(formData.pyrolysisTempCelsius) 
                ? "Compliant range: 400-700°C. Higher temps = higher carbon stability."
                : "Temperature must be between 400-700°C for credits to be issued."
              }
            </p>
          </div>

          {/* H:Corg Ratio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-2">
                <Beaker className="h-4 w-4 text-amber-500" />
                H:Corg Ratio
              </div>
            </label>
            <input
              type="number"
              value={formData.hCorgRatio}
              onChange={(e) => setFormData({ ...formData, hCorgRatio: parseFloat(e.target.value) || 0 })}
              min={0.1}
              max={1.0}
              step={0.01}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">
              Lower is better. &lt;0.4 = High stability (100+ years)
            </p>
          </div>

          {/* Farmer Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Feedstock Supplier (Farmer)
            </label>
            <select
              value={formData.farmerId}
              onChange={(e) => setFormData({ ...formData, farmerId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">-- No Farmer Linked --</option>
              {farmers.map((farmer) => (
                <option key={farmer.id} value={farmer.id}>
                  {farmer.name} {farmer.farmName ? `(${farmer.farmName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* GPS Coordinates */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-500" />
                Feedstock Source GPS
              </div>
            </label>
            <input
              type="text"
              value={formData.gpsCoordinates}
              onChange={(e) => setFormData({ ...formData, gpsCoordinates: e.target.value })}
              placeholder="e.g., 34.0522,-118.2437"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Temperature validation warning */}
          {!isTemperatureCompliant(formData.pyrolysisTempCelsius) && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Temperature must be 400-700°C to calculate credits
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleCalculate}
            disabled={isLoading || !isTemperatureCompliant(formData.pyrolysisTempCelsius)}
            className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Calculating...' : 'Calculate CDR Credits'}
          </button>
        </div>
      </div>

      {/* Results Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">
          CDR Calculation Results
        </h2>

        {!result ? (
          <div className="flex h-64 items-center justify-center text-slate-400">
            <p>Enter parameters and calculate to see results</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main CDR Credits */}
            <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 text-center">
              <p className="text-sm text-amber-600 dark:text-amber-400">CDR Credits Generated</p>
              <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                {formatNumber(result.cdr_credits_tonnes, 4)}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">tonnes CO₂ equivalent</p>
            </div>

            {/* Stability Badge */}
            <div className="flex items-center justify-center">
              <span className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium',
                getStabilityColor(result.stability_class)
              )}>
                {result.stability_class === 'high' && <CheckCircle2 className="h-4 w-4" />}
                {result.stability_class === 'medium' && <Clock className="h-4 w-4" />}
                {result.stability_class === 'low' && <AlertTriangle className="h-4 w-4" />}
                {result.stability_class.toUpperCase()} STABILITY
              </span>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs text-slate-500">Biochar Yield</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {formatNumber(result.biochar_yield_kg, 2)} kg
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs text-slate-500">Permanence</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {result.permanence_years}+ years
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs text-slate-500">Effective Dry Weight</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {formatNumber(result.effective_dry_weight_kg, 2)} kg
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs text-slate-500">Farmer Credit (60%)</p>
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatNumber(result.farmer_credit_amount, 4)} t
                </p>
              </div>
            </div>

            {/* Certificate Metadata */}
            {result.certificate_metadata && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium">Certificate Metadata</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Batch ID:</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">
                      {result.certificate_metadata.batch_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stability Class:</span>
                    <span className={cn(
                      'font-medium',
                      result.certificate_metadata.stability_class === 'High' ? 'text-emerald-600' :
                      result.certificate_metadata.stability_class === 'Medium' ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {result.certificate_metadata.stability_class}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Permanence:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {result.certificate_metadata.permanence_years} years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Farmer ID:</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {result.certificate_metadata.farmer_id || 'N/A'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 text-xs">Verification Hash:</span>
                    <p className="font-mono text-xs text-slate-600 dark:text-slate-400 break-all mt-1">
                      {result.certificate_metadata.verification_hash}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Process Warnings</span>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                  {result.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Process Compliance */}
            <div className={cn(
              'rounded-lg p-4 text-center',
              result.process_compliant
                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            )}>
              {result.process_compliant ? (
                <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Process Compliant</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Non-Compliant Process</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-amber-500 px-4 py-2.5 font-medium text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Batch'}
              </button>
              <button
                onClick={handleExportGuardian}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Download className="h-4 w-4" />
                Export Guardian JSON
              </button>
            </div>

            {saveMessage && (
              <p className={cn(
                'text-center text-sm',
                saveMessage.includes('success') ? 'text-emerald-600' : 'text-red-600'
              )}>
                {saveMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

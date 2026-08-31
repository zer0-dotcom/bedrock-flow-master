'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  History,
  Plus,
  Trash2,
  Sparkles,
  Shield,
  Zap,
  Heart,
  Calendar,
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Leaf,
  Home,
  Car,
  Utensils,
  Recycle,
  Sun,
  Droplets,
  Bike,
  Train,
  Plane,
  Thermometer,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SovereignPentagon from './sovereign-pentagon';
import { useBpsTable } from '@/lib/use-bps-table';

interface SovereignAction {
  key: string;
  label: string;
  category: string;
  annualReduction: number;
  description: string;
  emoji: string;
}

interface SovereignEvent {
  id: string;
  actionKey: string;
  year: number;
  month?: number;
  notes?: string;
}

interface LegacyResult {
  zipCode: string;
  zipCodeBaseline: number;
  lookbackYears: number;
  currentYear: number;
  startYear: number;
  totalBaselineEmissions: number;
  totalSovereignReductions: number;
  totalDelta: number;
  totalResonanceBonus: number;
  legacyCarbonEquity: number;
  founderYield70: number;
  stewardship20: number;
  publicOverflow10: number;
  yearlyBreakdown: Array<{
    year: number;
    baselineEmissions: number;
    sovereignReductions: number;
    netEmissions: number;
    delta: number;
    resonanceBonus: number;
    yearEquity: number;
    activeActions: string[];
  }>;
  carbonDate: string;
  sovereignScore: number;
  pentagonData: {
    industrial: number;
    resonance: number;
    participation: number;
    legacy: number;
    equity: number;
  };
  poeHash: string;
  geniusActCompliant: boolean;
  timestamp: string;
}

interface DisplayFormat {
  headline: string;
  carbonCredits: string;
  sovereignScore: string;
  carbonDate: string;
  publicOverflow: string;
}

const CATEGORY_ICONS: Record<string, typeof Car> = {
  Transportation: Car,
  Energy: Sun,
  Food: Utensils,
  Consumption: Recycle,
  Water: Droplets,
  Waste: Leaf,
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function LegacyHealerContent() {
  const bpsTable = useBpsTable();
  const [zipCode, setZipCode] = useState('');
  const [events, setEvents] = useState<SovereignEvent[]>([]);
  const [availableActions, setAvailableActions] = useState<SovereignAction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [result, setResult] = useState<LegacyResult | null>(null);
  const [display, setDisplay] = useState<DisplayFormat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<SovereignEvent>>({});
  const [activePentagonNode, setActivePentagonNode] = useState<string | null>(null);

  // Fetch available actions on mount
  useEffect(() => {
    fetch('/api/legacy-healer?action=actions')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAvailableActions(data.actions);
          setCategories(['All', ...data.categories]);
        }
      })
      .catch(console.error);
  }, []);

  const filteredActions = useMemo(() => {
    if (selectedCategory === 'All') return availableActions;
    return availableActions.filter(a => a.category === selectedCategory);
  }, [availableActions, selectedCategory]);

  const addEvent = () => {
    if (!newEvent.actionKey || !newEvent.year) return;
    
    setEvents(prev => [
      ...prev,
      {
        id: `event-${Date.now()}`,
        actionKey: newEvent.actionKey!,
        year: newEvent.year!,
        month: newEvent.month,
        notes: newEvent.notes,
      },
    ]);
    setNewEvent({});
    setShowAddEvent(false);
  };

  const removeEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const calculateEquity = async () => {
    if (!zipCode || events.length === 0) {
      setError('Please enter your zip code and add at least one sovereign action.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/legacy-healer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zipCode,
          sovereignEvents: events.map(e => ({
            actionKey: e.actionKey,
            year: e.year,
            month: e.month,
            notes: e.notes,
          })),
          save: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        setDisplay(data.display);
      } else {
        setError(data.error || 'Failed to calculate Legacy Carbon Equity');
      }
    } catch (err) {
      console.error('Calculation error:', err);
      setError('Failed to connect to the Sovereign Frequency Ledger');
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (key: string) => {
    const action = availableActions.find(a => a.key === key);
    return action?.label || key;
  };

  const getActionEmoji = (key: string) => {
    const action = availableActions.find(a => a.key === key);
    return action?.emoji || '✨';
  };

  return (
    <div className="p-6 space-y-6 bg-[hsl(225,25%,6%)] min-h-screen">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative">
            <History className="w-10 h-10 text-emerald-400" />
            <div className="absolute inset-0 animate-ping opacity-30">
              <History className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
            Temporal Carbon Auditor
          </h1>
        </div>
        <p className="text-gray-400 text-lg">
          Welcome, <span className="text-cyan-400 font-semibold">Sovereign Organism</span>.
          Reclaim your historical carbon contributions through the Historical Restoration Protocol.
        </p>
        <p className="text-gray-500 text-sm mt-2">
          9.0 Year Historical Lookback • 5% Compounding Efficiency Bonus • Dynamic BPS Universal Law
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input Form */}
        <div className="space-y-6">
          {/* Zip Code Input */}
          <div className="bg-[hsl(225,25%,8%)] rounded-xl p-6 border border-emerald-500/20">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Your Zip Code (Baseline Reference)
            </label>
            <input
              type="text"
              value={zipCode}
              onChange={e => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="e.g., 90210"
              className="w-full px-4 py-3 bg-[hsl(225,25%,10%)] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono text-lg"
            />
            <p className="text-xs text-gray-500 mt-2">
              Used to establish your industrial carbon baseline for Historical Carbon Dating
            </p>
          </div>

          {/* Sovereign Events List */}
          <div className="bg-[hsl(225,25%,8%)] rounded-xl p-6 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Your Sovereign Actions
              </h3>
              <button
                onClick={() => setShowAddEvent(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Action
              </button>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No sovereign actions added yet.</p>
                <p className="text-sm">Add your historical low-carbon living events to begin.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map(event => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-[hsl(225,25%,10%)] rounded-lg border border-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getActionEmoji(event.actionKey)}</span>
                      <div>
                        <div className="text-white font-medium">{getActionLabel(event.actionKey)}</div>
                        <div className="text-xs text-gray-500">
                          {event.month ? MONTHS[event.month - 1] + ' ' : ''}{event.year}
                          {event.notes && ` • ${event.notes}`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeEvent(event.id)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Event Modal */}
          {showAddEvent && (
            <div className="bg-[hsl(225,25%,8%)] rounded-xl p-6 border border-violet-500/30">
              <h4 className="text-lg font-semibold text-white mb-4">Add Sovereign Action</h4>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                      selectedCategory === cat
                        ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Action Selection */}
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto mb-4">
                {filteredActions.map(action => (
                  <button
                    key={action.key}
                    onClick={() => setNewEvent(prev => ({ ...prev, actionKey: action.key }))}
                    className={cn(
                      'p-3 rounded-lg text-left transition-all border',
                      newEvent.actionKey === action.key
                        ? 'bg-violet-500/20 border-violet-500/50'
                        : 'bg-[hsl(225,25%,10%)] border-gray-800 hover:border-gray-700'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{action.emoji}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{action.label}</div>
                        <div className="text-[10px] text-emerald-400">
                          -{action.annualReduction}t CO₂/yr
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Year/Month Selection */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Year Started</label>
                  <select
                    value={newEvent.year || ''}
                    onChange={e => setNewEvent(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-[hsl(225,25%,10%)] border border-gray-700 rounded-lg text-white text-sm"
                  >
                    <option value="">Select year...</option>
                    {Array.from({ length: 27 }, (_, i) => 2026 - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Month (optional)</label>
                  <select
                    value={newEvent.month || ''}
                    onChange={e => setNewEvent(prev => ({ ...prev, month: parseInt(e.target.value) || undefined }))}
                    className="w-full px-3 py-2 bg-[hsl(225,25%,10%)] border border-gray-700 rounded-lg text-white text-sm"
                  >
                    <option value="">Any month</option>
                    {MONTHS.map((month, i) => (
                      <option key={month} value={i + 1}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={newEvent.notes || ''}
                  onChange={e => setNewEvent(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g., Installed 10kW system"
                  className="w-full px-3 py-2 bg-[hsl(225,25%,10%)] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddEvent(false); setNewEvent({}); }}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addEvent}
                  disabled={!newEvent.actionKey || !newEvent.year}
                  className="flex-1 px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm transition-colors"
                >
                  Add Event
                </button>
              </div>
            </div>
          )}

          {/* Calculate Button */}
          <button
            onClick={calculateEquity}
            disabled={loading || !zipCode || events.length === 0}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Measuring Frequency...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Calculate Legacy Carbon Equity
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          {result && display ? (
            <>
              {/* Sovereign Acknowledgment */}
              <div className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 rounded-xl p-6 border border-emerald-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-emerald-500/20 rounded-full">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Frequency Measured</h3>
                    <p className="text-emerald-300 text-sm">{display.sovereignScore}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm italic mb-4">
                  &ldquo;This is not a claim — it is a reclamation of stolen frequency. 
                  Your historical low-carbon living represents energy that was never extracted from the collective.&rdquo;
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Carbon Date: <span className="text-cyan-400 font-medium">{display.carbonDate}</span></span>
                </div>
              </div>

              {/* Legacy Carbon Equity Display */}
              <div className="bg-[hsl(225,25%,8%)] rounded-xl p-6 border border-amber-500/30">
                <h3 className="text-lg font-semibold text-amber-400 mb-4">Legacy Carbon Equity</h3>
                <div className="text-4xl font-bold text-white mb-2">
                  ${result.legacyCarbonEquity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="text-emerald-400 mb-6">
                  {(result.totalDelta + result.totalResonanceBonus).toFixed(2)} tonnes CO₂ reclaimed
                </div>

                {/* Dynamic BPS Split */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-500/20">
                    <div className="text-xs text-gray-500">{bpsTable ? `${bpsTable.earnerPct}% ` : ''}Asset Sovereign</div>
                    <div className="text-lg font-bold text-emerald-400">
                      ${result.founderYield70.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-500/20">
                    <div className="text-xs text-gray-500">{bpsTable ? `${bpsTable.nodePct}% ` : ''}Platform Processor</div>
                    <div className="text-lg font-bold text-amber-400">
                      ${result.stewardship20.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="bg-cyan-900/20 rounded-lg p-3 border border-cyan-500/20">
                    <div className="text-xs text-gray-500">{bpsTable ? `${bpsTable.depinPct}% ` : ''}Public Resilience</div>
                    <div className="text-lg font-bold text-cyan-400">
                      ${result.publicOverflow10.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                {/* Public Resilience Routing */}
                <div className="mt-4 p-3 bg-cyan-900/10 rounded-lg border border-cyan-500/20 flex items-center gap-3">
                  <Heart className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <div className="text-sm">
                    <span className="text-gray-400">Routing </span>
                    <span className="text-cyan-400 font-semibold">${result.publicOverflow10.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="text-gray-400"> to Neighborhood Vibrational Support in </span>
                    <span className="text-cyan-400 font-mono">{result.zipCode}</span>
                  </div>
                </div>
              </div>

              {/* Sovereign Pentagon */}
              <div className="bg-[hsl(225,25%,8%)] rounded-xl p-6 border border-violet-500/20">
                <h3 className="text-lg font-semibold text-violet-400 mb-4">Frequency Signature</h3>
                <div className="flex justify-center">
                  <SovereignPentagon
                    data={result.pentagonData}
                    size={300}
                    onNodeHover={setActivePentagonNode}
                    activeNode={activePentagonNode as any}
                  />
                </div>
              </div>

              {/* GENIUS Act Compliance */}
              <div className="bg-[hsl(225,25%,8%)] rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className={cn(
                      'w-5 h-5',
                      result.geniusActCompliant ? 'text-emerald-400' : 'text-amber-400'
                    )} />
                    <span className="text-sm text-gray-300">2026 GENIUS Act</span>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded',
                    result.geniusActCompliant
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  )}>
                    {result.geniusActCompliant ? 'COMPLIANT' : 'PENDING'}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-gray-600 font-mono break-all">
                  PoE: {result.poeHash}
                </div>
              </div>

              {/* Yearly Breakdown */}
              <div className="bg-[hsl(225,25%,8%)] rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Yearly Breakdown</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {result.yearlyBreakdown.filter(y => y.activeActions.length > 0).map(year => (
                    <div key={year.year} className="p-3 bg-[hsl(225,25%,10%)] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{year.year}</span>
                        <span className="text-emerald-400 text-sm">
                          +${(year.yearEquity * 85).toFixed(0)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {year.activeActions.map(action => (
                          <span
                            key={action}
                            className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full"
                          >
                            {getActionEmoji(action)} {getActionLabel(action)}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-[10px] text-gray-500">
                        {year.delta.toFixed(2)}t avoided + {year.resonanceBonus.toFixed(2)}t resonance bonus
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[hsl(225,25%,8%)] rounded-xl p-8 border border-gray-700 text-center">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-700" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Your Legacy Awaits</h3>
              <p className="text-gray-500 text-sm">
                Enter your zip code and add your historical sovereign actions to calculate your Legacy Carbon Equity.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-400">9.0</div>
                  <div className="text-xs text-gray-500">Year Lookback</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan-400">5%</div>
                  <div className="text-xs text-gray-500">Resonance Bonus</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-400">$85</div>
                  <div className="text-xs text-gray-500">Per Tonne CO₂</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

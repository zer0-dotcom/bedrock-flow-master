/**
 * Temporal Carbon Auditor & Legacy Healer
 * 
 * Core logic engine for homieprice.com
 * Converts human life-history into Backdated Carbon Credits
 * and integrates them into the Sovereign Frequency Ledger.
 */

// Standard industrial carbon baselines by zip code prefix (tonnes CO2/year)
const ZIP_CODE_BASELINES: Record<string, number> = {
  '900': 16.5,  // Los Angeles area
  '901': 16.2,
  '902': 15.8,
  '100': 14.2,  // NYC area
  '101': 14.0,
  '606': 15.5,  // Chicago area
  '303': 17.2,  // Atlanta area
  '752': 18.5,  // Dallas area
  '850': 16.8,  // Phoenix area
  '331': 15.9,  // Miami area
  '981': 13.2,  // Seattle area
  'default': 16.0,  // National average
};

// Sovereign Action carbon reduction values (tonnes CO2/year avoided)
export const SOVEREIGN_ACTIONS: Record<string, {
  label: string;
  category: string;
  annualReduction: number;
  description: string;
  emoji: string;
}> = {
  'stopped_driving': {
    label: 'Stopped Driving',
    category: 'Transportation',
    annualReduction: 4.6,
    description: 'Eliminated personal vehicle emissions',
    emoji: '🚗',
  },
  'ev_adoption': {
    label: 'Switched to Electric Vehicle',
    category: 'Transportation',
    annualReduction: 2.8,
    description: 'Reduced tailpipe emissions to zero',
    emoji: '⚡',
  },
  'home_solar': {
    label: 'Home Solar Installed',
    category: 'Energy',
    annualReduction: 3.5,
    description: 'Clean energy generation at source',
    emoji: '☀️',
  },
  'plant_based_diet': {
    label: 'Adopted Plant-Based Diet',
    category: 'Food',
    annualReduction: 1.5,
    description: 'Eliminated livestock-related emissions',
    emoji: '🌱',
  },
  'zero_waste': {
    label: 'Zero Waste Lifestyle',
    category: 'Consumption',
    annualReduction: 0.8,
    description: 'Minimized landfill contributions',
    emoji: '♻️',
  },
  'remote_work': {
    label: 'Full Remote Work',
    category: 'Transportation',
    annualReduction: 2.4,
    description: 'Eliminated commute emissions',
    emoji: '🏠',
  },
  'heat_pump': {
    label: 'Heat Pump HVAC',
    category: 'Energy',
    annualReduction: 2.2,
    description: 'Efficient heating/cooling system',
    emoji: '🌡️',
  },
  'energy_audit': {
    label: 'Home Energy Efficiency',
    category: 'Energy',
    annualReduction: 1.2,
    description: 'Insulation, windows, LED lighting',
    emoji: '💡',
  },
  'public_transit': {
    label: 'Primary Public Transit',
    category: 'Transportation',
    annualReduction: 2.0,
    description: 'Shared transportation adoption',
    emoji: '🚇',
  },
  'bicycle_commute': {
    label: 'Bicycle Commuting',
    category: 'Transportation',
    annualReduction: 2.8,
    description: 'Zero-emission daily transport',
    emoji: '🚴',
  },
  'local_food': {
    label: 'Local Food Sourcing',
    category: 'Food',
    annualReduction: 0.6,
    description: 'Reduced food transportation miles',
    emoji: '🥬',
  },
  'rainwater_harvest': {
    label: 'Rainwater Harvesting',
    category: 'Water',
    annualReduction: 0.4,
    description: 'Reduced municipal water processing',
    emoji: '💧',
  },
  'composting': {
    label: 'Active Composting',
    category: 'Waste',
    annualReduction: 0.3,
    description: 'Organic waste diversion',
    emoji: '🍂',
  },
  'flight_reduction': {
    label: 'Reduced Air Travel',
    category: 'Transportation',
    annualReduction: 1.8,
    description: 'Minimized aviation emissions',
    emoji: '✈️',
  },
};

export interface SovereignEvent {
  actionKey: string;
  year: number;
  month?: number; // 1-12, optional
  notes?: string;
}

export interface LegacyHealerInput {
  zipCode: string;
  sovereignEvents: SovereignEvent[];
  currentYear?: number;
}

export interface YearlyBreakdown {
  year: number;
  baselineEmissions: number;
  sovereignReductions: number;
  netEmissions: number;
  delta: number;
  resonanceBonus: number;
  yearEquity: number;
  activeActions: string[];
}

export interface LegacyHealerResult {
  // Input echo
  zipCode: string;
  zipCodeBaseline: number;
  lookbackYears: number;
  currentYear: number;
  startYear: number;
  
  // Core calculations
  totalBaselineEmissions: number;
  totalSovereignReductions: number;
  totalDelta: number;
  totalResonanceBonus: number;
  
  // Legacy Carbon Equity
  legacyCarbonEquity: number;
  
  // Dynamic BPS Split
  founderYield70: number;
  stewardship20: number;
  publicOverflow10: number;
  
  // Yearly breakdown
  yearlyBreakdown: YearlyBreakdown[];
  
  // Metadata
  carbonDate: string; // ISO date of earliest sovereign action
  sovereignScore: number; // 0-100 consciousness level
  pentagonData: {
    industrial: number;
    resonance: number;
    participation: number;
    legacy: number;
    equity: number;
  };
  
  // Compliance
  poeHash: string;
  geniusActCompliant: boolean;
  timestamp: string;
}

// Maximum lookback period
const MAX_LOOKBACK_YEARS = 9.0;

// Compounding resonance bonus rate per year
const RESONANCE_BONUS_RATE = 0.05; // 5%

// Market rate multiplier for carbon credits (2026 pricing)
const MARKET_RATE_USD_PER_TONNE = 85;

/**
 * Get baseline emissions for a zip code
 */
export function getZipCodeBaseline(zipCode: string): number {
  const prefix = zipCode.slice(0, 3);
  return ZIP_CODE_BASELINES[prefix] || ZIP_CODE_BASELINES['default'];
}

/**
 * Calculate Legacy Carbon Equity from historical sovereign actions
 */
export function calculateLegacyCarbonEquity(input: LegacyHealerInput): LegacyHealerResult {
  const currentYear = input.currentYear || new Date().getFullYear();
  const startYear = currentYear - MAX_LOOKBACK_YEARS;
  const zipCodeBaseline = getZipCodeBaseline(input.zipCode);
  
  // Build a map of active actions per year
  const activeActionsByYear: Map<number, Set<string>> = new Map();
  
  for (let year = Math.floor(startYear); year <= currentYear; year++) {
    activeActionsByYear.set(year, new Set());
  }
  
  // Process each sovereign event
  let earliestActionDate: Date | null = null;
  
  for (const event of input.sovereignEvents) {
    const eventYear = event.year;
    const eventMonth = event.month || 1;
    const eventDate = new Date(eventYear, eventMonth - 1, 1);
    
    // Track earliest action for "Carbon Date"
    if (!earliestActionDate || eventDate < earliestActionDate) {
      earliestActionDate = eventDate;
    }
    
    // Apply action to all subsequent years within lookback
    for (let year = eventYear; year <= currentYear; year++) {
      if (year >= Math.floor(startYear) && activeActionsByYear.has(year)) {
        activeActionsByYear.get(year)!.add(event.actionKey);
      }
    }
  }
  
  // Calculate yearly breakdown
  const yearlyBreakdown: YearlyBreakdown[] = [];
  let totalBaselineEmissions = 0;
  let totalSovereignReductions = 0;
  let totalDelta = 0;
  let totalResonanceBonus = 0;
  
  for (let year = Math.floor(startYear); year <= currentYear; year++) {
    const activeActions = activeActionsByYear.get(year) || new Set();
    const activeActionsList = Array.from(activeActions);
    
    // Calculate reductions for this year
    let yearReductions = 0;
    for (const actionKey of activeActionsList) {
      const action = SOVEREIGN_ACTIONS[actionKey];
      if (action) {
        yearReductions += action.annualReduction;
      }
    }
    
    // Cap reductions at baseline (can't go negative)
    yearReductions = Math.min(yearReductions, zipCodeBaseline);
    
    const netEmissions = zipCodeBaseline - yearReductions;
    const delta = yearReductions; // Positive delta = carbon avoided
    
    // Calculate resonance bonus (5% compounding per year of low-carbon living)
    const yearsActive = activeActionsList.length > 0 ? 1 : 0;
    const yearsFromStart = year - Math.floor(startYear);
    const resonanceBonus = delta * Math.pow(1 + RESONANCE_BONUS_RATE, yearsFromStart) - delta;
    
    // Year equity = delta + resonance bonus
    const yearEquity = delta + resonanceBonus;
    
    yearlyBreakdown.push({
      year,
      baselineEmissions: zipCodeBaseline,
      sovereignReductions: yearReductions,
      netEmissions,
      delta,
      resonanceBonus,
      yearEquity,
      activeActions: activeActionsList,
    });
    
    totalBaselineEmissions += zipCodeBaseline;
    totalSovereignReductions += yearReductions;
    totalDelta += delta;
    totalResonanceBonus += resonanceBonus;
  }
  
  // Calculate Legacy Carbon Equity in USD
  const totalCarbonCredits = totalDelta + totalResonanceBonus;
  const legacyCarbonEquity = totalCarbonCredits * MARKET_RATE_USD_PER_TONNE;
  
  // Apply the Dynamic BPS Universal Law
  const founderYield70 = legacyCarbonEquity * 0.70;
  const stewardship20 = legacyCarbonEquity * 0.20;
  const publicOverflow10 = legacyCarbonEquity * 0.10;
  
  // Calculate Sovereign Score (0-100)
  const maxPossibleReduction = Object.values(SOVEREIGN_ACTIONS).reduce((sum, a) => sum + a.annualReduction, 0);
  const averageYearlyReduction = totalSovereignReductions / (currentYear - Math.floor(startYear) + 1);
  const sovereignScore = Math.min(100, Math.round((averageYearlyReduction / maxPossibleReduction) * 100));
  
  // Generate PoE hash
  const poeData = JSON.stringify({
    zipCode: input.zipCode,
    events: input.sovereignEvents,
    timestamp: new Date().toISOString(),
  });
  const poeHash = generatePoeHash(poeData);
  
  // Calculate Pentagon data
  const pentagonData = {
    industrial: Math.min(100, (totalSovereignReductions / totalBaselineEmissions) * 100),
    resonance: Math.min(100, (totalResonanceBonus / totalDelta) * 200 + 20),
    participation: Math.min(100, sovereignScore),
    legacy: Math.min(100, (input.sovereignEvents.length / 5) * 100),
    equity: Math.min(100, (legacyCarbonEquity / 10000) * 100),
  };
  
  return {
    zipCode: input.zipCode,
    zipCodeBaseline,
    lookbackYears: MAX_LOOKBACK_YEARS,
    currentYear,
    startYear: Math.floor(startYear),
    
    totalBaselineEmissions,
    totalSovereignReductions,
    totalDelta,
    totalResonanceBonus,
    
    legacyCarbonEquity,
    
    founderYield70,
    stewardship20,
    publicOverflow10,
    
    yearlyBreakdown,
    
    carbonDate: earliestActionDate?.toISOString() || new Date().toISOString(),
    sovereignScore,
    pentagonData,
    
    poeHash,
    geniusActCompliant: poeHash.length === 64,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate a 64-character Proof of Extraction hash
 */
function generatePoeHash(data: string): string {
  // Simple hash generation (in production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Generate 64-char hex string
  const base = Math.abs(hash).toString(16).padStart(8, '0');
  const timestamp = Date.now().toString(16).padStart(12, '0');
  const random = Array.from({ length: 44 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  return (base + timestamp + random).slice(0, 64);
}

/**
 * Get all available sovereign actions
 */
export function getSovereignActions() {
  return Object.entries(SOVEREIGN_ACTIONS).map(([key, value]) => ({
    key,
    ...value,
  }));
}

/**
 * Format Legacy Carbon Equity result for display
 */
export function formatLegacyEquityDisplay(result: LegacyHealerResult) {
  return {
    headline: `$${result.legacyCarbonEquity.toLocaleString(undefined, { maximumFractionDigits: 2 })} Legacy Carbon Equity`,
    carbonCredits: `${(result.totalDelta + result.totalResonanceBonus).toFixed(2)} tonnes CO₂ reclaimed`,
    sovereignScore: `Level ${Math.ceil(result.sovereignScore / 10)} Sovereign Organism`,
    carbonDate: new Date(result.carbonDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    }),
    publicOverflow: `$${result.publicOverflow10.toLocaleString(undefined, { maximumFractionDigits: 2 })} to Neighborhood Vibrational Support`,
  };
}

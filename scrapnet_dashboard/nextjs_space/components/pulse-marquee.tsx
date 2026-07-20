'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Radio, History, Battery, Umbrella, Home, Handshake, Plane } from 'lucide-react';

export type PulseType = 'STANDARD' | 'LEGACY' | 'EQUITY' | 'INSURANCE' | 'RENT' | 'SALE' | 'AIRBNB';

export interface PulseEntry {
  id: string;
  type: PulseType;
  string: string;
  timestamp: string;
  totalValueUsd: number;
  publicResilienceUsd?: number;
  targetZipCode?: string;
  poeHash?: string;
}

interface PulseMarqueeProps {
  pulses: PulseEntry[];
  className?: string;
  autoScroll?: boolean;
  onPulseHover?: (pulse: PulseEntry | null) => void;
}

const getPulseConfig = (type: PulseType) => {
  const configs: Record<PulseType, { 
    icon: typeof Radio; 
    colorClass: string; 
    bgClass: string; 
    borderClass: string;
    label: string;
  }> = {
    STANDARD: { 
      icon: Radio, 
      colorClass: 'text-cyan-400', 
      bgClass: 'bg-cyan-500/10', 
      borderClass: 'border-cyan-500/30',
      label: 'FREQ'
    },
    LEGACY: { 
      icon: History, 
      colorClass: 'text-emerald-400', 
      bgClass: 'bg-emerald-500/10', 
      borderClass: 'border-emerald-500/30',
      label: 'RETRO'
    },
    EQUITY: { 
      icon: Battery, 
      colorClass: 'text-amber-400', 
      bgClass: 'bg-amber-500/10', 
      borderClass: 'border-amber-500/30',
      label: 'EQUITY'
    },
    INSURANCE: { 
      icon: Umbrella, 
      colorClass: 'text-violet-400', 
      bgClass: 'bg-violet-500/10', 
      borderClass: 'border-violet-500/30',
      label: 'SHIELD'
    },
    RENT: { 
      icon: Home, 
      colorClass: 'text-pink-400', 
      bgClass: 'bg-pink-500/10', 
      borderClass: 'border-pink-500/30',
      label: 'RENT-NODE'
    },
    SALE: { 
      icon: Handshake, 
      colorClass: 'text-cyan-400', 
      bgClass: 'bg-cyan-500/10', 
      borderClass: 'border-cyan-500/30',
      label: 'SALE-EXTRACT'
    },
    AIRBNB: { 
      icon: Plane, 
      colorClass: 'text-blue-400', 
      bgClass: 'bg-blue-500/10', 
      borderClass: 'border-blue-500/30',
      label: 'HOST-FLOW'
    },
  };
  return configs[type] || configs.STANDARD;
};

export default function PulseMarquee({
  pulses,
  className,
  autoScroll = true,
  onPulseHover,
}: PulseMarqueeProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<PulseType | 'ALL'>('ALL');
  const marqueeRef = useRef<HTMLDivElement>(null);

  const filteredPulses = activeFilter === 'ALL' 
    ? pulses 
    : pulses.filter(p => p.type === activeFilter);

  // Duplicate pulses for seamless scrolling
  const displayPulses = [...filteredPulses, ...filteredPulses];

  return (
    <div className={cn('relative', className)}>
      <div className="bg-[hsl(225,25%,8%)] rounded-xl border border-cyan-500/20 overflow-hidden">
        {/* Header with filters */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="w-4 h-4 text-cyan-400" />
              <div className="absolute inset-0 animate-ping opacity-50">
                <Radio className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="text-sm font-semibold text-gray-300">THE PULSE</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 rounded text-cyan-400">LIVE</span>
          </div>
          
          {/* Type filters */}
          <div className="flex items-center gap-1">
            {(['ALL', 'STANDARD', 'LEGACY', 'EQUITY', 'INSURANCE', 'RENT', 'SALE', 'AIRBNB'] as const).map((type) => {
              const config = type !== 'ALL' ? getPulseConfig(type) : null;
              const isActive = activeFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-medium transition-all',
                    isActive 
                      ? 'bg-cyan-500/30 text-cyan-300' 
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                  )}
                >
                  {type === 'ALL' ? 'ALL' : config?.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Marquee container */}
        <div 
          className="relative h-12 overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Gradient masks */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[hsl(225,25%,8%)] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[hsl(225,25%,8%)] to-transparent z-10" />

          {/* Scrolling content */}
          <div
            ref={marqueeRef}
            className={cn(
              'flex items-center gap-4 h-full px-4',
              autoScroll && !isPaused && 'animate-marquee'
            )}
            style={{
              width: 'max-content',
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {displayPulses.map((pulse, index) => {
              const config = getPulseConfig(pulse.type);
              const Icon = config.icon;
              return (
                <div
                  key={`${pulse.id}-${index}`}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer poe-container group',
                    config.bgClass,
                    config.borderClass,
                    'hover:scale-105'
                  )}
                  onMouseEnter={() => onPulseHover?.(pulse)}
                  onMouseLeave={() => onPulseHover?.(null)}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0', config.colorClass)} />
                  <span className={cn('text-xs font-medium whitespace-nowrap', config.colorClass)}>
                    {pulse.string}
                  </span>
                  {pulse.publicResilienceUsd && pulse.publicResilienceUsd > 0 && (
                    <span className="text-[10px] text-cyan-400 font-mono">
                      +${pulse.publicResilienceUsd.toLocaleString()}
                    </span>
                  )}
                  {pulse.targetZipCode && (
                    <span className="text-[10px] text-gray-500">→{pulse.targetZipCode}</span>
                  )}
                  
                  {/* PoE Hash on hover */}
                  {pulse.poeHash && (
                    <div className="poe-hash text-gray-600 ml-2 max-w-[120px] truncate">
                      PoE: {pulse.poeHash.slice(0, 16)}...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-gray-800 text-[10px] text-gray-500">
          <span>{filteredPulses.length} active pulses</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Streaming settlements in real-time
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Activity, Zap } from 'lucide-react';

interface PulseWaveEqualizerProps {
  velocity?: number; // settlements per second
  latency?: number; // average ms
  className?: string;
}

const BAR_COUNT = 32;

export default function PulseWaveEqualizer({
  velocity = 0,
  latency = 500,
  className,
}: PulseWaveEqualizerProps) {
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(0.2));

  // Higher velocity = more amplitude, lower latency = faster animation
  const amplitudeMultiplier = useMemo(() => {
    return Math.min(1, velocity / 10 + 0.3);
  }, [velocity]);

  const animationSpeed = useMemo(() => {
    // Faster animations for lower latency
    return Math.max(50, 300 - (300 - latency) * 0.5);
  }, [latency]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBars((prev) =>
        prev.map((_, i) => {
          // Create wave pattern with some randomness
          const baseWave = Math.sin(Date.now() / (200 + i * 10) + i * 0.5);
          const noise = Math.random() * 0.3;
          const amplitude = (baseWave + 1) / 2 * amplitudeMultiplier + noise;
          return Math.max(0.1, Math.min(1, amplitude));
        })
      );
    }, animationSpeed);

    return () => clearInterval(interval);
  }, [amplitudeMultiplier, animationSpeed]);

  const getBarColor = (height: number) => {
    if (height > 0.8) return 'bg-cyan-400';
    if (height > 0.6) return 'bg-cyan-500';
    if (height > 0.4) return 'bg-teal-500';
    return 'bg-teal-600';
  };

  const isHighVelocity = velocity > 5;
  const isLowLatency = latency < 100;

  return (
    <div className={cn('relative', className)}>
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-cyan-500/10 to-cyan-500/5 rounded-xl blur-xl" />
      
      <div className="relative bg-[hsl(225,25%,8%)] rounded-xl border border-cyan-500/20 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className={cn('w-5 h-5', isHighVelocity ? 'text-cyan-400 animate-pulse' : 'text-cyan-500/60')} />
            <span className="text-sm font-semibold text-gray-300">Frequency Wave</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Zap className={cn('w-3 h-3', isLowLatency ? 'text-amber-400' : 'text-gray-500')} />
              <span className={cn(isLowLatency ? 'text-amber-400' : 'text-gray-500')}>
                {latency}ms
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className={cn(
                'w-2 h-2 rounded-full',
                isHighVelocity ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'
              )} />
              <span className={cn(isHighVelocity ? 'text-cyan-400' : 'text-gray-500')}>
                {velocity.toFixed(1)}/s
              </span>
            </div>
          </div>
        </div>

        {/* Equalizer bars */}
        <div className="flex items-end justify-between gap-[2px] h-16">
          {bars.map((height, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-t transition-all duration-75',
                getBarColor(height)
              )}
              style={{
                height: `${height * 100}%`,
                opacity: 0.6 + height * 0.4,
              }}
            />
          ))}
        </div>

        {/* Frequency labels */}
        <div className="flex justify-between mt-2 text-[10px] text-gray-600">
          <span>IDLE</span>
          <span>NOMINAL</span>
          <span>HIGH-FREQ</span>
          <span>QUANTUM</span>
        </div>

        {/* Status indicator */}
        {isLowLatency && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded-full border border-amber-500/30">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] text-amber-400 font-medium">QUANTUM SPEED</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Factory,
  Radio,
  Users,
  History,
  Battery,
} from 'lucide-react';

interface PentagonData {
  industrial: number; // 0-100
  resonance: number;
  participation: number;
  legacy: number;
  equity: number;
}

interface SovereignPentagonProps {
  data: PentagonData;
  size?: number;
  className?: string;
  onNodeHover?: (node: keyof PentagonData | null) => void;
  activeNode?: keyof PentagonData | null;
}

const NODES = [
  { key: 'industrial', label: 'Physical Recovery', sublabel: 'Material Extraction', icon: Factory, color: 'amber', angle: -90 },
  { key: 'resonance', label: 'Logistical Efficiency', sublabel: 'Transport Optimization', icon: Radio, color: 'magenta', angle: -18 },
  { key: 'equity', label: 'Asset Valuation', sublabel: 'Property Holdings', icon: Battery, color: 'cyan', angle: 54 },
  { key: 'legacy', label: 'Historical Restoration', sublabel: 'Temporal Carbon Offset', icon: History, color: 'emerald', angle: 126 },
  { key: 'participation', label: 'Participation Index', sublabel: 'Engagement Score', icon: Users, color: 'violet', angle: 198 },
] as const;

const getColorClasses = (color: string) => {
  const colors: Record<string, { text: string; bg: string; border: string; glow: string }> = {
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/50', glow: 'sovereign-glow-amber' },
    magenta: { text: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/50', glow: 'sovereign-glow-magenta' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', glow: 'sovereign-glow-cyan' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', glow: 'sovereign-glow-emerald' },
    violet: { text: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-500/50', glow: 'sovereign-glow-violet' },
  };
  return colors[color] || colors.cyan;
};

export default function SovereignPentagon({
  data,
  size = 400,
  className,
  onNodeHover,
  activeNode,
}: SovereignPentagonProps) {
  const center = size / 2;
  const outerRadius = size * 0.38;
  const innerRadius = size * 0.15;

  // Live BPS allocation label — never hardcoded. Sourced from runtime config.
  const [bpsLabel, setBpsLabel] = useState<string>('—');
  useEffect(() => {
    let active = true;
    fetch('/api/ledger?action=split')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const label = data?.bpsTable?.label ?? data?.universalLaw;
        if (typeof label === 'string' && label.length > 0) setBpsLabel(label);
      })
      .catch(() => {
        /* keep placeholder on failure */
      });
    return () => {
      active = false;
    };
  }, []);

  // Calculate pentagon points
  const pentagonPoints = useMemo(() => {
    return NODES.map((node) => {
      const angleRad = (node.angle * Math.PI) / 180;
      const x = center + outerRadius * Math.cos(angleRad);
      const y = center + outerRadius * Math.sin(angleRad);
      return { ...node, x, y };
    });
  }, [center, outerRadius]);

  // Calculate data polygon points
  const dataPoints = useMemo(() => {
    return NODES.map((node) => {
      const value = data[node.key as keyof PentagonData] || 0;
      const normalizedValue = Math.min(Math.max(value, 0), 100) / 100;
      const radius = innerRadius + (outerRadius - innerRadius) * normalizedValue;
      const angleRad = (node.angle * Math.PI) / 180;
      const x = center + radius * Math.cos(angleRad);
      const y = center + radius * Math.sin(angleRad);
      return { x, y, value };
    });
  }, [data, center, innerRadius, outerRadius]);

  const dataPolygonPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  const outerPolygonPath = pentagonPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className={cn('relative', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Background grid lines */}
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <path
            key={scale}
            d={NODES.map((node, i) => {
              const radius = innerRadius + (outerRadius - innerRadius) * scale;
              const angleRad = (node.angle * Math.PI) / 180;
              const x = center + radius * Math.cos(angleRad);
              const y = center + radius * Math.sin(angleRad);
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ') + ' Z'}
            fill="none"
            stroke="hsl(225 20% 16%)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Axis lines */}
        {pentagonPoints.map((point, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke="hsl(225 20% 20%)"
            strokeWidth="1"
          />
        ))}

        {/* Outer pentagon border */}
        <path
          d={outerPolygonPath}
          fill="none"
          stroke="hsl(175 95% 50% / 0.3)"
          strokeWidth="2"
        />

        {/* Data polygon with gradient fill */}
        <defs>
          <linearGradient id="pentagonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(175 95% 50% / 0.4)" />
            <stop offset="50%" stopColor="hsl(280 90% 60% / 0.3)" />
            <stop offset="100%" stopColor="hsl(38 95% 55% / 0.4)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={dataPolygonPath}
          fill="url(#pentagonGradient)"
          stroke="hsl(175 95% 50%)"
          strokeWidth="2"
          filter="url(#glow)"
          className="transition-all duration-500"
        />

        {/* Data points */}
        {dataPoints.map((point, i) => {
          const node = NODES[i];
          const colors = getColorClasses(node.color);
          const isActive = activeNode === node.key;
          return (
            <g key={node.key}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isActive ? 8 : 6}
                className={cn(
                  'transition-all duration-300 cursor-pointer',
                  isActive ? 'fill-current' : 'fill-current opacity-80'
                )}
                style={{ fill: `hsl(var(--neon-${node.color}))` }}
                onMouseEnter={() => onNodeHover?.(node.key as keyof PentagonData)}
                onMouseLeave={() => onNodeHover?.(null)}
              />
              {isActive && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={14}
                  fill="none"
                  stroke={`hsl(var(--neon-${node.color}))`}
                  strokeWidth="2"
                  className="animate-ping opacity-50"
                />
              )}
            </g>
          );
        })}

        {/* Center hub */}
        <circle cx={center} cy={center} r={20} fill="hsl(225 25% 10%)" stroke="hsl(175 95% 50% / 0.5)" strokeWidth="2" />
        <text x={center} y={center + 5} textAnchor="middle" className="fill-cyan-400 text-xs font-bold">{bpsLabel}</text>
      </svg>

      {/* Node labels around the pentagon */}
      {pentagonPoints.map((point) => {
        const colors = getColorClasses(point.color);
        const isActive = activeNode === point.key;
        const labelOffset = 45;
        const angleRad = (point.angle * Math.PI) / 180;
        const labelX = center + (outerRadius + labelOffset) * Math.cos(angleRad);
        const labelY = center + (outerRadius + labelOffset) * Math.sin(angleRad);
        const value = data[point.key as keyof PentagonData] || 0;

        return (
          <div
            key={point.key}
            className={cn(
              'absolute transform -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-300 cursor-pointer',
              isActive && 'scale-110'
            )}
            style={{ left: labelX, top: labelY }}
            onMouseEnter={() => onNodeHover?.(point.key as keyof PentagonData)}
            onMouseLeave={() => onNodeHover?.(null)}
          >
            <div className={cn('p-2 rounded-lg border transition-all', colors.bg, colors.border, isActive && colors.glow)}>
              <point.icon className={cn('w-5 h-5 mx-auto mb-1', colors.text)} />
              <div className={cn('text-xs font-semibold whitespace-nowrap', colors.text)}>{point.label}</div>
              <div className="text-[10px] text-gray-500 whitespace-nowrap">{point.sublabel}</div>
              <div className={cn('text-lg font-bold mt-1', colors.text)}>{value}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

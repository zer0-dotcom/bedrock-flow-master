'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface StatCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  icon: LucideIcon;
  trend?: number;
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'cyan';
  decimals?: number;
}

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-500',
    glow: 'shadow-emerald-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-500',
    glow: 'shadow-blue-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-500',
    glow: 'shadow-amber-500/20',
  },
  rose: {
    bg: 'bg-rose-500/10',
    icon: 'text-rose-500',
    glow: 'shadow-rose-500/20',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    icon: 'text-cyan-500',
    glow: 'shadow-cyan-500/20',
  },
};

export function StatCard({
  title,
  value,
  suffix = '',
  icon: Icon,
  trend,
  color = 'emerald',
  decimals = 0,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true });
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value ?? 0;
  const colors = colorClasses[color] ?? colorClasses.emerald;

  useEffect(() => {
    if (inView && typeof numericValue === 'number') {
      const duration = 1000;
      const steps = 60;
      const increment = numericValue / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setDisplayValue(numericValue);
          clearInterval(timer);
        } else {
          setDisplayValue(current);
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [inView, numericValue]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative overflow-hidden rounded-xl bg-card p-6 shadow-lg',
        'border border-border/50',
        'hover:shadow-xl hover:border-border transition-all duration-300',
        colors.glow
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">
            {displayValue?.toLocaleString('en-US', {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            }) ?? '0'}
            {suffix && <span className="text-lg ml-1 text-muted-foreground">{suffix}</span>}
          </p>
          {trend !== undefined && (
            <p className={cn(
              'text-xs font-medium',
              (trend ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {(trend ?? 0) >= 0 ? '+' : ''}{trend?.toFixed?.(1) ?? '0'}% from last month
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-3', colors.bg)}>
          <Icon className={cn('h-6 w-6', colors.icon)} />
        </div>
      </div>
    </motion.div>
  );
}

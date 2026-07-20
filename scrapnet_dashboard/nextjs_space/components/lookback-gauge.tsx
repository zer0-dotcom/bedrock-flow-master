'use client';

import { cn } from '@/lib/utils';
import { Clock, Shield, Calendar } from 'lucide-react';

interface LookbackGaugeProps {
  yearsCompleted: number;
  totalYears?: number;
  startDate?: string;
}

export default function LookbackGauge({ 
  yearsCompleted, 
  totalYears = 9, 
  startDate 
}: LookbackGaugeProps) {
  const progress = Math.min((yearsCompleted / totalYears) * 100, 100);
  const yearsRemaining = Math.max(totalYears - yearsCompleted, 0);

  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-medium text-gray-400">9-Year Lookback Gauge</h3>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 text-xs text-gray-400">
          <Shield className="w-3 h-3" />
          <span>Encrypted</span>
        </div>
      </div>

      {/* Circular Progress */}
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32 md:w-40 md:h-40">
          {/* Background Circle */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="#1f2937"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress Arc */}
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="url(#gaugeGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.64} 264`}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl md:text-4xl font-bold text-white">
              {yearsCompleted.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">years</p>
          </div>
        </div>

        {/* Progress Bar Alternative */}
        <div className="w-full mt-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Historical Audit Progress</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-4 border-t border-gray-800">
          <div className="text-center">
            <p className="text-lg font-semibold text-white">{yearsCompleted.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-400">{yearsRemaining.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Remaining</p>
          </div>
        </div>

        {/* Start Date */}
        {startDate && (
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-600">
            <Calendar className="w-3 h-3" />
            <span>Lookback started: {startDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}

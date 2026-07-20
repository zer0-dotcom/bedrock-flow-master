'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Shield,
  Users,
  Eye,
  Zap,
  Lock,
  CheckCircle2,
  Layers,
  Fingerprint,
  Leaf,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';

interface AethexStats {
  packetsCreated: number;
  emissionsSaved: number;
  verificationRate: number;
  activeNodes: number;
}

export default function AethexProtocolWidget({ className }: { className?: string }) {
  const [stats, setStats] = useState<AethexStats>({
    packetsCreated: 0,
    emissionsSaved: 0,
    verificationRate: 100,
    activeNodes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      try {
        const res = await fetch('/api/aethex/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        if (!cancelled) {
          setStats({
            packetsCreated: data.packetsCreated ?? 0,
            emissionsSaved: data.emissionsSaved ?? 0,
            verificationRate: data.verificationRate ?? 100,
            activeNodes: data.activeNodes ?? 0,
          });
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[AethexWidget] Stats fetch error:', err);
        if (!cancelled) {
          // Graceful fallback — show zeros rather than fake data
          setIsLoading(false);
        }
      }
    }
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  const securityLayers = [
    {
      name: 'Ballistic Layer',
      description: 'AES-GCM 256-bit',
      icon: Shield,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      status: 'ACTIVE',
    },
    {
      name: 'Guardian Layer',
      description: '2-of-2 Multi-Sig',
      icon: Users,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      status: 'ACTIVE',
    },
    {
      name: 'Stealth Layer',
      description: 'Zero-Knowledge Proofs',
      icon: Eye,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      status: 'ACTIVE',
    },
  ];

  return (
    <div className={cn('bg-[hsl(225,25%,8%)] rounded-xl border border-gray-700 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gradient-to-r from-violet-900/20 to-cyan-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-500/20">
              <Fingerprint className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Aethex Protocol</h3>
              <p className="text-[10px] text-gray-500">Universal Truth Layer | ZerO IP</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Security Layers */}
      <div className="p-4 space-y-2">
        <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          <Layers className="w-3 h-3" />
          Armored Digital Packet Security
        </div>
        <div className="grid grid-cols-3 gap-2">
          {securityLayers.map((layer) => (
            <div
              key={layer.name}
              className={cn(
                'p-2 rounded-lg border border-gray-700',
                layer.bgColor
              )}
            >
              <layer.icon className={cn('w-4 h-4 mb-1', layer.color)} />
              <div className="text-[10px] font-medium text-white">{layer.name}</div>
              <div className="text-[9px] text-gray-500">{layer.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-gray-900/50 border border-gray-800">
            <div className="flex items-center gap-1 text-emerald-400">
              <Lock className="w-3 h-3" />
              <span className="text-lg font-bold">
                {isLoading ? '-' : stats.packetsCreated.toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] text-gray-500">Digital Packets</div>
          </div>
          <div className="p-2 rounded-lg bg-gray-900/50 border border-gray-800">
            <div className="flex items-center gap-1 text-cyan-400">
              <Leaf className="w-3 h-3" />
              <span className="text-lg font-bold">
                {isLoading ? '-' : `${(stats.emissionsSaved / 1000).toFixed(1)}t`}
              </span>
            </div>
            <div className="text-[10px] text-gray-500">CO2e Saved</div>
          </div>
        </div>
      </div>

      {/* Due4 Economic Note */}
      <div className="px-4 pb-4">
        <div className="p-3 rounded-lg bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-medium text-amber-400 mb-1">Due4 Economic Note</div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Assets verified by the Aethex Protocol are processed into secure on-chain assets,
                significantly reducing the dependency on physical carbon-intensive security (Armored Transport).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* GHG Savings Indicator */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-300">Transport GHG Reduction</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">≤100%</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-800 bg-black/20">
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>Armored Transport: MINIMIZED</span>
          <span className="text-emerald-400">Digital Packets: ACTIVE</span>
        </div>
      </div>
    </div>
  );
}

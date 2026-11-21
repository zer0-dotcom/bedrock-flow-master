'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const stats = [
  { label: 'First Client Proof', value: '$158.24', sub: '1.86t CO₂', icon: '◈' },
  { label: 'Vault Total', value: '$221.53', sub: '3.72t CO₂', icon: '◆' },
  { label: 'Grid Region', value: 'SCE', sub: 'Zip 92706', icon: '⚡' },
  { label: 'Energy Verified', value: '703 kWh', sub: 'Metered & Audited', icon: '⊕' },
]

const badges = [
  { label: 'Solana Token-2022', color: 'emerald' },
  { label: 'Token-2022 Verified', color: 'purple' },
  { label: 'Phantom Supported', color: 'amber' },
  { label: 'GENIUS Act 2026', color: 'emerald' },
]

const badgeColorMap: Record<string, string> = {
  emerald: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  purple: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
  cyan: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
  amber: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
}

export function ChainData() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="py-24 px-6 relative" ref={ref}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[100px]" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-white">
            Verified Data On Chain
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Real proofs from real clients — live on Solana Mainnet-Beta
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {(stats ?? []).map((stat: typeof stats[0], i: number) => (
            <motion.div
              key={stat?.label ?? i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-sm"
            >
              <div className="text-2xl mb-2">{stat?.icon ?? ''}</div>
              <div className="font-mono text-2xl font-bold text-white mb-1">
                {stat?.value ?? ''}
              </div>
              <div className="text-sm text-emerald-400 font-mono mb-1">{stat?.sub ?? ''}</div>
              <div className="text-xs text-gray-500">{stat?.label ?? ''}</div>
            </motion.div>
          ))}
        </div>

        {/* On-chain attestation */}
        <div className="grid grid-cols-1 gap-8">
          {/* On-chain info + badges */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 backdrop-blur-sm flex flex-col justify-between"
          >
            <div>
              <h3 className="font-display text-lg font-bold text-white mb-1">Chain Attestation</h3>
              <p className="text-xs text-gray-500 font-mono mb-6">Immutable ledger records</p>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Token Standard</div>
                    <div className="text-xs text-gray-400">Solana Token-2022 with Transfer Hook extensions</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Network</div>
                    <div className="text-xs text-gray-400">Mainnet-Beta Confirmed</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">PoE Hash</div>
                    <div className="text-xs text-gray-400">Proof-of-Evidence anchored per verified proof</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {(badges ?? []).map((badge: typeof badges[0]) => (
                <span
                  key={badge?.label ?? ''}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-mono ${
                    badgeColorMap?.[badge?.color ?? ''] ?? badgeColorMap['emerald']
                  }`}
                >
                  {badge?.label ?? ''}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

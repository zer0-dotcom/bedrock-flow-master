'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AssetTile {
  id: string
  name: string
  live: boolean
  moduleId?: string
  route?: string
  detail: string
}

const TILES: AssetTile[] = [
  { id: 'energy-ghost', name: 'Energy Ghost', live: true, moduleId: 'commercial', route: '/bedrockfad', detail: 'Commercial forensic audit' },
  { id: 'legacy-carbon', name: 'Legacy Carbon Proof', live: true, moduleId: 'residential', route: '/legacy-healer', detail: 'Residential · 9-year lookback' },
  { id: 'asphalt-rap', name: 'Asphalt / RAP', live: true, moduleId: 'industrial', route: '/ledger', detail: 'Reclaimed asphalt pavement' },
  { id: 'biochar-cdr', name: 'Biochar / CDR', live: true, moduleId: 'industrial', route: '/ledger', detail: 'Carbon dioxide removal' },
  { id: 'metal-recovery', name: 'Metal Recovery', live: true, moduleId: 'industrial', route: '/ledger', detail: 'Recovered metal verification' },
  { id: 'human-life', name: 'Human Life Processes', live: false, detail: 'In development' },
  { id: 'real-estate', name: 'Real Estate', live: false, detail: 'In development' },
  { id: 'fiat-pallets', name: 'Fiat Currency Pallets', live: false, detail: 'In development' },
  { id: 'precious-metals', name: 'Precious Metals', live: false, detail: 'In development' },
]

interface AssetGridProps {
  onSelectLive: (moduleId: string) => void
}

export function AssetGrid({ onSelectLive }: AssetGridProps) {
  const [lockedTile, setLockedTile] = useState<AssetTile | null>(null)

  useEffect(() => {
    if (!lockedTile) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLockedTile(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lockedTile])

  const handleClick = (tile: AssetTile) => {
    if (tile.live && tile.moduleId) {
      onSelectLive(tile.moduleId)
      document.getElementById('intake-vessel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      setLockedTile(tile)
    }
  }

  return (
    <section id="asset-classes" className="pt-24 pb-4 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Asset Classes
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Nine asset classes. Five live today. Pick yours to enter the intake vessel.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TILES.map((tile, i) => (
            <motion.button
              key={tile.id}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleClick(tile)}
              aria-label={`${tile.name} — ${tile.live ? 'Live' : 'Coming soon'}`}
              className={`group relative overflow-hidden rounded-xl border p-6 text-left transition-all duration-300 cursor-pointer ${
                tile.live
                  ? 'bg-gray-900/60 border-emerald-500/20 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10'
                  : 'bg-gray-950/60 border-gray-800 hover:border-purple-500/40'
              }`}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                tile.live ? 'bg-gradient-to-br from-emerald-500/10 to-transparent' : 'bg-gradient-to-br from-purple-500/10 to-transparent'
              }`} />
              <div className="relative flex items-start justify-between gap-3 mb-6">
                <span className="font-mono text-xs text-gray-600">{String(i + 1).padStart(2, '0')}</span>
                {tile.live ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-mono font-semibold text-emerald-300">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    LIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 px-2.5 py-1 text-[11px] font-mono font-semibold text-purple-300">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    COMING SOON
                  </span>
                )}
              </div>
              <h3 className={`relative font-display text-lg font-bold uppercase tracking-wide mb-1 ${tile.live ? 'text-white' : 'text-gray-400'}`}>
                {tile.name}
              </h3>
              <p className={`relative text-xs font-mono ${tile.live ? 'text-emerald-400/80' : 'text-gray-600'}`}>
                {tile.live ? `${tile.detail} · ${tile.route}` : tile.detail}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lockedTile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6"
            onClick={() => setLockedTile(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="coming-soon-title"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-purple-500/30 bg-gray-950 p-8 text-center shadow-2xl shadow-purple-500/10"
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/15 text-purple-300">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              </div>
              <p className="font-mono text-xs uppercase tracking-widest text-purple-300 mb-2">{lockedTile.name}</p>
              <h3 id="coming-soon-title" className="font-display text-2xl font-bold text-white mb-3">Coming Soon</h3>
              <p className="text-gray-400 leading-relaxed mb-8">
                This module is in development. You will be notified at launch.
              </p>
              <button
                type="button"
                onClick={() => setLockedTile(null)}
                className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-purple-500 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

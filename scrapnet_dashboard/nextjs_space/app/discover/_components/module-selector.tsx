'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface ModuleOption {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  module: string
  href: string
  color: string
  tagline: string
}

const MODULES: ModuleOption[] = [
  {
    id: 'commercial',
    label: 'Commercial',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" /><path d="M16 6h.01" />
        <path d="M8 10h.01" /><path d="M16 10h.01" />
        <path d="M8 14h.01" /><path d="M16 14h.01" />
      </svg>
    ),
    description: 'Energy Ghost / GhostConverter FAD portal for commercial building forensic audit and carbon proof generation.',
    module: 'BedrockFAD',
    href: '/bedrockfad',
    color: 'emerald',
    tagline: 'Forensic Audit & Discovery',
  },
  {
    id: 'residential',
    label: 'Residential',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    description: 'Temporal Carbon Auditor with 9-year lookback — uncover legacy residential energy savings and mint historical proofs.',
    module: 'Legacy Healer',
    href: '/legacy-healer',
    color: 'purple',
    tagline: '9-Year Lookback Auditor',
  },
  {
    id: 'industrial',
    label: 'Industrial',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20a2 2 0 002 2h16a2 2 0 002-2V8l-7 5V8l-7 5V4a2 2 0 00-2-2H4a2 2 0 00-2 2v16z" />
      </svg>
    ),
    description: 'Industrial Carbon Verification Platform: Asphalt RAP recycling, Biochar CDR sequestration, and Metal Recovery verification.',
    module: 'Ledger',
    href: '/ledger',
    color: 'cyan',
    tagline: 'RAP · Biochar · Metal Recovery',
  },
  {
    id: 'verify',
    label: 'Verify & Write',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
        <circle cx="12" cy="16" r="1" />
      </svg>
    ),
    description: 'Sovereign Verification Vault — write verified carbon proofs to the immutable ledger with PoE hash and chain attestation.',
    module: 'Vault',
    href: '/vault',
    color: 'amber',
    tagline: 'On-Chain Sovereign Vault',
  },
]

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string; badge: string }> = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20',
    badge: 'bg-purple-500/20 text-purple-300',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
    badge: 'bg-cyan-500/20 text-cyan-300',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    badge: 'bg-amber-500/20 text-amber-300',
  },
}

interface ModuleSelectorProps {
  selected?: string | null
  onSelect?: (id: string | null) => void
  pulseKey?: number
}

export function ModuleSelector({ selected: controlledSelected, onSelect, pulseKey = 0 }: ModuleSelectorProps = {}) {
  const [internalSelected, setInternalSelected] = useState<string | null>(null)
  const isControlled = controlledSelected !== undefined
  const selected = isControlled ? controlledSelected : internalSelected
  const setSelected = (id: string | null) => {
    if (!isControlled) setInternalSelected(id)
    onSelect?.(id)
  }
  const activeModule = MODULES?.find((m: ModuleOption) => m?.id === selected) ?? null

  return (
    <section id="intake-vessel" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Intake Vessel
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Select your sector. We will route you to the right verification module.
          </p>
        </div>

        {/* Grid of options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {(MODULES ?? []).map((mod: ModuleOption) => {
            const colors = colorMap?.[mod?.color] ?? colorMap['emerald']
            const isActive = selected === mod?.id
            return (
              <motion.button
                key={mod?.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(mod?.id ?? null)}
                className={`relative p-6 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                  isActive
                    ? `${colors?.bg} ${colors?.border} shadow-lg ${colors?.glow}`
                    : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className={`mb-4 ${isActive ? (colors?.text ?? '') : 'text-gray-500'}`}>
                  {mod?.icon}
                </div>
                <h3 className={`font-semibold text-lg mb-1 ${isActive ? 'text-white' : 'text-gray-300'}`}>
                  {mod?.label ?? ''}
                </h3>
                <p className={`text-xs font-mono ${isActive ? (colors?.text ?? '') : 'text-gray-600'}`}>
                  {mod?.tagline ?? ''}
                </p>
                {isActive && pulseKey > 0 && (
                  <motion.div
                    key={`pulse-${pulseKey}`}
                    initial={{ opacity: 0.9, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.12 }}
                    transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                    className={`absolute inset-0 rounded-xl border-2 ${colors?.border} pointer-events-none`}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="selector-ring"
                    className={`absolute inset-0 rounded-xl border-2 ${colors?.border} pointer-events-none`}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Recommendation panel */}
        <AnimatePresence mode="wait">
          {activeModule && (
            <motion.div
              key={activeModule?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl border p-8 ${colorMap?.[activeModule?.color]?.bg ?? ''} ${colorMap?.[activeModule?.color]?.border ?? ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <span className={`inline-block text-xs font-mono px-3 py-1 rounded-full mb-3 ${
                    colorMap?.[activeModule?.color]?.badge ?? ''
                  }`}>
                    {activeModule?.module ?? ''}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-white mb-2">
                    {activeModule?.label ?? ''} Verification
                  </h3>
                  <p className="text-gray-400 leading-relaxed max-w-lg">
                    {activeModule?.description ?? ''}
                  </p>
                </div>
                <Link
                  href={activeModule?.href ?? '/'}
                  className={`inline-flex items-center justify-center gap-2 whitespace-nowrap px-8 py-4 rounded-lg font-semibold text-base text-white transition-all duration-300 shadow-lg ${
                    activeModule?.color === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/25' :
                    activeModule?.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 shadow-purple-500/25' :
                    activeModule?.color === 'cyan' ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 shadow-cyan-500/25' :
                    'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/25'
                  }`}
                >
                  Launch {activeModule?.module ?? ''}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

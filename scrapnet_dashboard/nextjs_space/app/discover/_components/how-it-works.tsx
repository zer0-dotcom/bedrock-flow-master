'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const steps = [
  {
    title: 'Prism Engine',
    subtitle: 'Carbon Valuation Algorithm',
    description: 'The Prism Engine ingests verified energy data — utility bills, meter reads, grid signals — and refracts it through forensic carbon valuation. Every kilowatt is weighed against the local grid emission factor, time-of-use profile, and sovereign equity multiplier to produce a precise carbon proof value.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
        <line x1="12" y1="22" x2="12" y2="15.5" />
        <polyline points="22 8.5 12 15.5 2 8.5" />
      </svg>
    ),
    gradient: 'from-emerald-500/20 to-emerald-500/0',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
  {
    title: 'Sentinel Gate',
    subtitle: 'Three-Bar Verification Triad',
    description: 'Every proof must pass the Sentinel Gate — a three-bar verification triad. Bar one: data authenticity (source validation). Bar two: temporal consistency (historical cross-reference). Bar three: forensic integrity (algorithmic audit trail). Only verified proofs proceed to the vault.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    gradient: 'from-purple-500/20 to-purple-500/0',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
  },
  {
    title: 'PoE Hash',
    subtitle: 'Proof-of-Evidence',
    description: 'On every verified proof, a cryptographic Proof-of-Evidence hash is generated. This PoE anchors the full forensic audit trail — data sources, Sentinel Gate passage, Prism Engine valuation — into an immutable record written to the Solana ledger.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
        <line x1="12" y1="15" x2="12" y2="18" />
      </svg>
    ),
    gradient: 'from-cyan-500/20 to-cyan-500/0',
    borderColor: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
  },
]

export function HowItWorks() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="py-24 px-6 relative" ref={ref}>
      {/* Background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-purple-600/5 blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-white">
            How It Works
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Three pillars of forensic-grade carbon verification
          </p>
        </div>

        {/* Connecting line for desktop */}
        <div className="hidden lg:block absolute top-[calc(50%+40px)] left-[12%] right-[12%] h-px bg-gradient-to-r from-emerald-500/30 via-purple-500/30 to-cyan-500/30" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {(steps ?? []).map((step: typeof steps[0], i: number) => (
            <motion.div
              key={step?.title ?? i}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className={`relative rounded-2xl border ${step?.borderColor ?? ''} bg-gradient-to-b ${step?.gradient ?? ''} p-8 backdrop-blur-sm`}
            >
              {/* Step number */}
              <div className="absolute -top-4 left-8 px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-xs font-mono text-gray-500">
                0{i + 1}
              </div>

              <div className={`mb-6 ${step?.iconColor ?? ''}`}>
                {step?.icon}
              </div>

              <h3 className="font-display text-xl font-bold text-white mb-1">
                {step?.title ?? ''}
              </h3>
              <p className={`text-sm font-mono mb-4 ${step?.iconColor ?? ''}`}>
                {step?.subtitle ?? ''}
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                {step?.description ?? ''}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

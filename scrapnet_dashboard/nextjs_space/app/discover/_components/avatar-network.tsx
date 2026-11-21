'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

interface Avatar {
  name: string
  role: string
  module: string
  description: string
  color: string
}

const avatars: Avatar[] = [
  {
    name: 'Rael',
    role: 'Sovereign Architect',
    module: 'Vault',
    description: 'Guides vault operations and sovereign equity structuring. Rael oversees the final stage of carbon proof verification and chain attestation.',
    color: 'emerald',
  },
  {
    name: 'Echo',
    role: 'Temporal Analyst',
    module: 'Legacy Healer',
    description: 'Specializes in 9-year lookback temporal analysis. Echo reconstructs historical energy patterns to uncover legacy carbon proofs.',
    color: 'purple',
  },
  {
    name: 'Nexus',
    role: 'Grid Intelligence',
    module: 'BedrockFAD',
    description: 'Maps commercial energy flows through the GhostConverter forensic audit engine. Nexus decodes utility data into verified proofs.',
    color: 'cyan',
  },
  {
    name: 'Lyra',
    role: 'Prism Calibrator',
    module: 'Prism Engine',
    description: 'Fine-tunes the Prism Engine carbon valuation algorithm. Lyra ensures every proof reflects true sovereign equity value.',
    color: 'amber',
  },
  {
    name: 'Seren',
    role: 'Sentinel Warden',
    module: 'Sentinel Gate',
    description: 'Commands the three-bar Sentinel Gate verification triad. Seren validates data authenticity, temporal consistency, and forensic integrity.',
    color: 'rose',
  },
  {
    name: 'Aura',
    role: 'Community Liaison',
    module: 'Ledger',
    description: 'Facilitates industrial carbon verification across Asphalt RAP, Biochar CDR, and Metal Recovery pathways. Aura connects communities to the ledger.',
    color: 'teal',
  },
]

const avatarColorMap: Record<string, { border: string; text: string; bg: string; glow: string }> = {
  emerald: { border: 'border-emerald-500/40', text: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'from-emerald-500/20' },
  purple: { border: 'border-purple-500/40', text: 'text-purple-400', bg: 'bg-purple-500/10', glow: 'from-purple-500/20' },
  cyan: { border: 'border-cyan-500/40', text: 'text-cyan-400', bg: 'bg-cyan-500/10', glow: 'from-cyan-500/20' },
  amber: { border: 'border-amber-500/40', text: 'text-amber-400', bg: 'bg-amber-500/10', glow: 'from-amber-500/20' },
  rose: { border: 'border-rose-500/40', text: 'text-rose-400', bg: 'bg-rose-500/10', glow: 'from-rose-500/20' },
  teal: { border: 'border-teal-500/40', text: 'text-teal-400', bg: 'bg-teal-500/10', glow: 'from-teal-500/20' },
}

export function AvatarNetwork() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 })

  return (
    <section className="py-24 px-6 relative" ref={ref}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-white">
            Avatar Network
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Six AI guides — each specialized in a pillar of the Bedrock ESG verification stack
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(avatars ?? []).map((avatar: Avatar, i: number) => {
            const colors = avatarColorMap?.[avatar?.color ?? ''] ?? avatarColorMap['emerald']
            return (
              <motion.div
                key={avatar?.name ?? i}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`rounded-2xl border ${colors?.border ?? ''} bg-gray-900/60 backdrop-blur-sm overflow-hidden group`}
              >
                {/* Video slot */}
                <AvatarVideoSlot name={avatar?.name ?? ''} color={colors} />

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-lg font-bold text-white">{avatar?.name ?? ''}</h3>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${colors?.bg ?? ''} ${colors?.text ?? ''}`}>
                      {avatar?.module ?? ''}
                    </span>
                  </div>
                  <p className={`text-sm font-semibold mb-2 ${colors?.text ?? ''}`}>{avatar?.role ?? ''}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{avatar?.description ?? ''}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function AvatarVideoSlot({ name, color }: { name: string; color: { border: string; text: string; bg: string; glow: string } }) {
  const [hasError, setHasError] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const slug = (name ?? '').toLowerCase()
  const videoSrc = `/videos/${slug}.mp4`
  const posterSrc = `/videos/posters/${slug}.jpg`

  useEffect(() => {
    const mq = window.matchMedia('(hover: none)')
    const update = () => setIsTouch(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const play = () => {
    videoRef.current?.play()?.catch((err) => console.error(`Avatar video ${slug} failed to play:`, err))
  }

  const stop = () => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = 0
  }

  const handleTap = () => {
    if (!isTouch) return
    const v = videoRef.current
    if (!v) return
    if (v.paused) play()
    else v.pause()
  }

  return (
    <div className="relative aspect-video bg-gray-950 overflow-hidden">
      {!hasError ? (
        <>
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc}
            className="w-full h-full object-cover"
            muted={isMuted}
            loop
            playsInline
            preload="none"
            onError={() => setHasError(true)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') play() }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') stop() }}
            onClick={handleTap}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              const v = videoRef.current
              if (!v) return
              const next = !isMuted
              setIsMuted(next)
              v.muted = next
              if (!next) { v.play()?.catch(() => {}) }   // ensure playback when unmuting
            }}
            aria-label={isMuted ? `Unmute ${name}` : `Mute ${name}`}
            className={`absolute bottom-2 right-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border ${color?.border ?? ''} bg-black/60 backdrop-blur-sm ${color?.text ?? 'text-white'}`}
          >
            {isMuted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" opacity=".4"/><path d="M19 12l3 3m0-6l-3 3" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm11 .5a4.5 4.5 0 0 1 0 5M16.5 7a8 8 0 0 1 0 10"/></svg>
            )}
          </button>
          {isTouch && !isPlaying && (
            <button
              type="button"
              onClick={play}
              aria-label={`Play ${name} video`}
              className="absolute inset-0 z-10 flex items-center justify-center"
            >
              <span className={`flex h-14 w-14 items-center justify-center rounded-full border ${color?.border ?? ''} bg-black/60 backdrop-blur-sm ${color?.text ?? 'text-white'}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </button>
          )}
        </>
      ) : (
        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-b ${color?.glow ?? ''} to-transparent`}>
          <div className={`text-4xl font-display font-bold ${color?.text ?? 'text-gray-500'} mb-2`}>
            {(name ?? '').charAt(0)}
          </div>
          <div className="text-xs text-gray-600 font-mono">Video coming soon</div>
        </div>
      )}
      {/* Overlay gradient at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900/80 to-transparent pointer-events-none" />
    </div>
  )
}

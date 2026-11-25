'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

// ─── S6-04 LIVE AVATAR SYNC ───────────────────────────────────────────────
// Roster synced to the 6 live avatars from /discover (avatar-network.tsx).
// Legacy personas removed entirely; default persona is Rael.
// Assets: portrait /videos/posters/<slug>.jpg, video /videos/<slug>.mp4
//         (slug = name.toLowerCase(); same live assets as /discover).
// Voice: ElevenLabs /api/tts only (no browser TTS); race-condition guarded.
// Contract: POST /api/chat { messages, persona } -> { reply }.
//   apiPersona routes personas without a dedicated /api/chat system prompt
//   to the closest existing non-legacy prompt (see route.ts prompt keys).
// ─────────────────────────────────────────────────────────────────────────

interface PersonaDef {
  id: string;
  name: string;
  role: string;
  apiPersona?: string; // /api/chat persona key override when no own prompt exists
  voiceId: string;
  portrait: string;
  video: string | null; // null → render portrait directly
  color: string;
  accent: string;
  greeting: string;
}

// ─── PERSONA REGISTRY ────────────────────────────────────────────────────
const PERSONAS: PersonaDef[] = [
  {
    id: 'rael',
    name: 'Rael',
    role: 'Sovereign Architect',
    apiPersona: 'aria', // no dedicated prompt in route.ts; closest non-legacy key
    voiceId: 'nPczCjzI2devNBz1zQrb',
    portrait: '/videos/posters/rael.jpg',
    video: '/videos/rael.mp4',
    color: '#10B981',
    accent: 'rgba(16,185,129,',
    greeting:
      "I'm Rael, Sovereign Architect of the Vault. " +
      "I oversee carbon proof verification and on-chain attestation. What are we structuring today?",
  },
  {
    id: 'echo',
    name: 'Echo',
    role: 'Temporal Analyst',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    portrait: '/videos/posters/echo.jpg',
    video: '/videos/echo.mp4',
    color: '#A855F7',
    accent: 'rgba(168,85,247,',
    greeting:
      "Echo here, Temporal Analyst for the Legacy Healer. " +
      "I run 9-year lookback analysis to reconstruct historical energy patterns and surface legacy carbon proofs. Where shall we begin?",
  },
  {
    id: 'nexus',
    name: 'Nexus',
    role: 'Grid Intelligence',
    apiPersona: 'aura', // no dedicated prompt in route.ts; closest non-legacy key
    voiceId: 'XB0fDUnXU5powFXDhCwa',
    portrait: '/videos/posters/nexus.jpg',
    video: '/videos/nexus.mp4',
    color: '#06B6D4',
    accent: 'rgba(6,182,212,',
    greeting:
      "Nexus online, Grid Intelligence for BedrockFAD. " +
      "I map commercial energy flows through the GhostConverter forensic audit engine and turn utility data into verified proofs. Which facility are we decoding?",
  },
  {
    id: 'lyra',
    name: 'Lyra',
    role: 'Prism Calibrator',
    voiceId: 'AZnzlk1XvdvUeBnXmlld',
    portrait: '/videos/posters/lyra.jpg',
    video: '/videos/lyra.mp4',
    color: '#F59E0B',
    accent: 'rgba(245,158,11,',
    greeting:
      "Lyra here, Prism Calibrator for the Prism Engine. " +
      "I tune the carbon valuation algorithm so every proof reflects true sovereign equity value. What are we calibrating?",
  },
  {
    id: 'seren',
    name: 'Seren',
    role: 'Sentinel Warden',
    apiPersona: 'echo', // no dedicated prompt in route.ts; closest non-legacy key
    voiceId: 'kzu3kyvzVxdPA7NdrgD7',
    portrait: '/videos/posters/seren.jpg',
    video: '/videos/seren.mp4',
    color: '#F43F5E',
    accent: 'rgba(244,63,94,',
    greeting:
      "Seren online, Sentinel Warden of the Sentinel Gate. " +
      "I command the three-bar verification triad: data authenticity, temporal consistency, forensic integrity. What needs validating?",
  },
  {
    id: 'aura',
    name: 'Aura',
    role: 'Community Liaison',
    voiceId: 'piTKgcLEGmPE4e6mEKli',
    portrait: '/videos/posters/aura.jpg',
    video: '/videos/aura.mp4',
    color: '#14B8A6',
    accent: 'rgba(20,184,166,',
    greeting:
      "Aura here, Community Liaison for the Ledger. " +
      "I connect communities to verified industrial carbon across Asphalt RAP, Biochar CDR, and Metal Recovery. How can I help?",
  },
];

type Persona = PersonaDef;

// Strip markdown before speaking; cap length to bound ElevenLabs usage.
const toSpeech = (t: string) => t.replace(/[*_`#>~|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 1000);

// ─── TYPES ───────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  content: string;
  personaId?: string;
}

interface ChatWindowProps {
  open?: boolean;
  onClose?: () => void;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────
export default function ChatWindow({ open = false, onClose }: ChatWindowProps) {
  const isOpen = open;
  const [activePersona, setActivePersona] = useState<Persona>(PERSONAS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Drag state
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // Audio + race-condition protection
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const speechReqId = useRef(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── scroll to bottom ──────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── stop all audio ────────────────────────────────────────────────────
  const stopAllAudio = useCallback(() => {
    speechReqId.current += 1;
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.src = '';
      currentAudio.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // ── ElevenLabs TTS — ElevenLabs only, no browser TTS ──────────────
  const speakWithElevenLabs = useCallback(
    async (text: string, voiceId: string) => {
      stopAllAudio();
      const reqId = ++speechReqId.current;

      try {
        setIsSpeaking(true);
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceId }),
        });

        // stale — persona switched while awaiting response
        if (reqId !== speechReqId.current) return;
        if (!res.ok) {
          console.error('[ChatWindow] TTS HTTP', res.status);
          setIsSpeaking(false);
          return;
        }

        const blob = await res.blob();
        if (reqId !== speechReqId.current) return; // stale again

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudio.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (reqId === speechReqId.current) setIsSpeaking(false);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          if (reqId === speechReqId.current) setIsSpeaking(false);
        };

        await audio.play();
      } catch (err) {
        console.error('[ChatWindow] TTS error:', err);
        if (reqId === speechReqId.current) setIsSpeaking(false);
      }
    },
    [stopAllAudio],
  );

  // ── greeting on persona switch + open ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const greeting = activePersona.greeting;
    const voiceId = activePersona.voiceId;
    setMessages([
      {
        role: 'assistant',
        content: greeting,
        personaId: activePersona.id,
      },
    ]);
    speakWithElevenLabs(toSpeech(greeting), voiceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePersona.id, isOpen]);

  // ── stop audio on close ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) stopAllAudio();
  }, [isOpen, stopAllAudio]);

  // ── send message ──────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    // Greeting is UI-only; /api/chat requires history to start with a user turn.
    const history = [...messages, userMsg]
      .filter((m, i) => !(i === 0 && m.role === 'assistant'))
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          persona: activePersona.apiPersona ?? activePersona.id,
        }),
      });

      if (!res.ok) throw new Error(`chat HTTP ${res.status}`);
      const data = await res.json();

      const reply: string = data.reply ?? data.message ?? 'No response.';

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, personaId: activePersona.id },
      ]);

      await speakWithElevenLabs(toSpeech(reply), activePersona.voiceId);
    } catch (err) {
      console.error('[ChatWindow] agent-chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Connection error — check console.',
          personaId: activePersona.id,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, activePersona, speakWithElevenLabs]);

  // ── keyboard ──────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── drag ──────────────────────────────────────────────────────────────
  const onDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
  };

  const onDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setPos({
        x: dragOrigin.current.px + (e.clientX - dragOrigin.current.mx),
        y: dragOrigin.current.py + (e.clientY - dragOrigin.current.my),
      });
    },
    [isDragging],
  );

  const onDragEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDragMove);
      window.addEventListener('mouseup', onDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragEnd);
    };
  }, [isDragging, onDragMove, onDragEnd]);

  // ── persona switch ────────────────────────────────────────────────────
  const switchPersona = useCallback(
    (p: Persona) => {
      if (p.id === activePersona.id) return;
      stopAllAudio();
      setActivePersona(p);
    },
    [activePersona.id, stopAllAudio],
  );

  if (!isOpen) return null;

  // ── colour aliases ────────────────────────────────────────────────────
  const ac = activePersona.accent; // e.g. 'rgba(139,92,246,'
  const color = activePersona.color;

  return (
    <div
      className="fixed z-[9999] select-none"
      style={{
        right: 16,
        bottom: 16,
        transform: `translate(${pos.x}px,${pos.y}px)`,
      }}
    >
      {/* ── panel shell ─────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col overflow-hidden rounded-2xl"
        style={{
          width: 420,
          height: 580,
          background: 'rgba(10,10,20,0.72)',
          backdropFilter: 'blur(18px) saturate(160%)',
          WebkitBackdropFilter: 'blur(18px) saturate(160%)',
          border: `1px solid ${ac}0.35)`,
          boxShadow: `0 0 40px ${ac}0.15), 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        {/* ── DC grid overlay — pointer-events-none ─────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            backgroundImage: `linear-gradient(${ac}0.12) 1px,transparent 1px),linear-gradient(90deg,${ac}0.12) 1px,transparent 1px)`,
            backgroundSize: '28px 28px',
            borderRadius: 'inherit',
            animation: 'gridPulse 4s ease-in-out infinite',
          }}
        />

        {/* ── scanline — pointer-events-none ────────────────────────── */}
        <div
          className="absolute left-0 right-0 h-[2px] pointer-events-none"
          style={{
            zIndex: 1,
            background: `linear-gradient(90deg,transparent,${ac}0.4),transparent)`,
            animation: 'scanline 6s linear infinite',
          }}
        />

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div
          className="relative flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing"
          style={{
            zIndex: 10,
            background: `${ac}0.12)`,
            borderBottom: `1px solid ${ac}0.25)`,
          }}
          onMouseDown={onDragStart}
        >
          {/* avatar + name — pointer-events-none so drag works */}
          <div className="flex items-center gap-3 pointer-events-none">
            {/* video avatar */}
            <div
              className="relative flex-shrink-0 rounded-full overflow-hidden"
              style={{
                width: 48,
                height: 48,
                boxShadow: `0 0 0 2px ${color}`,
              }}
            >
              {activePersona.video && (
              <video
                key={activePersona.id}
                src={activePersona.video}
                muted
                autoPlay
                loop
                playsInline
                poster={activePersona.portrait}
                onError={(e) => {
                  const v = e.currentTarget;
                  v.style.display = 'none';
                  const pic = v.nextElementSibling as HTMLElement | null;
                  if (pic) pic.style.display = 'block';
                }}
                className="w-full h-full object-cover"
              />
              )}
              <img
                key={`${activePersona.id}-fallback`}
                src={activePersona.portrait}
                alt={activePersona.name}
                style={{ display: activePersona.video ? 'none' : 'block' }}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-white leading-tight">
                {activePersona.name}
              </div>
              <div
                className="text-xs leading-tight"
                style={{ color }}
              >
                {activePersona.role}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400">online</span>
                {isSpeaking && (
                  <span
                    className="text-[10px] ml-1"
                    style={{ color }}
                  >
                    ◆ speaking
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* close — explicit pointer-events-auto, stop drag propagation */}
          <button
            className="pointer-events-auto flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ width: 28, height: 28, color: 'rgba(255,255,255,0.6)' }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* ── PERSONA TABS ─────────────────────────────────────────────── */}
        <div
          className="relative flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-hide"
          style={{
            zIndex: 10,
            borderBottom: `1px solid ${ac}0.15)`,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {PERSONAS.map((p) => {
            const active = activePersona.id === p.id;
            return (
              <button
                key={p.id}
                className="pointer-events-auto relative flex flex-col items-center gap-0.5 flex-shrink-0 rounded-lg px-2 py-1 transition-all"
                style={{
                  background: active ? `${p.accent}0.15)` : 'transparent',
                  border: active
                    ? `1px solid ${p.accent}0.45)`
                    : '1px solid transparent',
                }}
                onClick={() => switchPersona(p)}
              >
                <img
                  src={p.portrait}
                  alt={p.name}
                  className="rounded-full object-cover"
                  style={{
                    width: 32,
                    height: 32,
                    border: active
                      ? `2px solid ${p.color}`
                      : '2px solid rgba(255,255,255,0.15)',
                  }}
                />
                <span
                  className="text-[9px] font-medium leading-none"
                  style={{
                    color: active ? p.color : 'rgba(255,255,255,0.45)',
                  }}
                >
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── MESSAGES ─────────────────────────────────────────────────── */}
        <div
          className="relative flex-1 overflow-y-auto px-4 py-3 space-y-3"
          style={{ zIndex: 10 }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[82%] text-sm px-3 py-2 rounded-xl leading-relaxed"
                style={
                  msg.role === 'user'
                    ? {
                        background: `${ac}0.25)`,
                        border: `1px solid ${ac}0.4)`,
                        color: '#E2E8F0',
                      }
                    : {
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#CBD5E1',
                      }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div
                className="px-3 py-2 rounded-xl text-sm"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94A3B8',
                }}
              >
                <span className="animate-pulse">● ● ●</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── INPUT BAR ────────────────────────────────────────────────── */}
        <div
          className="relative flex items-center gap-2 px-3 py-3"
          style={{
            zIndex: 10,
            borderTop: `1px solid ${ac}0.2)`,
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${activePersona.name}…`}
            disabled={isLoading}
            className="pointer-events-auto flex-1 bg-transparent text-sm text-white outline-none"
            style={{ caretColor: color }}
          />

          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="pointer-events-auto flex items-center justify-center rounded-full transition-all disabled:opacity-40 flex-shrink-0"
            style={{ width: 32, height: 32, background: color }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

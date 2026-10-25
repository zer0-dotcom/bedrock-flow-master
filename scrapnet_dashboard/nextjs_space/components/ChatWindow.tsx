'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  persona?: string;
}

interface ChatWindowProps {
  open?: boolean;
  onClose?: () => void;
}

const PERSONAS = [
  { id: 'zero', name: 'Zero', role: 'Systems Architect',  color: 'from-violet-500 to-purple-600', img: '/avatars/zero/idle.mp4' },
  { id: 'nova', name: 'Nova', role: 'Data Intelligence',  color: 'from-blue-500 to-cyan-600', img: '/avatars/nova.avif'    },
  { id: 'aura', name: 'Aura', role: 'ESG Analytics',      color: 'from-emerald-500 to-teal-600', img: '/avatars/aura.avif' },
  { id: 'echo', name: 'Echo', role: 'Audit & Compliance', color: 'from-orange-500 to-amber-600', img: '/avatars/echo.avif' },
  { id: 'aria', name: 'Aria', role: 'Operations Lead',    color: 'from-pink-500 to-rose-600', img: '/avatars/aria.avif'    },
  { id: 'vexa', name: 'Vexa', role: 'Risk Intelligence',  color: 'from-red-500 to-orange-600', img: '/avatars/vexa/idle.mp4'   },
  { id: 'lyra', name: 'Lyra', role: 'Carbon Markets',     color: 'from-indigo-500 to-blue-600', img: '/avatars/lyra.avif'  },
];
const VOICE_PROFILES: Record<string, { pitch: number; rate: number; lang: string }> = {
  zero: { pitch: 0.85, rate: 0.95, lang: 'en-US' }, // deep, authoritative
  nova: { pitch: 1.05, rate: 1.05, lang: 'en-US' }, // bright, data-driven
  aura: { pitch: 1.10, rate: 0.90, lang: 'en-US' }, // warm, measured
  echo: { pitch: 0.90, rate: 1.00, lang: 'en-US' }, // firm, compliance
  aria: { pitch: 1.15, rate: 1.05, lang: 'en-US' }, // sharp, operational
  vexa: { pitch: 0.80, rate: 0.92, lang: 'en-US' }, // cold, risk-focused
  lyra: { pitch: 1.08, rate: 0.98, lang: 'en-US' }, // melodic, analytical
};

const FEMALE_PERSONAS = ['nova','aura','aria','lyra','echo'];

function speakText(text: string, personaId: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*_`#>~]/g, '').slice(0, 400);
  const profile = VOICE_PROFILES[personaId] ?? VOICE_PROFILES['zero'];
  const isFemale = FEMALE_PERSONAS.includes(personaId);

  function doSpeak(voices: SpeechSynthesisVoice[]) {
    const utt = new SpeechSynthesisUtterance(clean);
    utt.pitch = profile.pitch;
    utt.rate  = profile.rate;
    utt.lang  = profile.lang;
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    const femaleKeywords = [
      'female','zira','samantha','victoria','karen','moira','fiona','tessa',
      'hazel','susan','catherine','linda','heera','aria','jenny','michelle',
      'google uk english female','google us english'
    ];
    const maleKeywords = ['male','daniel','david','alex','oliver','fred','rishi','mark','george'];
    const isMaleName = (n: string) => maleKeywords.some(k => n.toLowerCase().includes(k));

    if (isFemale) {
      // Female lock: candidate pool must never contain a male-keyword voice.
      const femalePool = enVoices.filter(v => !isMaleName(v.name));
      const pick =
        femalePool.find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k))) ??
        femalePool.find(v => v.localService) ??
        femalePool[0];
      if (pick) {
        utt.voice = pick;                                // explicit override — the fix
      } else {
        utt.pitch = Math.min(2, profile.pitch + 0.4);    // no female voice on host -> bias feminine
      }
    } else {
      // Male persona ("Zero") path — unchanged behavior.
      let pick = enVoices.find(v => maleKeywords.some(k => v.name.toLowerCase().includes(k)));
      if (!pick) pick = enVoices.find(v => v.localService) ?? enVoices[0];
      if (pick) utt.voice = pick;
    }
    window.speechSynthesis.speak(utt);
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    doSpeak(voices);
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      doSpeak(window.speechSynthesis.getVoices());
      window.speechSynthesis.onvoiceschanged = null;
    };
  }
}


export default function ChatWindow({ open = false, onClose }: ChatWindowProps) {
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dragRef    = useRef<HTMLDivElement>(null);
  const posRef     = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const isDragging = useRef(false);
  const idleVideoRef = useRef<HTMLVideoElement>(null);
  const talkVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Switch avatar video state
  useEffect(() => {
    if (loading) {
      idleVideoRef.current?.pause();
      if (talkVideoRef.current) {
        talkVideoRef.current.currentTime = 0;
        talkVideoRef.current.play().catch(() => {});
      }
    } else {
      talkVideoRef.current?.pause();
      if (idleVideoRef.current) {
        idleVideoRef.current.currentTime = 0;
        idleVideoRef.current.play().catch(() => {});
      }
    }
  }, [loading]);

  // Reset videos on persona change
  useEffect(() => {
    talkVideoRef.current?.pause();
    if (idleVideoRef.current) {
      idleVideoRef.current.currentTime = 0;
      idleVideoRef.current.play().catch(() => {});
    }
  }, [persona]);

  if (!open) return null;

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          persona: persona.id,
        }),
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply ?? data.message ?? 'No response.',
          persona: persona.id,
        },
      ]);
      speakText(data.reply ?? data.message ?? '', persona.id);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Try again.', persona: persona.id },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    isDragging.current = true;
    posRef.current.startX = e.clientX - posRef.current.x;
    posRef.current.startY = e.clientY - posRef.current.y;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return;
    posRef.current.x = e.clientX - posRef.current.startX;
    posRef.current.y = e.clientY - posRef.current.startY;
    if (dragRef.current) {
      dragRef.current.style.transform =
        `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
    }
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end pointer-events-none">
      <div ref={dragRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} className="chat-glass pointer-events-auto w-full max-w-md h-[90vh] flex flex-col border border-border rounded-tl-2xl shadow-2xl overflow-hidden relative">
        <div className="dc-grid" />
        <div className="dc-scanline" />

        {/* Header with live avatar video */}
        <div className={"flex items-center justify-between px-4 py-3 bg-gradient-to-r " + persona.color}>
  
        <div className="dc-grid" />
        <div className="dc-scanline" />
        <div className="chat-content flex items-center gap-3">
            <div className="relative h-14 w-14 rounded-full overflow-hidden bg-black/30 flex-shrink-0 ring-2 ring-white/30">
              {/* Idle video */}
              <video
                ref={idleVideoRef}
                key={persona.id + '-idle'}
                src={"/avatars/" + persona.id + "/idle.mp4"}
                autoPlay
                loop
                muted
                playsInline
                className={"absolute inset-0 w-full h-full object-cover transition-opacity duration-300 " + (loading ? "opacity-0" : "opacity-100")}
              />
              {/* Talking video */}
              <video
                ref={talkVideoRef}
                key={persona.id + '-talk'}
                src={"/avatars/" + persona.id + "/talking.mp4"}
                muted
                playsInline
                loop
                className={"absolute inset-0 w-full h-full object-cover transition-opacity duration-300 " + (loading ? "opacity-100" : "opacity-0")}
              />
              {/* Fallback initial letter */}
              <div className={"absolute inset-0 flex items-center justify-center bg-gradient-to-br " + persona.color + " transition-opacity duration-300 " + (true ? "opacity-0" : "opacity-100")}>
                <span className="text-xl font-bold text-white">{persona.name[0]}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">{persona.name}</p>
              <p className="text-xs text-white/70">{persona.role}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={"h-1.5 w-1.5 rounded-full " + (loading ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
                <span className="text-[10px] text-white/60">{loading ? "responding..." : "online"}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close chat"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Persona switcher */}
        <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-border bg-muted/30">
          {PERSONAS.map(p => (
            <button
              key={p.id}
              onClick={() => setPersona(p)}
              className={"flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all " + (
                persona.id === p.id
                  ? "bg-gradient-to-r " + p.color + " text-white shadow-sm"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              <img src={p.img} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
              {p.name}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#0a0f1e]">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50 gap-2 select-none">
              <div className={"h-12 w-12 rounded-full bg-gradient-to-br " + persona.color + " flex items-center justify-center"}>
                <span className="text-lg font-bold text-white">{persona.name[0]}</span>
              </div>
              <p className="text-sm font-medium">{persona.name} is ready</p>
              <p className="text-xs text-muted-foreground">{persona.role}</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={"flex " + (msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={"max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap " + (
                msg.role === 'user'
                  ? 'bg-indigo-700 text-white rounded-br-sm'
                  : 'bg-[#1a2035] text-white/90 rounded-bl-sm border border-white/10'
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#1a2035] rounded-2xl rounded-bl-sm px-3 py-2.5 border border-white/10">
                <div className="flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay:'0ms'}} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay:'150ms'}} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay:'300ms'}} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-border bg-card">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={"Ask " + persona.name + "..."}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-border bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary max-h-24 overflow-y-auto"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={"flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br " + persona.color + " text-white transition-opacity disabled:opacity-40"}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

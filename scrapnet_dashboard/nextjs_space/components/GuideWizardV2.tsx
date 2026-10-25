"use client";
import React, { useState, useEffect } from 'react';

interface Persona {
  name: string;
  role: string;
  img: string;
  neon: string;
  border: string;
  voiceId?: string;
  halo: string;
  callsign: string;
  intro: string;
}

// 5 Active Personas (CIPHER pulled) with Operations Center assignments
const PERSONAS: Persona[] = [
  { 
    name: 'ARIA', 
    role: 'Asset Discovery & Onboarding Guide', 
    callsign: 'COMMAND // NODE-01',
    img: '/avatars/Astra.avif', 
    neon: '#00F0FF',
    border: 'border-cyan-400',
    halo: 'rgba(0, 240, 255, 0.45)',
    intro: "Transmission live from Bedrock Command. I'm Aria, monitoring thermal waste envelopes. Where would you like to initiate onboarding?" 
  , voiceId:'21m00Tcm4TlvDq8ikWAM'},
  { 
    name: 'ECHO', 
    role: 'Thermodynamics Specialist', 
    callsign: 'ORACLE // ENVELOPE-02',
    img: '/avatars/echo.avif', 
    neon: '#10B981',
    border: 'border-emerald-400',
    halo: 'rgba(16, 185, 129, 0.45)',
    intro: "Echo here at the GhostConverter console. Benchmarking 350 kWth against baseline COP 3.5 chiller displacement across regional utility grids." 
  , voiceId:'EXAVITQu4vr4xnSDxMaL'},
  { 
    name: 'LYRA', 
    role: 'Consensus Gate Sentinel', 
    callsign: 'SENTINEL // TRIAD-03',
    img: '/avatars/lyra.avif', 
    neon: '#F43F5E',
    border: 'border-rose-400',
    halo: 'rgba(244, 63, 94, 0.45)',
    intro: "Sentinel Gate Station reporting. Verification threshold locked at 0.72. EXITZ protocol circuits armed and monitoring." 
  , voiceId:'AZnzlk1XvdvUeBnXmlld'},
  { 
    name: 'NOVA', 
    role: 'Sovereign Yield Architect', 
    callsign: 'SETTLEMENT // WATERFALL-04',
    img: '/avatars/nova.avif', 
    neon: '#F59E0B',
    border: 'border-amber-400',
    halo: 'rgba(245, 158, 11, 0.45)',
    intro: "Nova on deck. Tracking the 10,000 Basis Point dynamic yield ledger. 7,000 BPS mapped directly to facility balance sheets." 
  , voiceId:'MF3mGyEYCl7XYWbV9V6O'},
  { 
    name: 'AURA', 
    role: 'Ambient Facility Intelligence', 
    callsign: 'TELEMETRY // INGEST-05',
    img: '/avatars/aura.avif', 
    neon: '#3B82F6',
    border: 'border-blue-400',
    halo: 'rgba(59, 130, 246, 0.45)',
    intro: "Aura online. Real-time telemetry feed synched across EIA commercial state tariffs and Green Button interval blocks." 
  , voiceId:'piTKgcLEGmPE4e6mEKli'}
];

export default function GuideWizardV2() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCandles, setShowCandles] = useState(false);
  // Randomized start index so a fresh face appears on each landing
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [dialogue, setDialogue] = useState(PERSONAS[0].intro);
  const [inputQuery, setInputQuery] = useState('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Randomize initial persona on client mount
  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * PERSONAS.length);
    setCurrentIndex(randomIdx);
    setDialogue(PERSONAS[randomIdx].intro);
  }, []);

  // Neural voice setup
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setAvailableVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Auto-rotate docked orb every 5s across all 5 active personas
  useEffect(() => {
    if (isOpen) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PERSONAS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const currentPersona = PERSONAS[currentIndex];

  const speak = async (text: string) => {
    setIsSpeaking(true);
    // 1. ElevenLabs neural TTS
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: currentPersona?.voiceId })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
        return;
      }
    } catch(_) {}
    // 2. Browser fallback (female voice)
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.88; u.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const maleNames = ['david','mark','george','guy'];
      const femaleNames = ['zira','jenny','aria','samantha','victoria','google us english'];
      const fv = voices.find(v => v.lang.startsWith('en') && femaleNames.some(k => v.name.toLowerCase().includes(k)) && !maleNames.some(k => v.name.toLowerCase().includes(k))) || voices.find(v => v.lang.startsWith('en') && !maleNames.some(k => v.name.toLowerCase().includes(k)));
      if (fv) u.voice = fv;
      u.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(u);
    } catch(_) { setIsSpeaking(false); }
  };


  const handleOpen = () => {
    setIsOpen(true);
    speak(currentPersona.intro);
  };

  const askGuide = (raw: string) => {
    const q = raw.toLowerCase();
    let reply = "";

    if (q.includes('start') || q.includes('how') || q.includes('onboard') || q.includes('begin')) {
      reply = "Command Center instructions: First, adjust the 'Thermal Waste Input' slider on the left to calibrate heat dissipation. Second, choose your regional EIA state tariff. Third, drop your monthly bill or Green Button XML into the intake zone.";
    } else if (q.includes('cop') || q.includes('chiller') || q.includes('baseline')) {
      reply = "Our telemetry benchmarks against an ASHRAE 90.1 standard COP 3.5 baseline, quantifying avoided electric compressor draw when industrial waste heat is captured.";
    } else if (q.includes('bps') || q.includes('split') || q.includes('yield') || q.includes('money')) {
      reply = "Settlement allocations run on a 10,000 Basis Points smart waterfall: 7,000 BPS (70%) to asset owners, 2,000 BPS to autonomous telemetry nodes, and 1,000 BPS to public green reserve.";
    } else if (q.includes('upload') || q.includes('bill') || q.includes('ocr') || q.includes('green button')) {
      reply = "Intake ready. Feed your PDF billing statements or 15-minute interval Green Button XML into the central ingestion portal. Our OCR audits interval demand instantaneously.";
    } else if (q.includes('exitz') || q.includes('sentinel') || q.includes('triad')) {
      reply = "The Sentinel Gate Triad validates equipment physics, document signatures, and spatial coherence. Once composite score crosses 0.72, EXITZ triggers immutable settlement.";
    } else {
      reply = `Data stream acknowledged by ${currentPersona.callsign}. Routing your request directly through the thermodynamic calculation matrix.`;
    }

    setDialogue(reply);
    speak(reply);
    setInputQuery('');
  };

  const toggleMic = () => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Microphone speech recognition is not supported in this browser.");
      return;
    }
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.onstart = () => setIsListening(true);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInputQuery(text);
      askGuide(text);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.start();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans select-none">
      
      {/* 50% Translucent Command Center Glass HUD */}
      {isOpen && (
        <div 
          style={{
            background: 'rgba(2, 6, 23, 0.50)',
            boxShadow: `0 0 50px ${currentPersona.halo}, inset 0 0 25px rgba(0, 240, 255, 0.15)`
          }}
          className={`w-92 sm:w-[440px] rounded-3xl border-2 ${currentPersona.border} backdrop-blur-3xl p-5 text-white animate-in fade-in zoom-in-95 duration-200`}
        >
          {/* Operations Room Transmission Header */}
          <div className="flex justify-between items-center pb-2.5 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-mono text-xs font-bold tracking-widest text-cyan-200">
                {currentPersona.callsign}
              </span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors text-base font-bold">✕</button>
          </div>

          {/* Command Center Studio Viewport */}
          <div className="relative w-full h-72 rounded-2xl overflow-hidden mb-3.5 border border-cyan-500/30 bg-slate-950/80 flex items-center justify-center">
            
            {/* === COMMAND CENTER BACKDROP SIMULATION === */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-70">
              {/* Server rack grid pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e2238_1px,transparent_1px),linear-gradient(to_bottom,#0e2238_1px,transparent_1px)] bg-[size:18px_18px] opacity-40"></div>
              
              {/* Illuminated Server Rack Nodes Left & Right */}
              <div className="absolute left-2 top-3 w-10 h-64 border border-cyan-500/20 bg-black/60 rounded flex flex-col gap-1.5 p-1">
                <div className="h-2 w-full bg-emerald-500/40 rounded-xs animate-pulse"></div>
                <div className="h-2 w-full bg-cyan-500/40 rounded-xs"></div>
                <div className="h-2 w-full bg-cyan-500/20 rounded-xs"></div>
                <div className="h-2 w-full bg-emerald-500/60 rounded-xs animate-ping [animation-duration:3s]"></div>
                <div className="h-2 w-full bg-cyan-500/30 rounded-xs"></div>
                <div className="h-2 w-full bg-cyan-500/50 rounded-xs"></div>
              </div>
              <div className="absolute right-2 top-3 w-10 h-64 border border-cyan-500/20 bg-black/60 rounded flex flex-col gap-1.5 p-1">
                <div className="h-2 w-full bg-cyan-500/30 rounded-xs"></div>
                <div className="h-2 w-full bg-emerald-500/50 rounded-xs animate-pulse"></div>
                <div className="h-2 w-full bg-cyan-500/40 rounded-xs"></div>
                <div className="h-2 w-full bg-purple-500/40 rounded-xs"></div>
                <div className="h-2 w-full bg-cyan-500/20 rounded-xs"></div>
              </div>

              {/* Data Center Blue/Teal Atmospheric Flare */}
              <div className="absolute inset-0 bg-radial from-cyan-900/30 via-slate-950/40 to-black/80"></div>
              
              {/* Top Operations Ribbon */}
              <div className="absolute top-2 inset-x-14 flex justify-between font-mono text-[8px] text-cyan-400/60 border-b border-cyan-500/10 pb-1">
                <span>FEED: LIVE // COMM-SEC</span>
                <span>ENC: HCS-256</span>
                <span className="text-emerald-400">LATENCY: 18ms</span>
              </div>
            </div>

            {/* === 50% TRANSLUCENT AVATAR BROADCAST LAYER === */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <img 
                src={currentPersona.img} 
                alt={currentPersona.name} 
                className={`w-full h-full object-contain object-center opacity-50 contrast-125 brightness-110 mix-blend-screen transition-all duration-300 ${isSpeaking ? 'scale-105 drop-shadow-[0_0_30px_rgba(0,240,255,0.85)]' : 'scale-100 drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]'}`}
                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
              />
            </div>

            {/* In-Call Status Ribbon */}
            <div className="absolute bottom-2.5 left-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-cyan-400/40 font-mono text-[10px] text-cyan-200">
              <div className={`w-1 h-3 bg-cyan-400 rounded-full ${isSpeaking ? 'animate-bounce' : ''}`}></div>
              <div className={`w-1 h-4 bg-emerald-400 rounded-full ${isSpeaking ? 'animate-bounce [animation-delay:0.15s]' : ''}`}></div>
              <span>{isSpeaking ? 'TRANSMITTING' : 'MONITORING'}</span>
            </div>

            {/* Next Console Guide */}
            <button 
              onClick={() => {
                const next = (currentIndex + 1) % PERSONAS.length;
                setCurrentIndex(next);
                setDialogue(PERSONAS[next].intro);
                speak(PERSONAS[next].intro);
              }}
              className="absolute bottom-2.5 right-3 z-20 text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/45 transition-all shadow-[0_0_10px_rgba(0,240,255,0.5)]"
            >
              SWITCH STATION ➔
            </button>
          </div>

          {/* Dialogue Feed */}
          <div className="mb-3.5 min-h-[60px] px-1">
            <span className="block font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
              // {currentPersona.name} // {currentPersona.role}
            </span>
            <p className="text-xs text-white leading-relaxed drop-shadow-[0_0_10px_rgba(0,240,255,0.5)] font-medium">
              "{dialogue}"
            </p>
          </div>

          {/* Quick Guidance Chips */}
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            <button 
              onClick={() => askGuide('How do I get started?')}
              className="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/60 text-emerald-300 hover:bg-emerald-500/30 transition-all"
            >
              🚀 How to Start
            </button>
            <button 
              onClick={() => askGuide('How do I upload utility bills?')}
              className="text-[10px] font-mono px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/60 text-cyan-300 hover:bg-cyan-500/30 transition-all"
            >
              📄 Upload Bill
            </button>
            <button 
              onClick={() => askGuide('What is COP 3.5 baseline?')}
              className="text-[10px] font-mono px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/60 text-purple-300 hover:bg-purple-500/30 transition-all"
            >
              ⚡ COP 3.5
            </button>
          </div>

          {/* Interactive Chat & Mic Input */}
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askGuide(inputQuery)}
              placeholder="Ask anything or click 🚀 How to Start..."
              className="w-full bg-black/40 border border-cyan-400/50 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-cyan-100 placeholder-slate-400 focus:outline-none focus:border-cyan-300 focus:shadow-[0_0_20px_rgba(0,240,255,0.6)] font-mono"
            />
            <button 
              onClick={toggleMic}
              className={`absolute right-2 p-1.5 rounded-lg border transition-all ${isListening ? 'bg-rose-500/50 border-rose-400 text-rose-300 animate-pulse' : 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200'}`}
              title="Speak via Microphone"
            >
              🎙️
            </button>
          </div>
        </div>
      )}

      {/* Docked Floating Orb */}
      <button 
        onClick={handleOpen} 
        style={{
          boxShadow: `0 0 30px ${currentPersona.halo}, inset 0 0 10px ${currentPersona.neon}`
        }}
        className={`w-16 h-16 rounded-full bg-black/40 border-2 ${currentPersona.border} backdrop-blur-2xl flex items-center justify-center overflow-hidden hover:scale-110 active:scale-95 transition-all duration-300`}
      >
        <img 
          src={currentPersona.img} 
          alt={currentPersona.name} 
          className="w-full h-full object-contain object-top" 
          onError={(e) => { e.currentTarget.style.display = 'none'; }} 
        />
      </button>

    </div>
  );
}

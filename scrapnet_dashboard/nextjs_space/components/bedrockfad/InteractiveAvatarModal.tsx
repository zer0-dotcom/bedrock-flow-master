"use client";

import React, { useState, useRef } from "react";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  VoiceEmotion,
} from "./heygen-stub";

export default function InteractiveAvatarModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [statusLog, setStatusLog] = useState("Standing by");

  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarInstance = useRef<StreamingAvatar | null>(null);

  const startSession = async () => {
    setIsInitializing(true);
    setStatusLog("Negotiating cryptographic handshake...");

    try {
      const tokenRes = await fetch("/api/heygen-token", { method: "POST" });
      const { token, error } = await tokenRes.json();
      if (error || !token) throw new Error(error || "No token returned");

      const avatar = new StreamingAvatar({ token });
      avatarInstance.current = avatar;

// @ts-ignore
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        setStatusLog("Signal verified // Stream online");
        setStreamActive(true);
        if (videoRef.current && event.detail) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.play().catch(console.error);
        }
      });

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        setStatusLog("Stream terminated");
        setStreamActive(false);
      });

      setStatusLog("Spawning Zer0 neural engine...");
      await avatar.createStartAvatar({
        quality: AvatarQuality.Medium,
        avatarName: process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID || "",
        voice: {
          voiceId: process.env.NEXT_PUBLIC_HEYGEN_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
          rate: 1.0,
          emotion: VoiceEmotion.EXCITED,
        },
      });
    } catch (err: any) {
      console.error("Live streaming connection failed:", err);
      setStatusLog("Connection failed. Check server credentials.");
    } finally {
      setIsInitializing(false);
    }
  };

  const terminateSession = async () => {
    if (avatarInstance.current) {
      await avatarInstance.current.stopAvatar();
      avatarInstance.current = null;
    }
    setStreamActive(false);
    setIsOpen(false);
  };

  const handleSpeak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !avatarInstance.current || !streamActive) return;

    const message = inputMessage.trim();
    setInputMessage("");
    setStatusLog("Transmitting instruction...");

    await avatarInstance.current.speak({
      text: message,
      taskType: TaskType.TALK,
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            if (!streamActive) startSession();
          }}
          className="flex items-center gap-3 bg-black/85 border border-cyan-400/50 text-cyan-300 px-5 py-3.5 rounded-full backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:border-cyan-300 transition-all cursor-pointer"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <span className="text-sm font-bold tracking-wider uppercase">Live Zer0 Avatar</span>
        </button>
      )}

      {isOpen && (
        <div className="w-[360px] sm:w-[450px] bg-zinc-950/95 border border-cyan-500/40 rounded-3xl backdrop-blur-2xl shadow-[0_0_50px_rgba(6,182,212,0.35)] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/20 bg-cyan-950/30">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${streamActive ? "bg-cyan-400 animate-pulse" : "bg-amber-400"}`}></span>
              <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-200">
                Zer0 // Live Telemetry Feed
              </h3>
            </div>
            <button onClick={terminateSession} className="text-zinc-400 hover:text-cyan-300 text-sm cursor-pointer">✕</button>
          </div>

          <div className="relative w-full aspect-video bg-black flex items-center justify-center border-b border-cyan-500/20">
            {(!streamActive || isInitializing) && (
              <div className="flex flex-col items-center gap-3 p-6 text-center text-cyan-400 text-xs">
                <span className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
                <span className="font-mono text-[11px] tracking-wide">{statusLog}</span>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${streamActive ? "block" : "hidden"}`}
            />
          </div>

          <form onSubmit={handleSpeak} className="p-3.5 bg-black/50 flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={streamActive ? "Ask Zer0 about verified ESG assets..." : "Connecting..."}
              disabled={!streamActive}
              className="flex-1 bg-zinc-900/90 border border-cyan-500/30 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 disabled:opacity-40 transition"
            />
            <button
              type="submit"
              disabled={!streamActive || !inputMessage.trim()}
              className="bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-cyan-500/40 disabled:opacity-40 transition cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

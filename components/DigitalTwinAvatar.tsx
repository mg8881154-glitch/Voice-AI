'use client';

import { useState, useEffect } from 'react';
import type { AgentState } from 'agora-agent-client-toolkit';
import { Sparkles, User, Radio, Cpu, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DigitalTwinAvatarProps {
  agentState: AgentState | null;
  className?: string;
}

export function DigitalTwinAvatar({ agentState, className }: DigitalTwinAvatarProps) {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [blinking, setBlinking] = useState(false);

  // Lip-sync speech oscillation simulation when speaking
  useEffect(() => {
    if (agentState === 'speaking') {
      const interval = setInterval(() => {
        setMouthOpen(prev => !prev);
      }, 140);
      return () => clearInterval(interval);
    } else {
      setMouthOpen(false);
    }
  }, [agentState]);

  // Natural blinking simulation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 180);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  const isSpeaking = agentState === 'speaking';
  const isListening = agentState === 'listening';
  const isThinking = agentState === 'thinking';

  return (
    <div className={cn('relative flex flex-col items-center justify-center p-6', className)}>
      {/* Ambient Neural Lighting Rings */}
      <div
        className={cn(
          'pointer-events-none absolute h-72 w-72 rounded-full opacity-30 blur-3xl transition-all duration-700',
          isSpeaking && 'bg-violet-500 opacity-60 scale-110',
          isListening && 'bg-emerald-500 opacity-50 scale-105',
          isThinking && 'bg-indigo-500 opacity-60 animate-pulse',
          !isSpeaking && !isListening && !isThinking && 'bg-indigo-600/30'
        )}
      />

      {/* Holographic Frame */}
      <div className="relative flex items-center justify-center">
        {/* Outer Rotating HUD Rings */}
        <div className={cn(
          'absolute h-64 w-64 rounded-full border border-dashed border-indigo-500/20 transition-all duration-1000',
          isSpeaking && 'border-violet-500/40 animate-radar-sweep',
          isThinking && 'border-indigo-400/50 animate-spin'
        )} />
        <div className="absolute h-56 w-56 rounded-full border border-white/10" />

        {/* Avatar Capsule */}
        <div className="relative h-48 w-48 rounded-full overflow-hidden border-2 border-white/20 glass-panel shadow-2xl shadow-indigo-500/20 flex items-center justify-center bg-gradient-to-b from-slate-900 via-indigo-950 to-black">
          
          {/* Synthesized Visual Human Avatar SVG Graphics */}
          <svg viewBox="0 0 200 200" className="h-full w-full select-none" aria-hidden="true">
            <defs>
              <linearGradient id="avatarSkin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f7d0b3" />
                <stop offset="100%" stopColor="#e5b493" />
              </linearGradient>
              <linearGradient id="avatarHair" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2d1b4e" />
                <stop offset="100%" stopColor="#1e1035" />
              </linearGradient>
              <linearGradient id="suitGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* Background Ambient Glow */}
            <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="2" />

            {/* Suit & Shoulders */}
            <path d="M40 200 C40 155, 75 145, 100 145 C125 145, 160 155, 160 200 Z" fill="url(#suitGrad)" />
            {/* Lapels */}
            <path d="M85 148 L100 180 L115 148 Z" fill="#ffffff" opacity="0.9" />
            <path d="M96 155 L100 195 L104 155 Z" fill="#6366f1" />

            {/* Neck */}
            <rect x="88" y="120" width="24" height="30" rx="4" fill="url(#avatarSkin)" />

            {/* Head Contour */}
            <ellipse cx="100" cy="95" rx="36" ry="46" fill="url(#avatarSkin)" />

            {/* Hair Back */}
            <path d="M60 90 C58 50, 142 50, 140 90 C138 120, 134 135, 134 135 C134 135, 120 70, 100 70 C80 70, 66 135, 66 135 Z" fill="url(#avatarHair)" />

            {/* Eyes (Blinking state) */}
            {blinking ? (
              <>
                <line x1="82" y1="92" x2="94" y2="92" stroke="#2d1b4e" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="106" y1="92" x2="118" y2="92" stroke="#2d1b4e" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                {/* Left Eye */}
                <ellipse cx="88" cy="92" rx="5.5" ry="4" fill="#ffffff" />
                <circle cx="88" cy="92" r="3" fill="#312e81" />
                <circle cx="87" cy="91" r="1" fill="#ffffff" />

                {/* Right Eye */}
                <ellipse cx="112" cy="92" rx="5.5" ry="4" fill="#ffffff" />
                <circle cx="112" cy="92" r="3" fill="#312e81" />
                <circle cx="111" cy="91" r="1" fill="#ffffff" />
              </>
            )}

            {/* Eyebrows */}
            <path d="M81 84 Q88 81 95 84" stroke="#2d1b4e" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M105 84 Q112 81 119 84" stroke="#2d1b4e" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Nose */}
            <path d="M100 93 L97 107 L103 107" stroke="#c28e6c" strokeWidth="1.5" strokeLinecap="round" fill="none" />

            {/* Mouth / Lip Sync Animation */}
            {isSpeaking && mouthOpen ? (
              // Open mouth during speech vowel phonemes
              <ellipse cx="100" cy="120" rx="7" ry="5.5" fill="#601222" />
            ) : isSpeaking ? (
              // Closed/smile phoneme during speech
              <path d="M92 119 Q100 125 108 119" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            ) : (
              // Neutral resting smile
              <path d="M93 119 Q100 123 107 119" stroke="#b45309" strokeWidth="2" strokeLinecap="round" fill="none" />
            )}

            {/* Cybernetic Audio Visor / Neural Halo Accent */}
            <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="1" strokeDasharray="6 4" />
          </svg>

          {/* Live Audio Activity Overlay */}
          {isSpeaking && (
            <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-0.5">
              <span className="w-1 rounded-full bg-violet-400 animate-equalizer-1" />
              <span className="w-1 rounded-full bg-indigo-400 animate-equalizer-2" />
              <span className="w-1 rounded-full bg-cyan-400 animate-equalizer-3" />
              <span className="w-1 rounded-full bg-violet-400 animate-equalizer-4" />
              <span className="w-1 rounded-full bg-indigo-400 animate-equalizer-5" />
            </div>
          )}
        </div>
      </div>

      {/* State Caption Pill */}
      <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-1.5 backdrop-blur-md shadow-lg">
        <span className={cn(
          'h-2 w-2 rounded-full',
          isSpeaking && 'bg-violet-400 animate-ping',
          isListening && 'bg-emerald-400 animate-pulse',
          isThinking && 'bg-indigo-400 animate-bounce',
          !isSpeaking && !isListening && !isThinking && 'bg-slate-400'
        )} />
        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
          {isSpeaking ? 'Nova Lip-Syncing Speech…' : isListening ? 'Listening Attentively…' : isThinking ? 'Synthesizing Neural Response…' : 'Digital Twin Ready'}
        </span>
      </div>
    </div>
  );
}

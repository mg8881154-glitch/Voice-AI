'use client';

import { useState, useEffect } from 'react';
import {
  UserCheck, Volume2, Play, Check, Sparkles, X,
  Sliders, Mic2, ShieldCheck, Zap
} from 'lucide-react';
import {
  PERSONAS,
  VOICES,
  PersonaId,
  PersonaConfig,
  VoiceOption,
  getActivePersona,
  setActivePersona,
  getActiveVoice,
  setActiveVoice,
} from '@/lib/personaStore';
import { cn } from '@/lib/utils';

interface VoicePersonaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoicePersonaSelectorModal({ isOpen, onClose }: VoicePersonaSelectorModalProps) {
  const [currentPersona, setCurrentPersona] = useState<PersonaConfig>(PERSONAS.professional);
  const [currentVoice, setCurrentVoice] = useState<VoiceOption>(VOICES[0]);
  const [isPlayingAudition, setIsPlayingAudition] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentPersona(getActivePersona());
      setCurrentVoice(getActiveVoice());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPersona = (id: PersonaId) => {
    setActivePersona(id);
    setCurrentPersona(PERSONAS[id]);
  };

  const handleSelectVoice = (voiceId: string) => {
    setActiveVoice(voiceId);
    const found = VOICES.find(v => v.id === voiceId);
    if (found) setCurrentVoice(found);
  };

  const handleAudition = (voice: VoiceOption) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    setIsPlayingAudition(voice.id);

    const utterance = new SpeechSynthesisUtterance(voice.sampleAuditionText);
    utterance.rate = 1.0;
    utterance.pitch = voice.gender === 'female' ? 1.15 : 0.95;

    // Pick best matching speech synthesis voice if available
    const available = window.speechSynthesis.getVoices();
    if (voice.accent.includes('Indian')) {
      const match = available.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
      if (match) utterance.voice = match;
    } else if (voice.accent.includes('UK')) {
      const match = available.find(v => v.lang.includes('GB') || v.lang.includes('en-GB'));
      if (match) utterance.voice = match;
    }

    utterance.onend = () => setIsPlayingAudition(null);
    utterance.onerror = () => setIsPlayingAudition(null);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-up">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/15 glass-panel-elevated p-6 sm:p-8 shadow-2xl shadow-black/80 flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">AI Voice &amp; Persona Customizer</h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-400">
                  <Sparkles className="h-3 w-3" /> Adaptive LLM + TTS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tailor Nova&apos;s speech tone, objection strategy, and voice accent to your target customer.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-6">
          
          {/* Section 1: Persona / Strategy */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> 1. Select Sales Persona
              </span>
              <span className="text-[11px] text-slate-400">Controls prompt tactics &amp; closing urgency</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.values(PERSONAS) as PersonaConfig[]).map(persona => {
                const isSelected = currentPersona.id === persona.id;
                return (
                  <button
                    key={persona.id}
                    onClick={() => handleSelectPersona(persona.id)}
                    className={cn(
                      'flex flex-col text-left rounded-2xl border p-4 transition-all relative overflow-hidden',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-white">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-white/10 text-indigo-300 w-fit mb-2">
                      {persona.badge}
                    </span>
                    <h4 className="text-xs font-bold text-white leading-snug">{persona.name}</h4>
                    <p className="text-[11px] text-indigo-200/70 font-medium mt-0.5">{persona.tagline}</p>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed line-clamp-2">
                      {persona.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: AI Voice Selection */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                <Mic2 className="h-3.5 w-3.5" /> 2. Select AI TTS Voice
              </span>
              <span className="text-[11px] text-slate-400">MiniMax speech synthesis engine</span>
            </div>

            <div className="space-y-2">
              {VOICES.map(voice => {
                const isSelected = currentVoice.id === voice.id;
                const isAuditioning = isPlayingAudition === voice.id;
                return (
                  <div
                    key={voice.id}
                    onClick={() => handleSelectVoice(voice.id)}
                    className={cn(
                      'flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all',
                      isSelected
                        ? 'border-violet-500/50 bg-violet-950/30 shadow-md shadow-violet-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs',
                        isSelected ? 'bg-violet-500 text-white' : 'bg-white/10 text-slate-300'
                      )}>
                        {voice.gender === 'female' ? '👩' : '👨'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white">{voice.name}</p>
                          <span className="text-[10px] font-mono text-violet-300 bg-violet-500/15 border border-violet-500/20 px-1.5 rounded">
                            {voice.accent}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          Languages: {voice.language}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAudition(voice);
                        }}
                        className={cn(
                          'flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all',
                          isAuditioning
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 animate-pulse'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                        )}
                      >
                        {isAuditioning ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                            Playing…
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3 w-3 text-violet-400" />
                            Audition
                          </>
                        )}
                      </button>

                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-white">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Zap className="h-3.5 w-3.5 text-violet-400" />
            <span>Active Persona: <strong className="text-white">{currentPersona.name}</strong> ({currentVoice.name})</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            Save Persona
          </button>
        </div>
      </div>
    </div>
  );
}

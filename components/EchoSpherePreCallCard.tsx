'use client';

import { useState } from 'react';
import { Loader2, Mic, Zap, Languages, Headphones, GraduationCap, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  normalisePhoneNumber,
  isValidPhoneNumber,
  formatPhoneDisplay,
  dialOut,
  saveCallToHistory,
  setActiveCall,
  type CallStatus,
  type PhoneCallRecord,
} from '@/lib/phoneCallService';
import { cn } from '@/lib/utils';
import { InstallAppButton } from './InstallAppButton';

type EchoSpherePreCallCardProps = {
  isLoading: boolean;
  error: string | null;
  onStartConversation: () => void;
};

const FEATURES = [
  { icon: <Languages className="h-4 w-4" />, text: 'Hindi & English voice' },
  { icon: <Headphones className="h-4 w-4" />, text: 'Customer Support' },
  { icon: <GraduationCap className="h-4 w-4" />, text: 'Study & Learning AI' },
  { icon: <Zap className="h-4 w-4" />, text: 'Sub-500ms response' },
];

export function EchoSpherePreCallCard({
  isLoading,
  error,
  onStartConversation,
}: EchoSpherePreCallCardProps) {
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneStatus, setPhoneStatus] = useState<CallStatus>('idle');

  const handleDirectCall = async () => {
    const normalised = normalisePhoneNumber(phoneInput);
    if (!isValidPhoneNumber(normalised)) {
      setPhoneError('Enter a valid number with country code, e.g. +91 98765 43210');
      return;
    }
    setPhoneError(null);
    setPhoneStatus('dialing');

    const record: PhoneCallRecord = {
      id: `pre_${Date.now()}`,
      direction: 'outbound',
      phoneNumber: normalised,
      status: 'dialing',
      startedAt: new Date().toISOString(),
      channelName: 'echosphere-precall',
    };
    saveCallToHistory(record);

    try {
      const res = await dialOut({
        phoneNumber: normalised,
        channelName: 'echosphere-precall',
        agentUid: '123456',
      });
      setActiveCall(res.callId, 'echosphere-precall');
      setPhoneStatus('ringing');

      // After ringing → show success message
      setTimeout(() => setPhoneStatus('connected'), 3000);
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : 'Call failed');
      setPhoneStatus('failed');
    }
  };

  return (
    <div className="relative mx-auto flex w-full max-w-sm flex-col items-center animate-fade-up">
      {/* Glow backdrop */}
      <div
        className="pointer-events-none absolute -inset-24 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, hsl(221 83% 53%) 0%, hsl(258 90% 66%) 60%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className="relative w-full rounded-2xl border border-white/10 px-8 py-10 shadow-2xl text-center"
        style={{
          background:
            'linear-gradient(160deg, rgba(30,30,50,0.95) 0%, rgba(15,15,30,0.98) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
            style={{
              background:
                'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(258 90% 66%) 100%)',
            }}
          >
            <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8" aria-hidden="true">
              <circle cx="16" cy="16" r="6" fill="white" opacity="0.9" />
              <path d="M8 16 Q8 8 16 8 Q24 8 24 16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
              <path d="M4 16 Q4 4 16 4 Q28 4 28 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35" />
              <path d="M8 16 Q8 24 16 24 Q24 24 24 16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
              <path d="M4 16 Q4 28 16 28 Q28 28 28 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">EchoSphere</h1>
            <p className="mt-0.5 text-sm font-medium text-indigo-300/80">
              Bilingual Voice AI Assistant (Hindi & English)
            </p>
          </div>
        </div>

        <p className="mb-6 text-sm leading-6 text-slate-400">
          Talk with Nova in Hindi, Hinglish, or English — for customer support, study help, and instant answers.
        </p>

        {/* Feature pills */}
        <div className="mb-6 grid grid-cols-2 gap-2">
          {FEATURES.map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-slate-300"
            >
              <span className="text-indigo-400">{icon}</span>
              {text}
            </div>
          ))}
        </div>

        {/* ── Browser conversation CTA ── */}
        <Button
          onClick={onStartConversation}
          disabled={isLoading}
          className="h-11 w-full rounded-xl text-sm font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-100"
          style={{
            background: isLoading
              ? undefined
              : 'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(258 90% 66%) 100%)',
            border: 'none',
            color: 'white',
          }}
          aria-label={isLoading ? 'Starting conversation…' : 'Start conversation with Nova'}
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting to Nova…</>
          ) : (
            <><Mic className="mr-2 h-4 w-4" />Start Conversation</>
          )}
        </Button>

        {error && (
          <p className="mt-3 text-xs text-destructive" role="alert">{error}</p>
        )}

        {/* ── Divider ── */}
        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 border-t border-white/10" />
          <span className="text-[11px] text-slate-500 font-medium">OR</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        {/* ── Phone call section ── */}
        {!showPhoneInput ? (
          <button
            onClick={() => setShowPhoneInput(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/50 transition-all"
          >
            <Phone className="h-4 w-4" />
            Get a Call on Your Phone
          </button>
        ) : (
          <div className="space-y-3 text-left animate-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                Nova will call you
              </p>
              <button
                onClick={() => { setShowPhoneInput(false); setPhoneStatus('idle'); setPhoneError(null); }}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {phoneStatus === 'idle' || phoneStatus === 'failed' ? (
              <>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => { setPhoneInput(e.target.value); setPhoneError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleDirectCall()}
                  placeholder="+91 98765 43210"
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 focus:bg-white/8 transition-colors"
                  aria-label="Phone number"
                />
                {phoneError && (
                  <p className="text-xs text-destructive">{phoneError}</p>
                )}
                <button
                  onClick={handleDirectCall}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 active:scale-[0.98] transition-all"
                >
                  <Phone className="h-4 w-4" />
                  Call Me Now
                </button>
              </>
            ) : phoneStatus === 'dialing' ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
                <p className="text-sm font-medium text-slate-300">
                  Dialing {formatPhoneDisplay(normalisePhoneNumber(phoneInput))}…
                </p>
              </div>
            ) : phoneStatus === 'ringing' ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-20" />
                  <Phone className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-slate-300">
                  Ringing {formatPhoneDisplay(normalisePhoneNumber(phoneInput))}…
                </p>
                <p className="text-xs text-slate-500">Pick up to speak with Nova</p>
              </div>
            ) : phoneStatus === 'connected' ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20')}>
                  <Phone className="h-5 w-5 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-emerald-400">Call Connected!</p>
                <p className="text-xs text-slate-400 text-center">
                  Nova is on the line. You can also{' '}
                  <button
                    className="text-indigo-400 underline underline-offset-2"
                    onClick={() => { setShowPhoneInput(false); setPhoneStatus('idle'); }}
                  >
                    switch to browser
                  </button>{' '}
                  for the full dashboard.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {!showPhoneInput && !isLoading && (
          <div className="mt-4 w-full">
            <InstallAppButton />
          </div>
        )}

        {!showPhoneInput && !isLoading && !error && (
          <p className="mt-3 text-[11px] text-slate-500">
            Microphone access required for browser · Works best with headphones
          </p>
        )}
      </div>
    </div>
  );
}

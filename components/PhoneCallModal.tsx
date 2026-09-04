'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone, PhoneOff, PhoneCall, PhoneMissed, Clock,
  X, Delete, History, CheckCircle2, AlertCircle,
  Volume2, VolumeX,
} from 'lucide-react';
import {
  dialOut,
  endPhoneCall,
  normalisePhoneNumber,
  isValidPhoneNumber,
  formatPhoneDisplay,
  formatCallDuration,
  loadCallHistory,
  saveCallToHistory,
  setActiveCall,
  clearActiveCall,
  getActiveCallId,
  CALL_STATUS_LABELS,
  CALL_STATUS_COLORS,
  type CallStatus,
  type PhoneCallRecord,
} from '@/lib/phoneCallService';
import { useLeadStore } from '@/lib/LeadContext';
import { cn } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

type PhoneCallModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Agora channel the AI agent is already in — PSTN leg bridges into this */
  channelName?: string;
  /** Agora UID of the AI agent in the channel */
  agentUid?: string;
};

// ─── Dialpad keys ─────────────────────────────────────────────────────────────

const DIALPAD: { label: string; sub?: string }[][] = [
  [{ label: '1' }, { label: '2', sub: 'ABC' }, { label: '3', sub: 'DEF' }],
  [{ label: '4', sub: 'GHI' }, { label: '5', sub: 'JKL' }, { label: '6', sub: 'MNO' }],
  [{ label: '7', sub: 'PQRS' }, { label: '8', sub: 'TUV' }, { label: '9', sub: 'WXYZ' }],
  [{ label: '*' }, { label: '0', sub: '+' }, { label: '#' }],
];

// ─── Component ────────────────────────────────────────────────────────────────

export function PhoneCallModal({ isOpen, onClose, channelName, agentUid }: PhoneCallModalProps) {
  const { lead } = useLeadStore();

  const [tab, setTab] = useState<'dialpad' | 'history'>('dialpad');
  const [input, setInput] = useState('');
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [activeRecord, setActiveRecord] = useState<PhoneCallRecord | null>(null);
  const [history, setHistory] = useState<PhoneCallRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer ref for connected call duration
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ringing simulation ref
  const ringingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill from lead context
  useEffect(() => {
    if (isOpen) {
      setHistory(loadCallHistory());
      setError(null);
    }
  }, [isOpen]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (ringingRef.current) clearTimeout(ringingRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Dial ────────────────────────────────────────────────────────────────────

  const handleDial = useCallback(async () => {
    const normalised = normalisePhoneNumber(input);
    if (!isValidPhoneNumber(normalised)) {
      setError('Please enter a valid phone number with country code, e.g. +91 98765 43210');
      return;
    }

    setError(null);
    setCallStatus('dialing');
    setElapsedSeconds(0);

    const record: PhoneCallRecord = {
      id: `rec_${Date.now()}`,
      direction: 'outbound',
      phoneNumber: normalised,
      displayName: lead.name,
      status: 'dialing',
      startedAt: new Date().toISOString(),
      channelName,
    };
    setActiveRecord(record);
    saveCallToHistory(record);
    setHistory(loadCallHistory());

    try {
      const res = await dialOut({
        phoneNumber: normalised,
        channelName: channelName ?? 'echosphere-default',
        agentUid: agentUid ?? '123456',
        displayName: lead.name,
      });

      const updated = { ...record, id: res.callId, status: 'ringing' as CallStatus };
      setActiveRecord(updated);
      setCallStatus('ringing');
      setActiveCall(res.callId, channelName ?? 'echosphere-default');
      saveCallToHistory(updated);
      setHistory(loadCallHistory());

      // Simulate ring → connected after 3s (mock mode)
      ringingRef.current = setTimeout(() => {
        const connected: PhoneCallRecord = {
          ...updated,
          status: 'connected',
          connectedAt: new Date().toISOString(),
        };
        setActiveRecord(connected);
        setCallStatus('connected');
        saveCallToHistory(connected);
        setHistory(loadCallHistory());
        startTimer();
      }, 3000);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect call';
      setError(msg);
      setCallStatus('failed');
      const failed = { ...record, status: 'failed' as CallStatus, endedAt: new Date().toISOString() };
      setActiveRecord(failed);
      saveCallToHistory(failed);
      setHistory(loadCallHistory());
    }
  }, [input, lead.name, channelName, agentUid, startTimer]);

  // ── Hang up ─────────────────────────────────────────────────────────────────

  const handleHangUp = useCallback(async () => {
    if (ringingRef.current) clearTimeout(ringingRef.current);
    stopTimer();

    const callId = getActiveCallId() ?? activeRecord?.id ?? '';
    const ch = channelName ?? 'echosphere-default';

    try {
      if (callId) await endPhoneCall({ callId, channelName: ch });
    } catch {
      // best-effort
    }

    clearActiveCall();
    setCallStatus('ended');

    if (activeRecord) {
      const ended: PhoneCallRecord = {
        ...activeRecord,
        status: 'ended',
        endedAt: new Date().toISOString(),
        durationSeconds: elapsedSeconds,
      };
      setActiveRecord(ended);
      saveCallToHistory(ended);
      setHistory(loadCallHistory());
    }

    // Return to idle after 2s
    setTimeout(() => {
      setCallStatus('idle');
      setActiveRecord(null);
      setInput('');
    }, 2000);
  }, [activeRecord, channelName, elapsedSeconds, stopTimer]);

  // ── Dialpad input ────────────────────────────────────────────────────────────

  const appendDigit = (digit: string) => {
    if (callStatus !== 'idle') return;
    setInput((prev) => (prev.length < 16 ? prev + digit : prev));
    setError(null);
  };

  const deleteDigit = () => {
    setInput((prev) => prev.slice(0, -1));
    setError(null);
  };

  const isInCall = callStatus === 'dialing' || callStatus === 'ringing' || callStatus === 'connected';
  const canDial = input.trim().length >= 7 && callStatus === 'idle';

  if (!isOpen) return null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isInCall) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Phone call"
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(258 90% 66%) 100%)' }}
            >
              <Phone className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Call Customer</h2>
              <p className="text-[10px] text-muted-foreground">Nova dials out to the customer</p>
            </div>
          </div>
          {!isInCall && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b border-border">
          {(['dialpad', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 text-xs font-semibold capitalize transition-colors',
                tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'dialpad' ? 'Dial Pad' : 'Call History'}
            </button>
          ))}
        </div>

        {/* ── DIALPAD TAB ── */}
        {tab === 'dialpad' && (
          <div className="px-5 py-5 space-y-4">

            {/* Active call status banner */}
            {isInCall && (
              <div
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border py-4',
                  callStatus === 'connected'
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-indigo-500/30 bg-indigo-500/10',
                )}
              >
                {/* Animated ring */}
                <div className="relative flex h-16 w-16 items-center justify-center">
                  {(callStatus === 'ringing' || callStatus === 'dialing') && (
                    <>
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-20" />
                      <span className="absolute inline-flex h-3/4 w-3/4 animate-ping rounded-full bg-indigo-400 opacity-30 animation-delay-150" />
                    </>
                  )}
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full',
                      callStatus === 'connected'
                        ? 'bg-emerald-500/20'
                        : 'bg-indigo-500/20',
                    )}
                  >
                    <Phone
                      className={cn(
                        'h-6 w-6',
                        callStatus === 'connected' ? 'text-emerald-400' : 'text-indigo-400',
                      )}
                    />
                  </div>
                </div>

                <p className="text-sm font-semibold text-foreground">
                  {activeRecord?.displayName ?? formatPhoneDisplay(activeRecord?.phoneNumber ?? '')}
                </p>
                <p className={cn('text-xs font-medium', CALL_STATUS_COLORS[callStatus])}>
                  {CALL_STATUS_LABELS[callStatus]}
                </p>
                {callStatus === 'connected' && (
                  <p className="text-sm font-mono text-emerald-400 mt-1">
                    {formatCallDuration(elapsedSeconds)}
                  </p>
                )}
              </div>
            )}

            {/* Ended / failed status */}
            {(callStatus === 'ended' || callStatus === 'failed') && (
              <div
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3',
                  callStatus === 'ended'
                    ? 'border-border bg-muted/30'
                    : 'border-destructive/30 bg-destructive/10',
                )}
              >
                {callStatus === 'ended' ? (
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                )}
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {callStatus === 'ended' ? 'Call Ended' : 'Call Failed'}
                  </p>
                  {callStatus === 'ended' && elapsedSeconds > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      Duration: {formatCallDuration(elapsedSeconds)}
                    </p>
                  )}
                  {callStatus === 'failed' && error && (
                    <p className="text-[10px] text-destructive">{error}</p>
                  )}
                </div>
              </div>
            )}

            {/* Number display */}
            {callStatus === 'idle' && (
              <div className="relative flex items-center rounded-xl border border-border bg-background/50 px-4 py-3">
                <span className="flex-1 min-w-0 text-center text-xl font-mono font-semibold tracking-widest text-foreground">
                  {input ? formatPhoneDisplay(normalisePhoneNumber(input)) : (
                    <span className="text-muted-foreground/40 text-base font-sans font-normal tracking-normal">
                      Enter phone number
                    </span>
                  )}
                </span>
                {input && (
                  <button
                    onClick={deleteDigit}
                    className="ml-2 shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Delete digit"
                  >
                    <Delete className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Country code hint */}
            {callStatus === 'idle' && (
              <p className="text-center text-[10px] text-muted-foreground">
                Include country code · e.g. +91 for India, +1 for US
              </p>
            )}

            {/* Error */}
            {error && callStatus === 'idle' && (
              <p className="text-center text-xs text-destructive">{error}</p>
            )}

            {/* Dialpad grid */}
            {callStatus === 'idle' && (
              <div className="grid grid-cols-3 gap-2">
                {DIALPAD.flat().map(({ label, sub }) => (
                  <button
                    key={label}
                    onClick={() => appendDigit(label)}
                    className="flex h-14 flex-col items-center justify-center rounded-xl border border-border bg-background/50 hover:bg-muted active:scale-95 transition-all select-none"
                  >
                    <span className="text-lg font-semibold text-foreground leading-none">{label}</span>
                    {sub && <span className="text-[9px] font-medium text-muted-foreground mt-0.5 tracking-widest">{sub}</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              {/* Mute (during call) */}
              {callStatus === 'connected' && (
                <button
                  onClick={() => setMuted((v) => !v)}
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-colors',
                    muted
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted',
                  )}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              )}

              {/* Main action: Dial or Hang Up */}
              {isInCall ? (
                <button
                  onClick={handleHangUp}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-destructive py-3 text-sm font-semibold text-white hover:bg-destructive/90 active:scale-95 transition-all"
                  aria-label="Hang up"
                >
                  <PhoneOff className="h-5 w-5" />
                  Hang Up
                </button>
              ) : callStatus === 'idle' ? (
                <button
                  onClick={handleDial}
                  disabled={!canDial}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white active:scale-95 transition-all',
                    canDial
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg'
                      : 'bg-muted text-muted-foreground cursor-not-allowed',
                  )}
                  aria-label="Dial"
                >
                  <Phone className="h-5 w-5" />
                  Call
                </button>
              ) : (
                /* ended / failed — new call button */
                <button
                  onClick={() => { setCallStatus('idle'); setInput(''); setActiveRecord(null); setError(null); }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-muted py-3 text-sm font-semibold text-foreground hover:bg-muted/80 transition-all"
                >
                  <Phone className="h-5 w-5" />
                  New Call
                </button>
              )}
            </div>

            {/* Demo mode notice */}
            <p className="text-center text-[10px] text-muted-foreground/50">
              Demo mode · Connect NEXT_AGORA_CUSTOMER_ID & SECRET for live PSTN
            </p>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div className="flex flex-col">
            {history.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/30">
                  <History className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">No call history yet</p>
                <p className="text-xs text-muted-foreground/60">Your calls will appear here</p>
              </div>
            ) : (
              <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                {history.map((rec) => (
                  <HistoryRow
                    key={rec.id}
                    record={rec}
                    onRedial={(num) => {
                      setTab('dialpad');
                      setInput(num.replace('+', ''));
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── History row ──────────────────────────────────────────────────────────────

function HistoryRow({
  record,
  onRedial,
}: {
  record: PhoneCallRecord;
  onRedial: (num: string) => void;
}) {
  const StatusIcon =
    record.status === 'connected' || record.status === 'ended'
      ? PhoneCall
      : record.status === 'missed' || record.status === 'failed'
      ? PhoneMissed
      : Phone;

  const iconColor =
    record.status === 'failed' || record.status === 'missed'
      ? 'text-destructive'
      : 'text-emerald-400';

  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      <StatusIcon className={cn('h-4 w-4 shrink-0', iconColor)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {record.displayName ?? formatPhoneDisplay(record.phoneNumber)}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{new Date(record.startedAt).toLocaleString()}</span>
          {record.durationSeconds != null && record.durationSeconds > 0 && (
            <span>· {formatCallDuration(record.durationSeconds)}</span>
          )}
        </div>
      </div>
      <button
        onClick={() => onRedial(record.phoneNumber)}
        className="shrink-0 rounded-lg border border-border p-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        aria-label={`Redial ${record.phoneNumber}`}
        title="Redial"
      >
        <Phone className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  UserCheck,
  Headphones,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowRight,
  Smile,
  Meh,
  Frown,
  Loader2,
  CheckCircle2,
  User,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DomainId, DOMAIN_PRESETS } from '@/lib/domainEngine';

export interface EscalationEvent {
  action: 'TRANSFER_TO_HUMAN';
  reason: string;
  sentiment?: 'positive' | 'neutral' | 'frustrated';
  domain?: DomainId;
}

interface HumanEscalationBannerProps {
  channelName?: string;
  activeDomain?: DomainId;
  transcriptText?: string;
  onManualEscalate?: (reason: string) => void;
  isEscalated?: boolean;
  className?: string;
}

export function HumanEscalationBanner({
  channelName = 'echosphere-live',
  activeDomain = 'healthcare',
  transcriptText = '',
  onManualEscalate,
  isEscalated = false,
  className,
}: HumanEscalationBannerProps) {
  const [callDuration, setCallDuration] = useState<number>(0);
  const [handoverState, setHandoverState] = useState<'ai_active' | 'transferring' | 'human_connected'>('ai_active');
  const [handoverReason, setHandoverReason] = useState<string>('');
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overrideInputReason, setOverrideInputReason] = useState<string>('Customer requested human assistance');
  const [sentimentScore, setSentimentScore] = useState<number>(88); // 0 to 100

  const domain = DOMAIN_PRESETS[activeDomain] || DOMAIN_PRESETS.healthcare;

  // Track call duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync external escalation state
  useEffect(() => {
    if (isEscalated && handoverState === 'ai_active') {
      setHandoverState('transferring');
      const timer = setTimeout(() => {
        setHandoverState('human_connected');
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [isEscalated, handoverState]);

  // Analyze transcript dynamically for frustration / sentiment & automated handover triggers
  useEffect(() => {
    if (!transcriptText || handoverState !== 'ai_active') return;

    const lower = transcriptText.toLowerCase();

    // Check for explicit AI JSON handover tag in transcript
    if (lower.includes('transfer_to_human') || lower.includes('"action": "transfer_to_human"')) {
      try {
        const match = transcriptText.match(/\{"action":\s*"TRANSFER_TO_HUMAN"[^}]*\}/i);
        if (match) {
          const parsed = JSON.parse(match[0]);
          executeHandover(parsed.reason || 'AI handover trigger initiated');
          return;
        }
      } catch {
        executeHandover('AI determined query requires human intervention');
        return;
      }
    }

    // Sentiment detection based on keywords
    const frustrationWords = ['terrible', 'angry', 'human', 'person', 'supervisor', 'manager', 'stupid', 'ridiculous', 'useless', 'cancel', 'insaan', 'shikayat', 'gussa', 'bakwas'];
    const positiveWords = ['great', 'excellent', 'thank', 'perfect', 'awesome', 'helpful', 'badiya', 'shukriya', 'dhanyawad'];

    let matchedFrustration = 0;
    let matchedPositive = 0;

    frustrationWords.forEach(w => {
      if (lower.includes(w)) matchedFrustration += 1;
    });
    positiveWords.forEach(w => {
      if (lower.includes(w)) matchedPositive += 1;
    });

    if (matchedFrustration > 0) {
      const drop = Math.min(60, matchedFrustration * 22);
      const newScore = Math.max(18, 85 - drop);
      setSentimentScore(newScore);

      if (newScore < 35 && handoverState === 'ai_active') {
        executeHandover('Frustration detected: sentiment dipped below threshold');
      }
    } else if (matchedPositive > 0) {
      setSentimentScore(Math.min(96, 75 + matchedPositive * 8));
    }
  }, [transcriptText, handoverState]);

  const executeHandover = (reason: string) => {
    setHandoverReason(reason);
    setHandoverState('transferring');
    if (onManualEscalate) {
      onManualEscalate(reason);
    }
    // Simulate warm transfer to human queue
    setTimeout(() => {
      setHandoverState('human_connected');
    }, 2500);
  };

  const handleManualOverride = () => {
    setShowOverrideModal(false);
    executeHandover(overrideInputReason);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentDetails = (score: number) => {
    if (score >= 70) {
      return {
        label: 'Positive',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/30',
        progressColor: 'bg-emerald-400',
        icon: <Smile className="h-4 w-4 text-emerald-400" />,
      };
    } else if (score >= 45) {
      return {
        label: 'Neutral',
        color: 'text-amber-400',
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/30',
        progressColor: 'bg-amber-400',
        icon: <Meh className="h-4 w-4 text-amber-400" />,
      };
    } else {
      return {
        label: 'Frustrated / Low',
        color: 'text-rose-400',
        bg: 'bg-rose-500/15',
        border: 'border-rose-500/30',
        progressColor: 'bg-rose-500',
        icon: <Frown className="h-4 w-4 text-rose-400" />,
      };
    }
  };

  const sentiment = getSentimentDetails(sentimentScore);

  return (
    <div className={cn('w-full transition-all duration-300', className)}>
      {/* ─── State 1: Active AI Call with Real-Time Sentiment & Manual Override ─── */}
      {handoverState === 'ai_active' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/70 via-background/80 to-slate-950/70 p-3.5 backdrop-blur-md shadow-lg shadow-indigo-950/30">
          {/* Left: AI Call Status */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  AI Call in Progress
                </span>
                <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                  {domain.personaName} • {domain.badge}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground/70" />
                  {formatDuration(callDuration)}
                </span>
                <span>•</span>
                <span className="truncate max-w-[140px] sm:max-w-[200px] text-indigo-300/80">
                  Channel: {channelName}
                </span>
              </div>
            </div>
          </div>

          {/* Center / Middle: Real-Time Sentiment Gauge */}
          <div className="flex items-center gap-3 min-w-[200px] max-w-[280px] flex-1">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground font-medium flex items-center gap-1">
                  Live Sentiment
                </span>
                <span className={cn('font-semibold flex items-center gap-1', sentiment.color)}>
                  {sentiment.icon}
                  {sentiment.label} ({sentimentScore}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden border border-white/5">
                <div
                  className={cn('h-full transition-all duration-500 rounded-full', sentiment.progressColor)}
                  style={{ width: `${sentimentScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Manual Human Agent Override Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOverrideModal(true)}
              type="button"
              className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 transition-all hover:bg-amber-500/20 hover:border-amber-500/60 active:scale-95 shadow-sm shadow-amber-950/20"
            >
              <Headphones className="h-3.5 w-3.5 text-amber-400" />
              <span>Request Human Agent</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── State 2: Warm Handover Transitioning ─── */}
      {handoverState === 'transferring' && (
        <div className="rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-950/60 via-slate-900/90 to-amber-950/60 p-4 backdrop-blur-md shadow-xl animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Transferring Call to Human Specialist...
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reason: <span className="text-foreground font-medium">{handoverReason || 'Manual user request'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300/80 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
              <Radio className="h-3.5 w-3.5 animate-ping text-amber-400" />
              Syncing 100% Transcript &amp; Audio
            </div>
          </div>
        </div>
      )}

      {/* ─── State 3: Live Human Agent Connected ─── */}
      {handoverState === 'human_connected' && (
        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-background/90 to-teal-950/70 p-4 backdrop-blur-md shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400">
                <UserCheck className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Human Specialist Connected
                  </span>
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                    LIVE HUMAN ESCALATION
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Senior Representative <span className="font-semibold text-foreground">Marcus Vance</span> has joined with full historical transcript access.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Audio &amp; Chat Routing Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirmation Modal for Manual Override ─── */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="rounded-xl bg-amber-500/20 p-2.5 border border-amber-500/30">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Request Human Agent Transfer</h3>
                <p className="text-xs text-muted-foreground">Nova AI will pause and pass the call to a human specialist.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Reason for Handover (Optional):
              </label>
              <select
                value={overrideInputReason}
                onChange={e => setOverrideInputReason(e.target.value)}
                className="w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Customer explicitly requested human assistance">Customer explicitly requested human assistance</option>
                <option value="Complex domain requirement exceeds AI scope">Complex domain requirement exceeds AI scope</option>
                <option value="High-value enterprise negotiation or custom contract">High-value enterprise negotiation or custom contract</option>
                <option value="Urgent escalation / emergency triage">Urgent escalation / emergency triage</option>
              </select>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Real-Time Transcript Continuity
              </p>
              <p>The human agent immediately receives the entire AI conversation history, qualification parameters, and customer intent.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualOverride}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-bold text-white hover:opacity-90 active:scale-95 transition shadow-lg shadow-amber-500/20"
              >
                Confirm Transfer <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

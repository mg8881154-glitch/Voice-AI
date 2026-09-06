'use client';

import React, { useState } from 'react';
import {
  Layers,
  Network,
  Cpu,
  Languages,
  UserCheck,
  Code2,
  Workflow,
  Sparkles,
  X,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  Radio,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArchitectureModal({ isOpen, onClose }: ArchitectureModalProps) {
  const [activeTab, setActiveTab] = useState<'architecture' | 'state_flow' | 'implementation' | 'prompt'>('architecture');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-3xl border border-indigo-500/30 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-card/60 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                Voice AI System Architecture &amp; Integration Guide
                <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-indigo-300 border border-indigo-500/30">
                  v3.0 ENTERPRISE
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Human-in-the-Loop Handover • Dynamic Multilingual Routing • Domain Persona Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex shrink-0 border-b border-border/40 bg-background/50 px-6 gap-2 pt-2">
          {[
            { id: 'architecture', label: 'System Architecture', icon: <Layers className="h-4 w-4" /> },
            { id: 'state_flow', label: 'State Management Flow', icon: <Workflow className="h-4 w-4" /> },
            { id: 'implementation', label: 'Step-by-Step Implementation', icon: <Code2 className="h-4 w-4" /> },
            { id: 'prompt', label: 'Nova System Prompt Spec', icon: <Sparkles className="h-4 w-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ─── TAB 1: System Architecture ─── */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              {/* Architecture Diagram Overview */}
              <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-background to-slate-950 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                    <Cpu className="h-4 w-4" /> End-to-End Low-Latency Pipeline Architecture
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    &lt; 380ms Turnaround Latency
                  </span>
                </div>

                {/* Pipeline Stages Visual */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-5 text-center">
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 space-y-1">
                    <p className="text-[10px] font-mono text-blue-400 font-bold uppercase">1. Real-Time Audio</p>
                    <p className="text-xs font-bold text-foreground">Agora SD-RTN™</p>
                    <p className="text-[10px] text-muted-foreground">WebRTC Opus Audio • Sub-35ms Global RTT</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
                    <p className="text-[10px] font-mono text-emerald-400 font-bold uppercase">2. Multilingual STT</p>
                    <p className="text-xs font-bold text-foreground">Deepgram Nova-3</p>
                    <p className="text-[10px] text-muted-foreground">Language Auto-Detect • Dual Channel Diarization</p>
                  </div>
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 space-y-1">
                    <p className="text-[10px] font-mono text-indigo-400 font-bold uppercase">3. Persona &amp; Routing</p>
                    <p className="text-xs font-bold text-foreground">GPT-4o / Claude 3.5</p>
                    <p className="text-[10px] text-muted-foreground">Domain Presets • Handover Intent Parsing</p>
                  </div>
                  <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 space-y-1">
                    <p className="text-[10px] font-mono text-violet-400 font-bold uppercase">4. Expressive Voice</p>
                    <p className="text-xs font-bold text-foreground">ElevenLabs / MiniMax</p>
                    <p className="text-[10px] text-muted-foreground">Emotion Matching • Sub-200ms First-Byte Audio</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
                    <p className="text-[10px] font-mono text-amber-400 font-bold uppercase">5. Human Escalation</p>
                    <p className="text-xs font-bold text-foreground">Agora RTM + SIP</p>
                    <p className="text-[10px] text-muted-foreground">100% Transcript Sync • Live Agent Warm Routing</p>
                  </div>
                </div>
              </div>

              {/* The 3 Core Pillars */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border/80 bg-card/40 p-5 space-y-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">1. Human-in-the-Loop Handover</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Monitors customer sentiment, speech hesitation, and explicit intent tags. When threshold triggers fire, calls route via Agora RTM to live human queues with synchronized state and qualification records.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card/40 p-5 space-y-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                    <Languages className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">2. Dynamic Multilingual Routing</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Zero-shot auto-detection across 30+ regional and global languages. Dynamically formats regional dialect Latin phonetics (e.g. Hinglish) for fluid TTS naturalness without robotic accents.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card/40 p-5 space-y-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">3. Domain-Specific Persona Engine</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Instantly toggles system presets between Healthcare, Real Estate, E-Commerce, and EdTech. Pairs voice agents with dynamic synchronized UI media cards (doctor slots, property showcases, product specs, syllabus).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 2: State Management Flow ─── */}
          {activeTab === 'state_flow' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border/80 bg-card/40 p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-indigo-400" /> State Lifecycle &amp; Transition Architecture
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      step: 'A',
                      title: 'Session Bootstrap & Domain Handshake',
                      desc: 'Client selects domain (Healthcare / Real Estate / E-Commerce / EdTech) and requests RTC + RTM tokens. Server binds domain system prompt and initializes Deepgram multilingual STT.',
                      badge: 'INITIALIZE',
                      color: 'text-blue-400',
                    },
                    {
                      step: 'B',
                      title: 'Real-Time Conversational Turn & Sentiment Tracking',
                      desc: 'Every customer utterance is streamed via Agora WebRTC to Deepgram. In-flight transcripts are passed to useSentimentAnalyzer() to compute real-time sentiment percentages (Positive / Neutral / Frustrated).',
                      badge: 'IN_PROGRESS',
                      color: 'text-indigo-400',
                    },
                    {
                      step: 'C',
                      title: 'Handover Condition Evaluation',
                      desc: 'Evaluation runs on dual axes: (1) Sentiment drop below 35% / repeated objection loop, or (2) AI emits {"action": "TRANSFER_TO_HUMAN", "reason": "..."} when exceeding capability.',
                      badge: 'DECISION',
                      color: 'text-amber-400',
                    },
                    {
                      step: 'D',
                      title: 'Warm Human Transfer & Transcript Sync',
                      desc: 'AgoraVoiceAI emits AGENT_STATE_CHANGED -> "TRANSFERRING". The live human representative receives the Agora RTC audio stream and full historical JSON transcript over Agora RTM.',
                      badge: 'HANDOVER',
                      color: 'text-emerald-400',
                    },
                  ].map(flow => (
                    <div key={flow.step} className="flex items-start gap-4 rounded-xl border border-border/50 bg-background/50 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/20 border border-primary/40 font-mono font-bold text-xs text-primary">
                        {flow.step}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-foreground">{flow.title}</h4>
                          <span className={cn('text-[10px] font-mono font-bold', flow.color)}>{flow.badge}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{flow.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 3: Step-by-Step Implementation Guide ─── */}
          {activeTab === 'implementation' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border/80 bg-card/40 p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Step-by-Step Integration Guide (React + Next.js / Node.js)
                </h3>

                <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                  <div className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-2">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Step 1: Install Required Core Packages
                    </p>
                    <pre className="rounded-lg bg-black/60 p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                      pnpm add agora-rtc-sdk-ng agora-rtc-react agora-rtm agora-agents agora-agent-client-toolkit
                    </pre>
                  </div>

                  <div className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-2">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Step 2: Configure Server-Side Route with Multilingual STT &amp; Domain Engine
                    </p>
                    <p>
                      In <code className="text-indigo-300">app/api/invite-agent/route.ts</code>, configure DeepgramSTT with <code className="text-emerald-300">language: &apos;multi&apos;</code> and inject <code className="text-indigo-300">generateDomainSystemPrompt(domain)</code> into the agent instructions.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-2">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Step 3: Embed HumanEscalationBanner &amp; DomainPersonaSelector
                    </p>
                    <p>
                      Import <code className="text-indigo-300">&lt;HumanEscalationBanner /&gt;</code> and <code className="text-indigo-300">&lt;DomainPersonaSelector /&gt;</code> into your call view. Listen for <code className="text-amber-300">TRANSFER_TO_HUMAN</code> transcript events to bridge the caller to a live representative.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 4: Nova System Prompt Spec ─── */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Complete Production Nova System Prompt (Bilingual + Domains + Handover)
                </h3>
                <button
                  onClick={() => copyCode(`You are Nova, an enterprise conversational AI agent...`)}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied Prompt' : 'Copy Spec'}
                </button>
              </div>

              <pre className="rounded-2xl border border-border/80 bg-black/80 p-5 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[420px]">
{`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE DIRECTIVE 1: DYNAMIC MULTILINGUAL ROUTING (30+ LANGUAGES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Automatic Language Detection: Detect the language spoken by the customer in their first words and respond natively in that EXACT language.
- Supported: English, Hindi, Hinglish (Roman alphabet), Spanish, French, German, Mandarin, Japanese, Arabic, Portuguese, etc.
- Language Mirroring: Switch seamlessly if the customer changes languages mid-call.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE DIRECTIVE 2: 4 INTERCHANGEABLE DOMAINS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Healthcare: Patient intake, doctor appointment slots, symptom triage, insurance verification.
2. Real Estate: Luxury listings, price breakdowns, 3D walkthroughs, scheduling viewings.
3. E-Commerce: Real-time order tracking (#ES-98421), product comparisons, return labels.
4. EdTech: Course counseling, curriculum breakdowns, admissions, scholarship matching.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE DIRECTIVE 3: HUMAN-IN-THE-LOOP HANDOVER PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trigger immediately upon:
- Explicit request ("I want to talk to a human", "Transfer me to a supervisor")
- Sentiment drop / frustrated repetition
- High-risk medical emergency, binding legal contracts, or fraud disputes.

OUTPUT FORMAT (JSON EVENT ON OWN LINE):
{"action": "TRANSFER_TO_HUMAN", "reason": "<concise reason>", "sentiment": "<positive|neutral|frustrated>", "domain": "<domain>"}`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

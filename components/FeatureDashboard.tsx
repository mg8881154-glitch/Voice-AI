'use client';
/**
 * EchoSphere Feature Dashboard — v2
 *
 * Improvements:
 *  1. Full navigation header with nav links, user profile avatar, New Call CTA
 *  2. Feature cards with explicit CTA buttons + hover glow effects
 *  3. Live status indicators on cards (Agent Ready, S3 status, etc.)
 *  4. Floating Action Button (FAB) for quick AI agent launch
 */

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Video, Radio, FileText, MessageSquare, Sparkles,
  ArrowLeft, Phone, LayoutDashboard, BarChart2,
  ClipboardList, Settings, ChevronDown, Bell,
  Play, Headphones, Eye,
  Circle, ExternalLink, User, Zap,
} from 'lucide-react';
import { VideoCallComponent }   from './VideoCallComponent';
import { LiveDemoComponent }    from './LiveDemoComponent';
import { LiveCaptionsOverlay }  from './LiveCaptionsOverlay';
import { ChatPanel }            from './ChatPanel';
import { RecordingControls }    from './RecordingControls';
import { cn } from '@/lib/utils';

const AIAgentLauncher = dynamic(() => import('./AIAgentLauncher'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type FeatureId = 'video' | 'demo' | 'ai-agent' | 'transcription' | 'chat' | 'recording';
type NavPage   = 'dashboard' | 'analytics' | 'call-logs' | 'settings';

interface StatusIndicator {
  label: string;
  color: 'green' | 'amber' | 'blue' | 'muted';
  pulse?: boolean;
}

interface Feature {
  id: FeatureId;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cta: string;
  badge?: string;
  color: string;
  borderGlow: string;
  gradient: string;
  status: StatusIndicator;
}

// ─── Feature definitions ──────────────────────────────────────────────────────

const FEATURES: Feature[] = [
  {
    id: 'video',
    icon: <Video className="h-6 w-6" />,
    title: '1-on-1 Video Call',
    subtitle: 'HD audio & video with screen share and recording',
    cta: 'Start Call',
    color: 'text-blue-400',
    borderGlow: 'hover:border-blue-500/60 hover:shadow-blue-500/10',
    gradient: 'from-blue-500/10 to-blue-600/5',
    status: { label: 'Ready', color: 'green', pulse: false },
  },
  {
    id: 'demo',
    icon: <Radio className="h-6 w-6" />,
    title: 'Live Product Demo',
    subtitle: 'Stream to multiple clients with live chat & Q&A',
    cta: 'Go Live',
    badge: 'LIVE',
    color: 'text-red-400',
    borderGlow: 'hover:border-red-500/60 hover:shadow-red-500/10',
    gradient: 'from-red-500/10 to-red-600/5',
    status: { label: 'Stream Ready', color: 'green', pulse: false },
  },
  {
    id: 'ai-agent',
    icon: <Sparkles className="h-6 w-6" />,
    title: 'AI Voice Sales Agent',
    subtitle: 'Nova — intelligent real-time voice agent',
    cta: 'Launch Agent',
    badge: 'AI',
    color: 'text-indigo-400',
    borderGlow: 'hover:border-indigo-500/60 hover:shadow-indigo-500/10',
    gradient: 'from-indigo-500/10 to-violet-600/5',
    status: { label: 'Agent Ready', color: 'green', pulse: true },
  },
  {
    id: 'transcription',
    icon: <FileText className="h-6 w-6" />,
    title: 'Live Transcription',
    subtitle: 'Real-time captions, speaker detection & export',
    cta: 'Open Transcript',
    color: 'text-emerald-400',
    borderGlow: 'hover:border-emerald-500/60 hover:shadow-emerald-500/10',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    status: { label: 'STT Online', color: 'green', pulse: false },
  },
  {
    id: 'chat',
    icon: <MessageSquare className="h-6 w-6" />,
    title: 'Chat & Presence',
    subtitle: 'Real-time messaging with online/offline tracking',
    cta: 'Open Chat',
    color: 'text-amber-400',
    borderGlow: 'hover:border-amber-500/60 hover:shadow-amber-500/10',
    gradient: 'from-amber-500/10 to-amber-600/5',
    status: { label: '3 Online', color: 'amber', pulse: true },
  },
  {
    id: 'recording',
    icon: <Circle className="h-6 w-6 fill-current" />,
    title: 'Call Recording',
    subtitle: 'Cloud recording saved to S3 with playback',
    cta: 'View Logs',
    color: 'text-rose-400',
    borderGlow: 'hover:border-rose-500/60 hover:shadow-rose-500/10',
    gradient: 'from-rose-500/10 to-rose-600/5',
    status: { label: 'S3 Connected', color: 'blue', pulse: false },
  },
];

// ─── Nav links ────────────────────────────────────────────────────────────────

const NAV_LINKS: { id: NavPage; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',  label: 'Dashboard',  icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'analytics',  label: 'Analytics',  icon: <BarChart2 className="h-4 w-4" /> },
  { id: 'call-logs',  label: 'Call Logs',  icon: <ClipboardList className="h-4 w-4" /> },
  { id: 'settings',   label: 'Settings',   icon: <Settings className="h-4 w-4" /> },
];

// ─── Status dot component ─────────────────────────────────────────────────────

function StatusDot({ status }: { status: StatusIndicator }) {
  const dotColor =
    status.color === 'green' ? 'bg-emerald-400' :
    status.color === 'amber' ? 'bg-amber-400' :
    status.color === 'blue'  ? 'bg-blue-400' :
    'bg-muted-foreground/40';

  const textColor =
    status.color === 'green' ? 'text-emerald-400' :
    status.color === 'amber' ? 'text-amber-400' :
    status.color === 'blue'  ? 'text-blue-400' :
    'text-muted-foreground/60';

  return (
    <span className={cn('flex items-center gap-1.5 text-[10px] font-semibold', textColor)}>
      <span className="relative flex h-1.5 w-1.5">
        {status.pulse && (
          <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', dotColor)} />
        )}
        <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', dotColor)} />
      </span>
      {status.label}
    </span>
  );
}

// ─── CTA button colors per feature ───────────────────────────────────────────

const CTA_STYLES: Record<FeatureId, string> = {
  'video':         'border-blue-500/40 text-blue-400 hover:bg-blue-500/15 hover:border-blue-500/70',
  'demo':          'border-red-500/40 text-red-400 hover:bg-red-500/15 hover:border-red-500/70',
  'ai-agent':      'border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/15 hover:border-indigo-500/70',
  'transcription': 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/70',
  'chat':          'border-amber-500/40 text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/70',
  'recording':     'border-rose-500/40 text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/70',
};

const CTA_ICONS: Record<FeatureId, React.ReactNode> = {
  'video':         <Phone className="h-3.5 w-3.5" />,
  'demo':          <Radio className="h-3.5 w-3.5" />,
  'ai-agent':      <Headphones className="h-3.5 w-3.5" />,
  'transcription': <FileText className="h-3.5 w-3.5" />,
  'chat':          <MessageSquare className="h-3.5 w-3.5" />,
  'recording':     <Eye className="h-3.5 w-3.5" />,
};

// ─── Placeholder pages ────────────────────────────────────────────────────────

function PlaceholderPage({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/20 text-muted-foreground/40">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">Coming soon — this section is under construction.</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FeatureDashboard() {
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null);
  const [activePage, setActivePage]       = useState<NavPage>('dashboard');
  const [profileOpen, setProfileOpen]     = useState(false);
  const [fabOpen, setFabOpen]             = useState(false);
  const [notifCount]                      = useState(3);

  // ── Feature detail view ─────────────────────────────────────────────────────
  if (activeFeature) {
    const f = FEATURES.find(f => f.id === activeFeature)!;
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        {/* Sub-header */}
        <header className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md">
          <button
            onClick={() => setActiveFeature(null)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </button>
          <div className="h-4 w-px bg-border" />
          <span className={cn('flex items-center gap-1.5', f.color)}>
            {f.icon}
            <span className="text-sm font-semibold text-foreground">{f.title}</span>
          </span>
          {f.badge && (
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold',
              f.badge === 'AI'   ? 'bg-indigo-500/20 text-indigo-400' :
              f.badge === 'LIVE' ? 'bg-red-500/20 text-red-400' :
              'bg-primary/20 text-primary')}>
              {f.badge}
            </span>
          )}
          <div className="ml-auto">
            <StatusDot status={f.status} />
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {activeFeature === 'video'         && <div className="flex-1 overflow-auto"><VideoCallComponent /></div>}
          {activeFeature === 'demo'          && <div className="flex-1 overflow-hidden flex flex-col"><LiveDemoComponent /></div>}
          {activeFeature === 'ai-agent'      && <AIAgentLauncher />}
          {activeFeature === 'transcription' && (
            <div className="flex-1 overflow-auto p-4">
              <LiveCaptionsOverlay className="min-h-[500px]" />
            </div>
          )}
          {activeFeature === 'chat'          && (
            <div className="flex-1 overflow-auto p-4">
              <ChatPanel className="min-h-[500px]" />
            </div>
          )}
          {activeFeature === 'recording'     && (
            <div className="flex-1 overflow-auto p-4">
              <RecordingControls channelName="echosphere-sales" className="max-w-md" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Dashboard home ──────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">

      {/* ── Navigation Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-border/60 bg-background/90 px-4 py-0 backdrop-blur-xl md:px-8">

        {/* LEFT: Logo + wordmark */}
        <div className="flex items-center gap-3 py-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(258 90% 66%) 100%)' }}
          >
            <svg viewBox="0 0 32 32" fill="none" className="h-5.5 w-5.5" aria-hidden="true">
              <circle cx="16" cy="16" r="6" fill="white" opacity="0.9" />
              <path d="M8 16 Q8 8 16 8 Q24 8 24 16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
              <path d="M8 16 Q8 24 16 24 Q24 24 24 16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold tracking-tight text-foreground leading-none">EchoSphere</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">AI Sales Platform</p>
          </div>
        </div>

        {/* CENTRE: Nav links */}
        <nav className="hidden md:flex items-center" aria-label="Main navigation">
          {NAV_LINKS.map(link => (
            <button
              key={link.id}
              onClick={() => setActivePage(link.id)}
              className={cn(
                'relative flex items-center gap-1.5 px-4 py-4 text-sm font-medium transition-colors',
                activePage === link.id
                  ? 'text-foreground after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </nav>

        {/* RIGHT: Notifications + Profile + New Call */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Notifications">
            <Bell className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            {notifCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                {notifCount}
              </span>
            )}
          </button>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(v => !v)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card/50 pl-1.5 pr-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              aria-label="User profile"
              aria-expanded={profileOpen}
            >
              {/* Avatar */}
              <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(258 90% 66%))' }}>
                S
              </div>
              <span className="hidden sm:inline">Sales Rep</span>
              <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', profileOpen && 'rotate-180')} />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-card shadow-xl shadow-black/30 overflow-hidden z-50"
                onMouseLeave={() => setProfileOpen(false)}
              >
                {/* Profile header */}
                <div className="border-b border-border/60 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Sales Rep</p>
                  <p className="text-xs text-muted-foreground">sales@echosphere.ai</p>
                </div>
                {[
                  { icon: <User className="h-4 w-4" />, label: 'Your Profile' },
                  { icon: <Settings className="h-4 w-4" />, label: 'Settings' },
                  { icon: <ExternalLink className="h-4 w-4" />, label: 'Documentation' },
                ].map(item => (
                  <button key={item.label}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    {item.icon}
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-border/60">
                  <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* New Call CTA */}
          <button
            onClick={() => setActiveFeature('video')}
            className="hidden sm:flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-100"
            style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(258 90% 66%) 100%)' }}
          >
            <Phone className="h-3.5 w-3.5" />
            New Call
          </button>
        </div>
      </header>

      {/* ── Page Content ──────────────────────────────────────────────────── */}
      {activePage !== 'dashboard' ? (
        <PlaceholderPage
          title={NAV_LINKS.find(l => l.id === activePage)?.label ?? activePage}
          icon={NAV_LINKS.find(l => l.id === activePage)?.icon}
        />
      ) : (
        <main className="flex-1 px-4 py-8 md:px-8">
          {/* Page title row */}
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Powered by Agora RTC · RTM · Conversational AI Engine
              </p>
            </div>
            {/* Quick stats */}
            <div className="hidden lg:flex items-center gap-6">
              {[
                { label: 'Active Sessions', value: '2', color: 'text-emerald-400' },
                { label: 'Calls Today', value: '14', color: 'text-blue-400' },
                { label: 'Leads Captured', value: '7', color: 'text-indigo-400' },
              ].map(stat => (
                <div key={stat.label} className="text-right">
                  <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, idx) => (
              <div
                key={feature.id}
                className={cn(
                  'group relative flex flex-col rounded-2xl border border-border/60 bg-gradient-to-br overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-black/25 hover:scale-[1.015] hover:-translate-y-0.5 active:scale-100 active:translate-y-0',
                  feature.gradient,
                  feature.borderGlow,
                )}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Subtle top glow line on hover */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Card body */}
                <div className="flex flex-1 flex-col p-5">
                  {/* Top row: icon + status + badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-background/60 shadow-sm transition-transform group-hover:scale-110',
                      feature.color,
                    )}>
                      {feature.icon}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {feature.badge && (
                        <span className={cn(
                          'rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide',
                          feature.badge === 'AI'   ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' :
                          feature.badge === 'LIVE' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                          'bg-primary/20 text-primary',
                        )}>
                          {feature.badge}
                        </span>
                      )}
                      <StatusDot status={feature.status} />
                    </div>
                  </div>

                  {/* Title + subtitle */}
                  <h3 className="text-sm font-bold text-foreground leading-snug">{feature.title}</h3>
                  <p className="mt-1.5 flex-1 text-xs text-muted-foreground leading-relaxed">{feature.subtitle}</p>

                  {/* Bottom row: feature number + CTA */}
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground/25 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => setActiveFeature(feature.id)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all',
                        CTA_STYLES[feature.id],
                      )}
                    >
                      {CTA_ICONS[feature.id]}
                      {feature.cta}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom info strip */}
          <div className="mt-8 flex items-center justify-between rounded-2xl border border-border/60 bg-card/20 px-5 py-4">
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">All systems operational</p>
                <p className="text-[11px] text-muted-foreground">Agora RTC · RTM · AI Engine · S3 Storage</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-medium text-emerald-400">Live</span>
            </div>
          </div>
        </main>
      )}

      {/* ── Floating Action Button (FAB) ──────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Expandable quick actions */}
        {fabOpen && (
          <div className="flex flex-col items-end gap-2 animate-fade-up">
            {[
              { label: 'Quick AI Call', icon: <Headphones className="h-4 w-4" />, action: () => { setActiveFeature('ai-agent'); setFabOpen(false); }, color: 'bg-indigo-600 hover:bg-indigo-500' },
              { label: 'Start Video Call', icon: <Video className="h-4 w-4" />, action: () => { setActiveFeature('video'); setFabOpen(false); }, color: 'bg-blue-600 hover:bg-blue-500' },
              { label: 'Help', icon: <ExternalLink className="h-4 w-4" />, action: () => window.open('https://docs.agora.io', '_blank'), color: 'bg-muted hover:bg-muted/80 border border-border' },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className={cn('flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-100', item.color)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* FAB trigger */}
        <button
          onClick={() => setFabOpen(v => !v)}
          className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-100"
          style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(258 90% 66%) 100%)' }}
          aria-label="Quick actions"
        >
          <div className={cn('transition-transform duration-200', fabOpen && 'rotate-45')}>
            {fabOpen ? (
              <span className="text-xl font-bold leading-none">×</span>
            ) : (
              <Play className="h-6 w-6 fill-white" />
            )}
          </div>
        </button>
      </div>

      {/* Overlay to close dropdowns */}
      {(profileOpen) && (
        <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} aria-hidden="true" />
      )}
    </div>
  );
}

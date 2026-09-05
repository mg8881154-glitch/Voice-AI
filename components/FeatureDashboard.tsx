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

// ─── Analytics Page ───────────────────────────────────────────────────────────

function AnalyticsPage() {
  const stats = [
    { label: 'Total Calls',        value: '247',   change: '+12%',  up: true,  color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
    { label: 'AI Agent Sessions',  value: '183',   change: '+28%',  up: true,  color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20' },
    { label: 'Leads Captured',     value: '94',    change: '+19%',  up: true,  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Demos Booked',       value: '31',    change: '+7%',   up: true,  color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20' },
    { label: 'Avg Call Duration',  value: '4m 32s',change: '-8%',   up: false, color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
    { label: 'Conversion Rate',    value: '38%',   change: '+5%',   up: true,  color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
  ];

  const pipeline = [
    { stage: 'Visitor',    count: 520, pct: 100, color: 'bg-muted/60' },
    { stage: 'Engaged',    count: 247, pct: 48,  color: 'bg-blue-500/60' },
    { stage: 'Qualified',  count: 94,  pct: 18,  color: 'bg-indigo-500/60' },
    { stage: 'Demo Booked',count: 31,  pct: 6,   color: 'bg-violet-500/60' },
    { stage: 'Converted',  count: 12,  pct: 2.3, color: 'bg-emerald-500/60' },
  ];

  const topAgentMetrics = [
    { metric: 'Avg STT Latency',  value: '180ms',  status: 'good' },
    { metric: 'Avg LLM Latency',  value: '420ms',  status: 'good' },
    { metric: 'Avg TTS Latency',  value: '210ms',  status: 'good' },
    { metric: 'Interruptions',    value: '14/day', status: 'ok' },
    { metric: 'Session Uptime',   value: '99.8%',  status: 'good' },
    { metric: 'Escalation Rate',  value: '6.2%',   status: 'ok' },
  ];

  return (
    <main className="flex-1 overflow-auto px-4 py-8 md:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">Last 30 days · EchoSphere platform overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
        {stats.map(s => (
          <div key={s.label} className={cn('rounded-2xl border p-4 space-y-1', s.bg, s.border)}>
            <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className={cn('text-[11px] font-semibold', s.up ? 'text-emerald-400' : 'text-rose-400')}>
              {s.change} vs last month
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales Pipeline Funnel */}
        <div className="rounded-2xl border border-border bg-card/30 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Sales Pipeline Funnel</h3>
          <div className="space-y-3">
            {pipeline.map(p => (
              <div key={p.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">{p.stage}</span>
                  <span className="text-xs font-bold text-foreground">{p.count} <span className="text-muted-foreground/60">({p.pct}%)</span></span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', p.color)} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Agent Performance */}
        <div className="rounded-2xl border border-border bg-card/30 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">AI Agent Performance</h3>
          <div className="space-y-2.5">
            {topAgentMetrics.map(m => (
              <div key={m.metric} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3 py-2">
                <span className="text-xs text-muted-foreground">{m.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">{m.value}</span>
                  <span className={cn('h-2 w-2 rounded-full', m.status === 'good' ? 'bg-emerald-400' : 'bg-amber-400')} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly activity bar chart (CSS-only) */}
      <div className="mt-6 rounded-2xl border border-border bg-card/30 p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Call Activity</h3>
        <div className="flex items-end gap-2 h-28">
          {[
            { day: 'Mon', calls: 32, leads: 12 },
            { day: 'Tue', calls: 45, leads: 18 },
            { day: 'Wed', calls: 38, leads: 15 },
            { day: 'Thu', calls: 52, leads: 24 },
            { day: 'Fri', calls: 41, leads: 17 },
            { day: 'Sat', calls: 18, leads: 6 },
            { day: 'Sun', calls: 21, leads: 2 },
          ].map(d => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-t-md bg-primary/60 transition-all"
                  style={{ height: `${(d.calls / 52) * 80}px` }}
                  title={`${d.calls} calls`}
                />
                <div
                  className="w-full rounded-t-sm bg-emerald-500/50"
                  style={{ height: `${(d.leads / 52) * 30}px` }}
                  title={`${d.leads} leads`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-3 rounded-sm bg-primary/60" />Calls</span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-3 rounded-sm bg-emerald-500/50" />Leads</span>
        </div>
      </div>
    </main>
  );
}

// ─── Call Logs Page ───────────────────────────────────────────────────────────

function CallLogsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'ai-agent' | 'video' | 'demo'>('all');

  const logs = [
    { id: 'c001', type: 'ai-agent', customer: 'Priya Sharma',    company: 'TechCorp India',    duration: '6m 12s', status: 'qualified',   outcome: 'Demo booked',       time: '2 min ago',   lead: 'Hot 🔥' },
    { id: 'c002', type: 'video',    customer: 'Rahul Mehta',     company: 'StartupXYZ',        duration: '22m 40s',status: 'completed',   outcome: 'Proposal sent',     time: '18 min ago',  lead: 'Qualified' },
    { id: 'c003', type: 'ai-agent', customer: 'Sara Johnson',    company: 'Acme Corp',         duration: '4m 55s', status: 'escalated',   outcome: 'Transferred',       time: '45 min ago',  lead: 'Interested' },
    { id: 'c004', type: 'demo',     customer: 'Amit Patel',      company: 'GlobalTrade Ltd',   duration: '35m 10s',status: 'completed',   outcome: 'Trial started',     time: '1h ago',      lead: 'Hot 🔥' },
    { id: 'c005', type: 'ai-agent', customer: 'Jennifer Wu',     company: 'CloudBase',         duration: '3m 20s', status: 'missed',      outcome: '—',                 time: '2h ago',      lead: 'Unqualified' },
    { id: 'c006', type: 'video',    customer: 'Carlos Rivera',   company: 'LatamSales',        duration: '18m 02s',status: 'completed',   outcome: 'Contract review',   time: '3h ago',      lead: 'Qualified' },
    { id: 'c007', type: 'ai-agent', customer: 'Sneha Gupta',     company: 'EdTech Pvt',        duration: '7m 45s', status: 'qualified',   outcome: 'Follow-up email',   time: '4h ago',      lead: 'Interested' },
    { id: 'c008', type: 'demo',     customer: 'Michael Scott',   company: 'Dunder Mifflin',    duration: '42m 00s',status: 'completed',   outcome: 'Enterprise deal',   time: '5h ago',      lead: 'Hot 🔥' },
  ];

  const typeIcon: Record<string, string> = { 'ai-agent': '🤖', 'video': '📹', 'demo': '🎙️' };
  const statusColor: Record<string, string> = {
    'qualified': 'bg-emerald-500/15 text-emerald-400',
    'completed': 'bg-blue-500/15 text-blue-400',
    'escalated': 'bg-amber-500/15 text-amber-400',
    'missed':    'bg-rose-500/15 text-rose-400',
  };

  const filtered = logs.filter(l => {
    const matchType   = filter === 'all' || l.type === filter;
    const matchSearch = search === '' ||
      l.customer.toLowerCase().includes(search.toLowerCase()) ||
      l.company.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <main className="flex-1 overflow-auto px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Call Logs</h2>
          <p className="mt-1 text-sm text-muted-foreground">{logs.length} total sessions · last 7 days</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer or company…"
            className="h-9 w-56 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary transition-colors"
          />
          {/* Filter tabs */}
          {(['all', 'ai-agent', 'video', 'demo'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                filter === f ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}>
              {f === 'ai-agent' ? 'AI Agent' : f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20">
              {['Type', 'Customer', 'Company', 'Duration', 'Status', 'Outcome', 'Lead', 'Time'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:pl-5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.map(log => (
              <tr key={log.id} className="group hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 pl-5 text-lg">{typeIcon[log.type]}</td>
                <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{log.customer}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{log.company}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.duration}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize', statusColor[log.status] ?? 'bg-muted text-muted-foreground')}>
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{log.outcome}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{log.lead}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{log.time}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No calls match your filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

// ─── Shared sub-components (defined outside render) ──────────────────────────

const INPUT_CLS  = 'h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary transition-colors';
const SELECT_CLS = 'h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary transition-colors cursor-pointer';

function SettingsField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1">{label}</label>
      {hint && <p className="text-[11px] text-muted-foreground mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

// ─── Settings Page ─────────────────────────────────────────────────────────────

function SettingsPage() {
  const [agentName, setAgentName]       = useState('Nova');
  const [greeting, setGreeting]         = useState("Hi, I'm Nova from EchoSphere. What brings you in today?");
  const [model, setModel]               = useState('gpt-4o-mini');
  const [voice, setVoice]               = useState('English_captivating_female1');
  const [language, setLanguage]         = useState('en');
  const [silenceMs, setSilenceMs]       = useState('420');
  const [interruptMs, setInterruptMs]   = useState('120');
  const [maxHistory, setMaxHistory]     = useState('15');
  const [temperature, setTemperature]   = useState('0.7');
  const [saved, setSaved]               = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <main className="flex-1 overflow-auto px-4 py-8 md:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configure your AI sales agent and platform</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-4xl">

        {/* Agent Identity */}
        <div className="rounded-2xl border border-border bg-card/30 p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground border-b border-border/60 pb-3">🤖 Agent Identity</h3>
          <SettingsField label="Agent Name" hint="What your AI agent calls itself during calls">
            <input value={agentName} onChange={e => setAgentName(e.target.value)} className={INPUT_CLS} />
          </SettingsField>
          <SettingsField label="Greeting Message" hint="First thing the agent says when a call starts">
            <textarea value={greeting} onChange={e => setGreeting(e.target.value)} rows={3}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors resize-none" />
          </SettingsField>
        </div>

        {/* LLM Settings */}
        <div className="rounded-2xl border border-border bg-card/30 p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground border-b border-border/60 pb-3">🧠 LLM Settings</h3>
          <SettingsField label="Model">
            <select value={model} onChange={e => setModel(e.target.value)} className={SELECT_CLS}>
              <option value="gpt-4o-mini">GPT-4o Mini (Fast · Default)</option>
              <option value="gpt-4o">GPT-4o (Smarter)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo (Balanced)</option>
              <option value="claude-3-haiku">Claude 3 Haiku (Low latency)</option>
            </select>
          </SettingsField>
          <SettingsField label="Temperature" hint="0 = focused/predictable · 1 = creative/varied">
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="1" step="0.1" value={temperature}
                onChange={e => setTemperature(e.target.value)} className="flex-1 accent-primary" />
              <span className="text-sm font-mono font-bold text-primary w-8 text-right">{temperature}</span>
            </div>
          </SettingsField>
          <SettingsField label="Max Conversation History" hint="How many past turns the LLM remembers">
            <input type="number" min="5" max="100" value={maxHistory}
              onChange={e => setMaxHistory(e.target.value)} className={INPUT_CLS} />
          </SettingsField>
        </div>

        {/* Voice & Language */}
        <div className="rounded-2xl border border-border bg-card/30 p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground border-b border-border/60 pb-3">🎙️ Voice & Language</h3>
          <SettingsField label="TTS Voice">
            <select value={voice} onChange={e => setVoice(e.target.value)} className={SELECT_CLS}>
              <option value="English_captivating_female1">Nova (Captivating Female · Default)</option>
              <option value="English_professional_male1">Alex (Professional Male)</option>
              <option value="English_warm_female2">Sarah (Warm Female)</option>
              <option value="English_confident_male2">James (Confident Male)</option>
            </select>
          </SettingsField>
          <SettingsField label="Language">
            <select value={language} onChange={e => setLanguage(e.target.value)} className={SELECT_CLS}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
            </select>
          </SettingsField>
        </div>

        {/* VAD Settings */}
        <div className="rounded-2xl border border-border bg-card/30 p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground border-b border-border/60 pb-3">⚡ Turn Detection (VAD)</h3>
          <SettingsField label="End-of-speech silence (ms)" hint="How long to wait before Nova responds">
            <input type="number" min="200" max="2000" value={silenceMs}
              onChange={e => setSilenceMs(e.target.value)} className={INPUT_CLS} />
          </SettingsField>
          <SettingsField label="Interruption threshold (ms)" hint="How quickly Nova detects you're speaking">
            <input type="number" min="50" max="500" value={interruptMs}
              onChange={e => setInterruptMs(e.target.value)} className={INPUT_CLS} />
          </SettingsField>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <p className="text-[11px] text-amber-400">
              Lower values = faster response but more false triggers. Recommended: 420ms / 120ms.
            </p>
          </div>
        </div>

        {/* CRM & Integrations */}
        <div className="rounded-2xl border border-border bg-card/30 p-5 space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-foreground border-b border-border/60 pb-3">🔗 Integrations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { name: 'Salesforce',    status: 'Not connected', icon: '☁️',  color: 'border-border/60' },
              { name: 'HubSpot',       status: 'Not connected', icon: '🟠',  color: 'border-border/60' },
              { name: 'Amazon S3',     status: 'Configured',    icon: '🪣',  color: 'border-emerald-500/30 bg-emerald-500/5' },
              { name: 'Google Calendar',status: 'Not connected',icon: '📅',  color: 'border-border/60' },
              { name: 'Pipedrive',     status: 'Not connected', icon: '🔧',  color: 'border-border/60' },
              { name: 'Slack',         status: 'Not connected', icon: '💬',  color: 'border-border/60' },
            ].map(i => (
              <div key={i.name} className={cn('flex items-center justify-between rounded-xl border px-3 py-2.5', i.color)}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{i.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{i.name}</p>
                    <p className={cn('text-[10px]', i.status === 'Configured' ? 'text-emerald-400' : 'text-muted-foreground')}>{i.status}</p>
                  </div>
                </div>
                <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                  {i.status === 'Configured' ? 'Manage' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="mt-6 max-w-4xl">
        <button
          onClick={handleSave}
          className={cn(
            'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all',
            saved ? 'bg-emerald-600' : 'hover:opacity-90',
          )}
          style={saved ? undefined : { background: 'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(258 90% 66%) 100%)' }}
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </main>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FeatureDashboard() {
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null);
  const [activePage, setActivePage]       = useState<NavPage>('dashboard');
  const [profileOpen, setProfileOpen]     = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [fabOpen, setFabOpen]             = useState(false);

  // ── Notifications state ──────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'New lead captured',       body: 'A visitor qualified via AI agent',           time: '2m ago',  read: false, icon: '🎯' },
    { id: '2', title: 'Demo booking confirmed',  body: 'Meeting scheduled for tomorrow 2pm',         time: '14m ago', read: false, icon: '📅' },
    { id: '3', title: 'Call recording ready',    body: 'sales-meeting-001.mp4 uploaded to S3',       time: '1h ago',  read: false, icon: '🎙️' },
    { id: '4', title: 'Agent session ended',     body: 'Nova completed a 6-minute sales call',       time: '2h ago',  read: true,  icon: '✅' },
    { id: '5', title: 'Escalation requested',    body: 'Customer asked to speak to a human agent',   time: '3h ago',  read: true,  icon: '👤' },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const markOneRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const dismissNotif = (id: string) =>
    setNotifications(prev => prev.filter(n => n.id !== id));

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
          {activeFeature === 'ai-agent'      && <AIAgentLauncher />}          {activeFeature === 'transcription' && (
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

          {/* ── Notification bell + dropdown ─────────────────────────────── */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white leading-none">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 overflow-hidden z-50">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground/20" />
                      <p className="text-xs text-muted-foreground/60">No notifications</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markOneRead(n.id)}
                        className={cn(
                          'group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40',
                          !n.read && 'bg-primary/5',
                        )}
                      >
                        {/* Icon */}
                        <div className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base',
                          !n.read ? 'bg-primary/15' : 'bg-muted/40',
                        )}>
                          {n.icon}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              'text-xs leading-snug',
                              !n.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground',
                            )}>
                              {n.title}
                            </p>
                            <button
                              onClick={e => { e.stopPropagation(); dismissNotif(n.id); }}
                              className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-all text-base leading-none"
                              aria-label="Dismiss"
                            >
                              ×
                            </button>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{n.body}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground/50">{n.time}</p>
                        </div>

                        {/* Unread dot */}
                        {!n.read && (
                          <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-border/60 px-4 py-2.5">
                  <button
                    onClick={() => { setNotifications([]); }}
                    className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
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
      {activePage === 'analytics' && <AnalyticsPage />}
      {activePage === 'call-logs' && <CallLogsPage />}
      {activePage === 'settings'  && <SettingsPage />}
      {activePage === 'dashboard' && (
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
      {(profileOpen || notifOpen) && (
        <div className="fixed inset-0 z-30" onClick={() => { setProfileOpen(false); setNotifOpen(false); }} aria-hidden="true" />
      )}
    </div>
  );
}

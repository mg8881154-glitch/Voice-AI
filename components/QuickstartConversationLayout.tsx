'use client';

import { useState, type ReactNode } from 'react';
import { CalendarCheck, UserCheck, PhoneOff, Menu, X, Phone, Tag, Sparkles } from 'lucide-react';
import type { AgentState } from 'agora-agent-client-toolkit';
import { Button } from '@/components/ui/button';
import { LeadPanel } from './LeadPanel';
import { BookDemoModal } from './BookDemoModal';
import { EscalationPanel } from './EscalationPanel';
import { ConversationSummaryPanel } from './ConversationSummaryPanel';
import { AgentStatusBadge } from './AgentStatusBadge';
import { PhoneCallModal } from './PhoneCallModal';
import { DigitalTwinAvatar } from './DigitalTwinAvatar';
import { LiveSentimentWidget } from './LiveSentimentWidget';
import { ProductCatalogCards, ProductCatalogModal } from './ProductCatalogCards';
import { HumanEscalationBanner } from './HumanEscalationBanner';
import { DomainPersonaSelector } from './DomainPersonaSelector';
import { getActiveDomain } from '@/lib/domainEngine';
import { useSentimentAnalyzer } from '@/lib/useSentimentAnalyzer';
import type { BookingConfirmation } from '@/lib/bookingService';
import { useLeadStore } from '@/lib/LeadContext';
import { cn } from '@/lib/utils';

type QuickstartConversationLayoutProps = {
  /** Live agent state from AgoraVoiceAI — used to drive the status badge */
  agentState: AgentState | null;
  /** Agora channel name — passed to PhoneCallModal for PSTN bridging */
  channelName?: string;
  /** Agora agent UID — passed to PhoneCallModal for PSTN bridging */
  agentUid?: string;
  statusPanel: ReactNode;
  pipelineMetrics: ReactNode;
  transcriptPanel: ReactNode;
  visualizer: ReactNode;
  /** imageCard slot — receives the AgentImageCard node (or null) from ConversationComponent */
  imageCard: ReactNode;
  controls: ReactNode;
  onEndConversation: () => void;
  /** Live conversation transcript used for sentiment & emotion analysis */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transcript?: any[];
};

type RightPanelTab = 'domain' | 'lead' | 'pricing' | 'escalate' | 'summary';

export function QuickstartConversationLayout({
  agentState,
  channelName,
  agentUid,
  statusPanel,
  pipelineMetrics,
  transcriptPanel,
  visualizer,
  imageCard,
  controls,
  onEndConversation,
  transcript = [],
}: QuickstartConversationLayoutProps) {
  const { updateLead, lead } = useLeadStore();
  const sentiment = useSentimentAnalyzer(transcript);
  const [bookDemoOpen, setBookDemoOpen] = useState(false);
  const [phoneCallOpen, setPhoneCallOpen] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [visualizerMode, setVisualizerMode] = useState<'sphere' | 'avatar'>('sphere');
  const [rightTab, setRightTab] = useState<RightPanelTab>('domain');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connectionState] = useState('CONNECTED'); // optimistic; status dot tracks real value
  const [isAgentConnected] = useState(true);       // visualizer already handles this

  const handleBooked = (confirmation: BookingConfirmation) => {
    updateLead({ demoRequested: true });
    setBookDemoOpen(false);
    setRightTab('summary');
    console.info('[EchoSphere] Demo booked:', confirmation.confirmationId);
  };

  const handleEndConversation = () => {
    setRightTab('summary');
    onEndConversation();
  };

  const handleEscalate = () => {
    updateLead({ escalated: true });
    setRightTab('escalate');
  };

  // Auto-switch to Escalate tab when lead becomes escalated mid-call
  const prevEscalated = lead.escalated;
  if (prevEscalated && rightTab === 'lead') {
    setRightTab('escalate');
  }

  const TAB_CONFIG: { id: RightPanelTab; label: string; badge?: string }[] = [
    { id: 'domain', label: 'Domain Cards' },
    { id: 'lead', label: 'Lead' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'escalate', label: 'Escalate', badge: lead.escalated ? '!' : undefined },
    { id: 'summary', label: 'Summary' },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-4 py-2.5 backdrop-blur-md md:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-md"
            style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(258 90% 66%) 100%)' }}
          >
            <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5" aria-hidden="true">
              <circle cx="16" cy="16" r="6" fill="white" opacity="0.9" />
              <path d="M8 16 Q8 8 16 8 Q24 8 24 16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
              <path d="M8 16 Q8 24 16 24 Q24 24 24 16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-base font-bold tracking-tight text-foreground">EchoSphere</span>
              <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
                Voice AI Assistant
              </span>
            </div>
            <div className="hidden md:block">{pipelineMetrics}</div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {statusPanel}

          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 gap-1.5 rounded-lg border-violet-500/40 px-3 text-xs font-medium text-violet-400 hover:border-violet-400 hover:bg-violet-500/10 sm:flex"
            onClick={() => setCatalogModalOpen(true)}
          >
            <Tag className="h-3.5 w-3.5" />
            Pricing Plans
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 gap-1.5 rounded-lg border-indigo-500/40 px-3 text-xs font-medium text-indigo-400 hover:border-indigo-400 hover:bg-indigo-500/10 sm:flex"
            onClick={() => setBookDemoOpen(true)}
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            Book Demo
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 gap-1.5 rounded-lg border-emerald-500/40 px-3 text-xs font-medium text-emerald-400 hover:border-emerald-400 hover:bg-emerald-500/10 sm:flex"
            onClick={() => setPhoneCallOpen(true)}
          >
            <Phone className="h-3.5 w-3.5" />
            Call Customer
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 gap-1.5 rounded-lg border-amber-500/40 px-3 text-xs font-medium text-amber-400 hover:border-amber-400 hover:bg-amber-500/10 sm:flex"
            onClick={() => { setRightTab('escalate'); setSidebarOpen(true); handleEscalate(); }}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Escalate
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="h-8 gap-1.5 rounded-lg border border-destructive bg-transparent px-3 text-xs font-medium text-destructive hover:bg-destructive/10"
            onClick={handleEndConversation}
            aria-label="End conversation"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">End Call</span>
          </Button>

          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle side panel"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── Left: Transcript ─────────────────────────────────────────────── */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border/60 bg-background/40 lg:flex xl:w-80">
          <div className="flex min-h-0 flex-1 flex-col p-3">
            {transcriptPanel}
          </div>
        </aside>

        {/* ── Centre: Visualizer + Badge + Controls ────────────────────────── */}
        <main className="relative flex min-h-0 flex-1 flex-col items-center justify-between bg-background px-4 py-4">

          {/* Mobile transcript strip */}
          <div className="w-full lg:hidden mb-3 max-h-28 overflow-hidden rounded-xl border border-border/60 bg-card/20">
            {transcriptPanel}
          </div>

          {/* View Mode Toggle: 3D Sphere vs Digital Twin */}
          <div className="flex items-center gap-1 rounded-full border border-border/80 bg-card/60 p-1 backdrop-blur-md mb-2 shrink-0">
            <button
              onClick={() => setVisualizerMode('sphere')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
                visualizerMode === 'sphere'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              🌐 3D Wave Visualizer
            </button>
            <button
              onClick={() => setVisualizerMode('avatar')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
                visualizerMode === 'avatar'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles className="h-3 w-3" />
              👤 Digital Twin Avatar
            </button>
          </div>

          {/* Live Agent Escalation UI Banner: AI Call in Progress + Real-time Sentiment + Request Human Override */}
          <div className="w-full max-w-2xl mb-2 shrink-0">
            <HumanEscalationBanner
              channelName={channelName}
              activeDomain={getActiveDomain()}
              transcriptText={Array.isArray(transcript) ? transcript.map(t => t.text || t.content || '').join(' ') : ''}
              onManualEscalate={() => {
                setRightTab('escalate');
                setSidebarOpen(true);
                handleEscalate();
              }}
              isEscalated={lead.escalated}
            />
          </div>

          {/* Real-time NLP Sentiment Coaching Banner */}
          <div className="w-full max-w-lg mb-2 shrink-0">
            <LiveSentimentWidget sentiment={sentiment} />
          </div>

          {/* Agent visualizer or Digital Twin */}
          <div className="flex min-h-0 flex-1 w-full flex-col items-center justify-center gap-3">
            {visualizerMode === 'avatar' ? (
              <div className="flex items-center justify-center w-full min-h-[18rem]">
                <DigitalTwinAvatar agentState={agentState} />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                {visualizer}
              </div>
            )}

            {/* Live status badge — centred below the sphere/avatar */}
            <AgentStatusBadge
              agentState={agentState}
              isAgentConnected={isAgentConnected}
              connectionState={connectionState}
            />

            {/* Image card — appears when Nova mentions a product/feature */}
            {imageCard && (
              <div className="w-full max-w-sm px-2 animate-fade-up">
                {imageCard}
              </div>
            )}
          </div>

          {/* Audio controls */}
          <div className="w-full shrink-0 pt-3">
            {controls}
          </div>

          {/* Mobile action buttons */}
          <div className="flex gap-2 pt-3 sm:hidden w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 border-violet-500/40 text-xs text-violet-400 hover:bg-violet-500/10"
              onClick={() => setCatalogModalOpen(true)}
            >
              <Tag className="h-3.5 w-3.5" />
              Plans
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 border-indigo-500/40 text-xs text-indigo-400 hover:bg-indigo-500/10"
              onClick={() => setBookDemoOpen(true)}
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              Book Demo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 border-emerald-500/40 text-xs text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => setPhoneCallOpen(true)}
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 border-amber-500/40 text-xs text-amber-400 hover:bg-amber-500/10"
              onClick={() => { setRightTab('escalate'); setSidebarOpen(true); handleEscalate(); }}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Escalate
            </Button>
          </div>
        </main>

        {/* ── Right: Tabbed panel ──────────────────────────────────────────── */}
        <aside
          className={cn(
            'flex w-80 shrink-0 flex-col border-l border-border/60 bg-background/40 xl:w-96',
            'fixed inset-y-0 right-0 z-30 transition-transform duration-300 lg:relative lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          {/* Tab bar */}
          <div className="flex shrink-0 border-b border-border/60 px-3 pt-3 gap-1 pb-3">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setRightTab(tab.id); }}
                className={cn(
                  'relative flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors',
                  rightTab === tab.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {tab.label}
                {tab.badge && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 space-y-3">
            {rightTab === 'domain' && (
              <DomainPersonaSelector showMediaCards={true} className="flex-1" />
            )}
            {rightTab === 'lead' && (
              <>
                <LeadPanel className="flex-1" />
                <Button
                  className="w-full gap-2 text-sm font-semibold shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(258 90% 66%) 100%)',
                    border: 'none',
                    color: 'white',
                  }}
                  onClick={() => setBookDemoOpen(true)}
                >
                  <CalendarCheck className="h-4 w-4" />
                  Book Demo / Meeting
                </Button>
              </>
            )}
            {rightTab === 'pricing' && (
              <ProductCatalogCards className="flex-1" />
            )}
            {rightTab === 'escalate' && (
              <EscalationPanel onEscalate={handleEscalate} className="flex-1" />
            )}
            {rightTab === 'summary' && (
              <ConversationSummaryPanel className="flex-1" />
            )}
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>

      <BookDemoModal
        isOpen={bookDemoOpen}
        onClose={() => setBookDemoOpen(false)}
        onBooked={handleBooked}
      />

      <PhoneCallModal
        isOpen={phoneCallOpen}
        onClose={() => setPhoneCallOpen(false)}
        channelName={channelName}
        agentUid={agentUid}
      />

      <ProductCatalogModal
        isOpen={catalogModalOpen}
        onClose={() => setCatalogModalOpen(false)}
      />
    </div>
  );
}

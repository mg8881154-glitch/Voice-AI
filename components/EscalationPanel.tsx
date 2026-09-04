'use client';

import { useState } from 'react';
import { UserCheck, PhoneCall, Loader2, CheckCircle2, Copy, Check } from 'lucide-react';
import { useLeadStore } from '@/lib/LeadContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EscalationStatus = 'idle' | 'confirming' | 'connecting' | 'connected';

type EscalationPanelProps = {
  onEscalate?: () => void;
  className?: string;
};

export function EscalationPanel({ onEscalate, className }: EscalationPanelProps) {
  const { lead, updateLead } = useLeadStore();
  const [status, setStatus] = useState<EscalationStatus>(
    lead.escalated ? 'connected' : 'idle',
  );
  const [copied, setCopied] = useState(false);

  const leadSummary = buildLeadSummary(lead);

  const handleEscalate = async () => {
    setStatus('confirming');
  };

  const handleConfirm = async () => {
    setStatus('connecting');
    // Simulate connecting to human agent (replace with real escalation API call)
    await new Promise((r) => setTimeout(r, 1800));
    setStatus('connected');
    updateLead({ escalated: true });
    onEscalate?.();
  };

  const handleCancel = () => {
    setStatus('idle');
  };

  const copyLeadSummary = async () => {
    await navigator.clipboard.writeText(leadSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      className={cn(
        'flex flex-col rounded-2xl border border-border bg-card/30 backdrop-blur-sm overflow-hidden',
        className,
      )}
      aria-label="Human escalation panel"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Human Escalation</h2>
          <p className="text-xs text-muted-foreground">Transfer to a sales specialist</p>
        </div>
        <span
          className={cn(
            'flex h-2 w-2 rounded-full',
            status === 'connected' ? 'bg-emerald-400' :
            status === 'connecting' ? 'bg-amber-400 animate-pulse' :
            'bg-muted-foreground/30',
          )}
        />
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Status display */}
        {status === 'idle' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect the customer with a human sales specialist. The full conversation context and lead data will be passed automatically.
            </p>
            <Button
              variant="outline"
              className="w-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500"
              onClick={handleEscalate}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Escalate to Human
            </Button>
          </div>
        )}

        {status === 'confirming' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Confirm escalation?</p>
            <p className="text-xs text-muted-foreground">
              A sales specialist will be notified with the conversation summary below.
            </p>
            <LeadSummaryCard summary={leadSummary} onCopy={copyLeadSummary} copied={copied} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-xs" onClick={handleCancel}>
                Cancel
              </Button>
              <Button className="flex-1 text-xs bg-amber-500 hover:bg-amber-600 text-black" onClick={handleConfirm}>
                <PhoneCall className="mr-1.5 h-3.5 w-3.5" />
                Connect Now
              </Button>
            </div>
          </div>
        )}

        {status === 'connecting' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            <p className="text-sm font-medium text-foreground">Connecting to specialist…</p>
            <p className="text-xs text-muted-foreground text-center">
              Transferring conversation context to the next available agent.
            </p>
          </div>
        )}

        {status === 'connected' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-400">Specialist connected</p>
            </div>
            <p className="text-xs text-muted-foreground">
              A human sales specialist has been notified and has received the full conversation summary.
            </p>
            <LeadSummaryCard summary={leadSummary} onCopy={copyLeadSummary} copied={copied} />
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-xs text-emerald-400 font-medium">Next steps</p>
              <p className="text-xs text-muted-foreground mt-1">
                The specialist will reach out to the customer within 5 minutes during business hours.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Lead Summary Card ─────────────────────────────────────────────────────────

function LeadSummaryCard({
  summary,
  onCopy,
  copied,
}: {
  summary: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="relative rounded-xl border border-border bg-background/50 p-3">
      <button
        onClick={onCopy}
        className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Copy lead summary"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <pre className="whitespace-pre-wrap text-[11px] font-mono text-muted-foreground leading-relaxed pr-6">
        {summary}
      </pre>
    </div>
  );
}

// ─── Helper ────────────────────────────────────────────────────────────────────

import type { LeadInfo } from '@/lib/leadStore';

function buildLeadSummary(lead: LeadInfo): string {
  const lines = [
    `=== EchoSphere Lead Context ===`,
    `Time: ${new Date().toLocaleString()}`,
    ``,
    `Name:     ${lead.name ?? '—'}`,
    `Company:  ${lead.company ?? '—'}`,
    `Users:    ${lead.userCount ?? '—'}`,
    `Plan:     ${lead.interestedPlan ?? '—'}`,
    `Budget:   ${lead.budget ?? '—'}`,
    `Timeline: ${lead.purchaseTimeline ?? '—'}`,
    ``,
    `Requirement: ${lead.requirement ?? '—'}`,
    `Pain Point:  ${lead.painPoint ?? '—'}`,
    ``,
    `Status:       ${lead.qualificationStatus}`,
    `Demo Req:     ${lead.demoRequested ? 'Yes' : 'No'}`,
  ];
  if (lead.conversationSummary) {
    lines.push(``, `--- Conversation Summary ---`, lead.conversationSummary);
  }
  return lines.join('\n');
}


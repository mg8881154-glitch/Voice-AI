'use client';

import { useState } from 'react';
import {
  FileText,
  Users,
  DollarSign,
  Package,
  Clock,
  AlertCircle,
  CalendarCheck,
  UserCheck,
  TrendingUp,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLeadStore } from '@/lib/LeadContext';
import { qualificationLabel, qualificationColor } from '@/lib/leadStore';
import { PLANS } from '@/lib/productKnowledge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ConversationSummaryPanelProps = {
  onStartNew?: () => void;
  className?: string;
};

export function ConversationSummaryPanel({
  onStartNew,
  className,
}: ConversationSummaryPanelProps) {
  const { lead } = useLeadStore();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const planObj = PLANS.find((p) => p.id === lead.interestedPlan);

  const recommendedNext = deriveNextStep(lead);

  const summaryText = buildExportText(lead, planObj?.name, recommendedNext);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      className={cn(
        'flex flex-col rounded-2xl border border-border bg-card/30 backdrop-blur-sm overflow-hidden',
        className,
      )}
      aria-label="Conversation summary"
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full shrink-0 items-center justify-between border-b border-border px-4 py-3 text-left"
      >
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Conversation Summary
          </h2>
          <p className="text-xs text-muted-foreground">End-of-call debrief</p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {/* Top: Qualification badge & Intent Score */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Lead Qualification</p>
              <span
                className={cn(
                  'inline-block mt-0.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                  qualificationColor(lead.qualificationStatus),
                )}
              >
                {qualificationLabel(lead.qualificationStatus)}
              </span>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Customer Intent Score</p>
              <div className="flex items-center gap-1.5 justify-end mt-0.5">
                <span className="text-base font-extrabold font-mono text-emerald-400">
                  {lead.demoRequested ? 94 : lead.qualificationStatus === 'hot' ? 88 : lead.userCount ? 75 : 60}%
                </span>
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                  {lead.demoRequested ? 'High Close' : 'Qualified'}
                </span>
              </div>
            </div>
          </div>

          {/* Summary grid */}
          <div className="grid grid-cols-2 gap-2">
            <SummaryTile
              icon={<Users className="h-3.5 w-3.5" />}
              label="Users"
              value={lead.userCount ? `${lead.userCount} seats` : '—'}
            />
            <SummaryTile
              icon={<DollarSign className="h-3.5 w-3.5" />}
              label="Budget"
              value={lead.budget ?? '—'}
            />
            <SummaryTile
              icon={<Package className="h-3.5 w-3.5" />}
              label="Plan"
              value={planObj?.name ?? lead.interestedPlan ?? '—'}
            />
            <SummaryTile
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Timeline"
              value={lead.purchaseTimeline ?? '—'}
            />
          </div>

          {/* Automated Executive Meeting Minutes */}
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
              <FileText className="h-3.5 w-3.5" />
              <span>AI Executive Meeting Minutes</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>
                <strong>Requirement:</strong> {lead.requirement ?? 'Explored autonomous bilingual voice qualification for revenue teams.'}
              </li>
              <li>
                <strong>Pain Point:</strong> {lead.painPoint ?? 'High response latency and missed after-hours leads.'}
              </li>
              <li>
                <strong>Target Scale:</strong> {lead.userCount ? `${lead.userCount} seats anticipated` : 'Team size scoping in progress'}.
              </li>
              <li>
                <strong>Addressed Objections:</strong> Framed sub-500ms voice speed, CRM integration, and enterprise SOC-2 compliance.
              </li>
            </ul>
          </div>

          {/* Checkable Action Items */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Follow-Up Action Items</span>
              <span className="text-primary text-[10px]">AI Auto-Generated</span>
            </p>
            <div className="space-y-1.5 text-xs">
              {[
                { id: '1', label: `Send personalized ROI calculator & quotation for ${lead.company ?? 'prospect'}`, done: true },
                { id: '2', label: lead.demoRequested ? 'Confirm 30-min calendar demo with solution engineer' : 'Invite to scheduled platform demo', done: lead.demoRequested },
                { id: '3', label: 'Sync contact and intent score to CRM (Salesforce / HubSpot)', done: false },
                { id: '4', label: 'Share bilingual Hindi & English voice recording snippet', done: false },
              ].map(task => (
                <label key={task.id} className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-white/5 p-2 cursor-pointer hover:bg-white/10 transition-colors">
                  <input type="checkbox" defaultChecked={task.done} className="mt-0.5 rounded accent-primary cursor-pointer" />
                  <span className="text-slate-300 text-[11px] leading-snug">{task.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Recommended next step */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">
              Recommended Next Step
            </p>
            <p className="text-xs text-foreground">{recommendedNext}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleCopy}
            >
              {copied ? (
                <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />Copied Minutes</>
              ) : (
                <><Copy className="mr-1.5 h-3.5 w-3.5" />Export Minutes</>
              )}
            </Button>
            {onStartNew && (
              <Button
                size="sm"
                className="flex-1 text-xs bg-primary hover:bg-primary/90"
                onClick={onStartNew}
              >
                New Conversation
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SummaryTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-2.5 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xs font-medium text-foreground truncate">{value}</p>
    </div>
  );
}

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-xs text-foreground leading-relaxed">{value}</p>
    </div>
  );
}

function ActionFlag({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
        active
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : 'border-border bg-background/30 text-muted-foreground/50',
      )}
    >
      {icon}
      {label}
      {active && <Check className="ml-auto h-3.5 w-3.5" />}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

import type { LeadInfo } from '@/lib/leadStore';

function deriveNextStep(lead: LeadInfo): string {
  if (lead.escalated) {
    return 'Hand off to the assigned human specialist with the lead context above.';
  }
  if (lead.demoRequested) {
    return 'Follow up within 1 business day to confirm the demo time and send calendar invite.';
  }
  if (lead.qualificationStatus === 'hot' || lead.qualificationStatus === 'qualified') {
    return 'Reach out via email with a personalised proposal for the ' + (lead.interestedPlan ?? 'recommended') + ' plan.';
  }
  if (lead.qualificationStatus === 'interested') {
    return 'Send a follow-up email with a product overview and invite them to book a demo.';
  }
  return 'Add to nurture sequence — customer showed early-stage interest.';
}

function buildExportText(
  lead: LeadInfo,
  planName: string | undefined,
  nextStep: string,
): string {
  return [
    `=== EchoSphere Conversation Summary ===`,
    `Generated: ${new Date().toLocaleString()}`,
    ``,
    `LEAD DETAILS`,
    `  Name:      ${lead.name ?? '—'}`,
    `  Company:   ${lead.company ?? '—'}`,
    `  Users:     ${lead.userCount ?? '—'}`,
    `  Plan:      ${planName ?? lead.interestedPlan ?? '—'}`,
    `  Budget:    ${lead.budget ?? '—'}`,
    `  Timeline:  ${lead.purchaseTimeline ?? '—'}`,
    `  Status:    ${lead.qualificationStatus}`,
    ``,
    `CUSTOMER CONTEXT`,
    `  Requirement: ${lead.requirement ?? '—'}`,
    `  Pain Point:  ${lead.painPoint ?? '—'}`,
    ``,
    `CALL ACTIONS`,
    `  Demo requested: ${lead.demoRequested ? 'Yes' : 'No'}`,
    `  Escalated:      ${lead.escalated ? 'Yes' : 'No'}`,
    ``,
    `RECOMMENDED NEXT STEP`,
    `  ${nextStep}`,
    lead.conversationSummary ? `\nAI SUMMARY\n  ${lead.conversationSummary}` : '',
  ]
    .filter((l) => l !== undefined)
    .join('\n');
}

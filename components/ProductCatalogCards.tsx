'use client';

import { useState } from 'react';
import {
  Check,
  Sparkles,
  Zap,
  Building2,
  Send,
  CheckCircle2,
  X,
  ChevronRight,
  Headphones,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLeadStore } from '@/lib/LeadContext';
import { cn } from '@/lib/utils';

export interface ProductPlan {
  id: string;
  name: string;
  badge?: string;
  price: string;
  billing: string;
  popular?: boolean;
  description: string;
  features: string[];
  specs: {
    minutes: string;
    concurrency: string;
    channels: string;
    sla: string;
  };
}

export const PRODUCT_PLANS: ProductPlan[] = [
  {
    id: 'starter',
    name: 'Starter Voice AI',
    price: '$49',
    billing: 'per month',
    description: 'Autonomous voice agent for growing startups and fast-moving sales teams.',
    features: [
      '500 minutes of active voice calls / month',
      'Nova English & Hindi Voice Engine',
      'Real-time Lead Capture & Qualification',
      'Automated Meeting Minutes & Action Items',
      'Basic CRM Webhook Sync (Zapier/Make)',
      'Standard Web Audio Visualizer',
    ],
    specs: {
      minutes: '500 mins/mo',
      concurrency: '3 simultaneous calls',
      channels: 'WebRTC Browser',
      sla: '99.5% Uptime',
    },
  },
  {
    id: 'business',
    name: 'Business Pro',
    badge: 'MOST POPULAR',
    popular: true,
    price: '$199',
    billing: 'per month',
    description: 'Full-stack AI sales pipeline with live Knowledge Base RAG and CRM bi-directional sync.',
    features: [
      '2,500 minutes of active voice calls / month',
      'Dynamic RAG Knowledge Base (PDF, Docs, URLs)',
      'Custom Voice & Persona Selector (5 Voices, 3 Tones)',
      'Live Sentiment & Objection Coaching HUD',
      'Direct 1-Click Sync (HubSpot, Salesforce, Zoho)',
      '3D Digital Twin Avatar with Lip-Sync',
      'PSTN Inbound/Outbound Phone Calling',
    ],
    specs: {
      minutes: '2,500 mins/mo',
      concurrency: '15 simultaneous calls',
      channels: 'WebRTC + SIP/PSTN',
      sla: '99.9% Uptime SLA',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise Custom',
    badge: 'UNLIMITED',
    price: '$999',
    billing: 'starting / month',
    description: 'Dedicated high-concurrency voice AI fabric with on-premise VPC isolation.',
    features: [
      'Unlimited voice minutes & custom concurrency',
      'Dedicated Agora SD-RTN™ private priority routing',
      'Custom Voice Cloning & Fine-Tuned Domain LLM',
      'SOC2 Type II, HIPAA, and GDPR Compliance',
      'White-label Web & Mobile SDK Integration',
      'Dedicated Solution Architect & 24/7 Phone SLA',
      'Direct S3 / Azure Blob Storage Archival',
    ],
    specs: {
      minutes: 'Custom / Unlimited',
      concurrency: '100+ channels',
      channels: 'Omnichannel Fabric',
      sla: '99.99% Financial SLA',
    },
  },
];

interface ProductCatalogCardsProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function ProductCatalogCards({
  isOpen = true,
  onClose,
  className,
}: ProductCatalogCardsProps) {
  const { lead, updateLead } = useLeadStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    lead.interestedPlan ? lead.interestedPlan.toLowerCase().includes('enterprise') ? 'enterprise' : lead.interestedPlan.toLowerCase().includes('starter') ? 'starter' : 'business' : 'business'
  );
  const [quoteSentFor, setQuoteSentFor] = useState<string | null>(null);

  const handleSelectPlan = (plan: ProductPlan) => {
    setSelectedPlanId(plan.id);
    updateLead({
      interestedPlan: plan.name,
      budget: plan.price + '/mo',
    });
  };

  const handleSendQuote = (plan: ProductPlan) => {
    handleSelectPlan(plan);
    setQuoteSentFor(plan.id);
    setTimeout(() => setQuoteSentFor(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className={cn('flex flex-col h-full overflow-hidden', className)}>
      {/* Header if modal wrapper */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <h3 className="text-base font-bold text-foreground">
              EchoSphere Solution &amp; Pricing Catalog
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a plan to associate with the current lead or transmit an instant quote
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close catalog"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto pr-1 pb-4 flex-1">
        {PRODUCT_PLANS.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const isQuoteSent = quoteSentFor === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md',
                plan.popular
                  ? 'border-indigo-500/60 bg-indigo-950/20 shadow-lg shadow-indigo-500/10'
                  : 'border-border/80 bg-card/40 hover:border-border',
                isSelected && 'ring-2 ring-primary border-primary'
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-0.5 text-[10px] font-extrabold tracking-wider text-white shadow-md">
                  {plan.badge}
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-foreground">{plan.name}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {plan.description}
                </p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-foreground tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted-foreground">/{plan.billing}</span>
                </div>
              </div>

              {/* Specs Table */}
              <div className="mb-4 rounded-xl border border-white/5 bg-black/40 p-2.5 text-[11px] space-y-1.5 font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Call Volume:</span>
                  <span className="text-foreground font-semibold">{plan.specs.minutes}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Concurrency:</span>
                  <span className="text-foreground font-semibold">{plan.specs.concurrency}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Channels:</span>
                  <span className="text-foreground font-semibold">{plan.specs.channels}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>SLA Guarantee:</span>
                  <span className="text-emerald-400 font-semibold">{plan.specs.sla}</span>
                </div>
              </div>

              {/* Features List */}
              <div className="flex-1 space-y-2 mb-5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Included Capabilities:
                </p>
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <Button
                  size="sm"
                  onClick={() => handleSelectPlan(plan)}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'w-full text-xs font-semibold gap-1.5 h-9 rounded-xl',
                    isSelected
                      ? 'bg-primary text-white shadow-md'
                      : 'border-border/80 hover:bg-muted text-foreground'
                  )}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active Deal Plan
                    </>
                  ) : (
                    'Select Plan for Deal'
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleSendQuote(plan)}
                  variant="outline"
                  className={cn(
                    'w-full text-xs font-semibold gap-1.5 h-9 rounded-xl transition-all',
                    isQuoteSent
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10'
                  )}
                >
                  {isQuoteSent ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                      Quote Attached to Lead!
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send Live Quote
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Selection Banner */}
      <div className="mt-auto border-t border-border/60 pt-3 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-emerald-400" />
          <span>
            Current Lead Target:{' '}
            <strong className="text-foreground">
              {lead.interestedPlan || 'Business Pro ($199/mo)'}
            </strong>
          </span>
        </div>
        <span className="text-[11px] font-mono text-indigo-400">
          Syncs with CRM &amp; Call Minutes
        </span>
      </div>
    </div>
  );
}

export function ProductCatalogModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl border border-border/80 bg-background/95 p-6 shadow-2xl backdrop-blur-xl flex flex-col z-10">
        <ProductCatalogCards isOpen={true} onClose={onClose} />
      </div>
    </div>
  );
}

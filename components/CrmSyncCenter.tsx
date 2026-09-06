'use client';

import { useState } from 'react';
import {
  Cloud, RefreshCw, CheckCircle2, ArrowRight, ExternalLink,
  ShieldCheck, Database, Zap, Send, Clock, Check
} from 'lucide-react';
import { useLeadStore } from '@/lib/LeadContext';
import { cn } from '@/lib/utils';

export interface CrmIntegration {
  id: 'salesforce' | 'hubspot' | 'zoho' | 'slack';
  name: string;
  icon: string;
  category: string;
  status: 'connected' | 'disconnected';
  lastSync?: string;
  recordCount: number;
}

const DEFAULT_INTEGRATIONS: CrmIntegration[] = [
  {
    id: 'salesforce',
    name: 'Salesforce Sales Cloud',
    icon: '☁️',
    category: 'Enterprise CRM',
    status: 'connected',
    lastSync: '2 minutes ago',
    recordCount: 142,
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    icon: '🟠',
    category: 'Inbound Growth',
    status: 'connected',
    lastSync: '14 minutes ago',
    recordCount: 98,
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    icon: '🔴',
    category: 'Global Sales',
    status: 'disconnected',
    recordCount: 0,
  },
  {
    id: 'slack',
    name: 'Slack Revenue Alerts',
    icon: '💬',
    category: 'Team Webhook',
    status: 'connected',
    lastSync: 'Just now',
    recordCount: 312,
  },
];

export function CrmSyncCenter({ className }: { className?: string }) {
  const { lead } = useLeadStore();
  const [integrations, setIntegrations] = useState<CrmIntegration[]>(DEFAULT_INTEGRATIONS);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncLog, setSyncLog] = useState<{ id: string; crm: string; time: string; status: string }[]>([
    { id: '1', crm: 'Salesforce', time: 'Just now', status: 'Contact & Opportunity Synced ($199/mo)' },
    { id: '2', crm: 'Slack', time: '2m ago', status: 'Hot Lead Qualified Alert posted to #sales-pipeline' },
    { id: '3', crm: 'HubSpot', time: '14m ago', status: 'Contact Created: Rahul Mehta (StartupXYZ)' },
  ]);

  const handleToggleConnect = (id: string) => {
    setIntegrations(prev =>
      prev.map(i => {
        if (i.id === id) {
          const nextStatus = i.status === 'connected' ? 'disconnected' : 'connected';
          return {
            ...i,
            status: nextStatus,
            lastSync: nextStatus === 'connected' ? 'Just now' : undefined,
          };
        }
        return i;
      })
    );
  };

  const handleSyncLead = (crm: CrmIntegration) => {
    setSyncingId(crm.id);
    setTimeout(() => {
      setSyncingId(null);
      setSyncLog(prev => [
        {
          id: String(Date.now()),
          crm: crm.name,
          time: 'Just now',
          status: `Pushed "${lead.name ?? 'Guest Prospect'}" (${lead.company ?? 'Enterprise'}) to ${crm.name}`,
        },
        ...prev,
      ]);
    }, 800);
  };

  return (
    <div className={cn('rounded-3xl border border-white/10 glass-panel-elevated p-6 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-400" />
              1-Click CRM Sync Center
            </h3>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              Live Pipeline Sync
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time automatic qualification push to HubSpot, Salesforce, Zoho, and Slack.
          </p>
        </div>

        {/* Current Lead Quick Sync Button */}
        <button
          onClick={() => handleSyncLead(integrations[0])}
          disabled={syncingId !== null}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 transition-all shadow-md shadow-indigo-500/20 active:scale-98"
        >
          {syncingId ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Syncing Lead to CRM…
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Sync Current Lead Now
            </>
          )}
        </button>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {integrations.map(item => {
          const isConnected = item.status === 'connected';
          return (
            <div
              key={item.id}
              className={cn(
                'rounded-2xl border p-4 flex flex-col justify-between transition-all',
                isConnected
                  ? 'border-indigo-500/30 bg-indigo-950/20'
                  : 'border-white/10 bg-white/5 opacity-70'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                      isConnected
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    )}
                  >
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{item.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{item.category}</p>
                {isConnected && item.lastSync && (
                  <p className="text-[10px] text-indigo-300 font-mono mt-2">
                    Last sync: {item.lastSync}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {isConnected ? `${item.recordCount} leads` : '0 synced'}
                </span>
                <button
                  onClick={() => handleToggleConnect(item.id)}
                  className={cn(
                    'text-[11px] font-semibold transition-colors',
                    isConnected ? 'text-rose-400 hover:text-rose-300' : 'text-primary hover:text-primary/80'
                  )}
                >
                  {isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Field Mapping Preview */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            Automatic Field Mapping Scheme
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Bi-directional JSON Payload</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            { field: 'Lead Name', maps: 'Contact.FullName' },
            { field: 'Company / Org', maps: 'Account.Name' },
            { field: 'Budget & Scale', maps: 'Opportunity.Amount' },
            { field: 'Intent Score', maps: 'Lead.IntentScore__c' },
            { field: 'Qualification', maps: 'Lead.Status' },
            { field: 'Phone Number', maps: 'Contact.Phone' },
            { field: 'Language Preference', maps: 'Contact.Language__c' },
            { field: 'Next Step / Demo', maps: 'Event.Subject' },
          ].map(m => (
            <div key={m.field} className="rounded-xl border border-white/5 bg-white/5 p-2 space-y-0.5">
              <p className="text-[10px] text-slate-400">{m.field}</p>
              <p className="text-[11px] font-mono font-semibold text-indigo-300 truncate">{m.maps}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Live Sync Audit Trail */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Recent CRM Audit Trail
        </h4>
        <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-black/20 overflow-hidden text-xs">
          {syncLog.map(log => (
            <div key={log.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white">{log.crm}:</span>
                <span className="text-slate-300 text-[11px] truncate">{log.status}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap ml-2">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

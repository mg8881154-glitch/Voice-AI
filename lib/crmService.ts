/**
 * EchoSphere CRM Integration Layer
 *
 * Provides a unified interface for pushing lead data to external CRM systems.
 * For the prototype the default adapter writes to localStorage.
 *
 * Swap `activeCrmAdapter` for a real Salesforce / HubSpot adapter without
 * changing any component code — the interface stays the same.
 *
 * SECURITY: Never put API keys here.  Real adapters must call server-side
 * API routes (app/api/crm/...) which read secrets from environment variables.
 */

import type { LeadInfo } from './leadStore';

// ─── Adapter Interface ────────────────────────────────────────────────────────

export interface CrmLead {
  id: string;
  createdAt: string;
  source: 'echosphere-voice-ai';
  lead: LeadInfo;
  sessionId?: string;
}

export interface CrmAdapter {
  name: string;
  createLead(lead: LeadInfo, sessionId?: string): Promise<CrmLead>;
  updateLead(id: string, partial: Partial<LeadInfo>): Promise<CrmLead>;
  getLead(id: string): Promise<CrmLead | null>;
}

// ─── Mock / Local Adapter (default) ──────────────────────────────────────────

const STORAGE_KEY = 'echosphere_crm_leads';

function loadLeads(): Record<string, CrmLead> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveLeads(leads: Record<string, CrmLead>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export const mockCrmAdapter: CrmAdapter = {
  name: 'Local (mock)',

  async createLead(lead, sessionId) {
    const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const entry: CrmLead = {
      id,
      createdAt: new Date().toISOString(),
      source: 'echosphere-voice-ai',
      lead,
      sessionId,
    };
    const all = loadLeads();
    all[id] = entry;
    saveLeads(all);
    console.info('[CRM] Lead created (mock):', id, lead.name ?? 'anonymous');
    return entry;
  },

  async updateLead(id, partial) {
    const all = loadLeads();
    const existing = all[id];
    if (!existing) throw new Error(`CRM lead not found: ${id}`);
    const updated: CrmLead = {
      ...existing,
      lead: { ...existing.lead, ...partial },
    };
    all[id] = updated;
    saveLeads(all);
    return updated;
  },

  async getLead(id) {
    return loadLeads()[id] ?? null;
  },
};

// ─── Salesforce Adapter stub ──────────────────────────────────────────────────
// Uncomment and implement once you have server-side proxy routes:
//
// export const salesforceCrmAdapter: CrmAdapter = {
//   name: 'Salesforce',
//   async createLead(lead, sessionId) {
//     const res = await fetch('/api/crm/salesforce/leads', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ lead, sessionId }),
//     });
//     if (!res.ok) throw new Error('Salesforce CRM error: ' + res.status);
//     return res.json();
//   },
//   async updateLead(id, partial) { ... },
//   async getLead(id) { ... },
// };

// ─── HubSpot Adapter stub ─────────────────────────────────────────────────────
// export const hubspotCrmAdapter: CrmAdapter = { name: 'HubSpot', ... };

// ─── Active adapter ───────────────────────────────────────────────────────────

/**
 * Switch this to `salesforceCrmAdapter` or `hubspotCrmAdapter` to route leads
 * to a real CRM.  No component changes needed.
 */
export const activeCrmAdapter: CrmAdapter = mockCrmAdapter;

// ─── CRM Service ──────────────────────────────────────────────────────────────

let activeCrmLeadId: string | null = null;

/** Push a new lead to the active CRM.  Called at end-of-conversation. */
export async function pushLeadToCrm(
  lead: LeadInfo,
  sessionId?: string,
): Promise<CrmLead> {
  const entry = await activeCrmAdapter.createLead(lead, sessionId);
  activeCrmLeadId = entry.id;
  return entry;
}

/** Update the active lead in the CRM (e.g. when demo is booked). */
export async function updateActiveCrmLead(
  partial: Partial<LeadInfo>,
): Promise<void> {
  if (!activeCrmLeadId) return;
  await activeCrmAdapter.updateLead(activeCrmLeadId, partial);
}

/** Reset the active lead ID (call when a new session starts). */
export function resetCrmSession(): void {
  activeCrmLeadId = null;
}

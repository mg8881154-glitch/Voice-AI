/**
 * EchoSphere Lead Qualification Store — types, reducer, and helpers.
 *
 * The React context/provider lives in lib/LeadContext.tsx (JSX needs .tsx).
 * Import useLeadStore and LeadProvider from @/lib/LeadContext in components.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeadQualificationStatus =
  | 'unqualified'
  | 'interested'
  | 'qualified'
  | 'hot';

export type PurchaseTimeline =
  | 'immediate'
  | '1-3 months'
  | '3-6 months'
  | '6+ months'
  | 'unknown';

export interface LeadInfo {
  /** Customer's first / full name */
  name?: string;
  /** Company or organisation name */
  company?: string;
  /** Number of users / seats needed */
  userCount?: number;
  /** Free-text business requirement */
  requirement?: string;
  /** Budget the customer mentioned (free text, e.g. "$5k/yr") */
  budget?: string;
  /** Main pain point expressed by the customer */
  painPoint?: string;
  /** Plan the customer seemed most interested in */
  interestedPlan?: string;
  /** Anticipated purchase timeline */
  purchaseTimeline?: PurchaseTimeline;
  /** CRM-style qualification status */
  qualificationStatus: LeadQualificationStatus;
  /** Whether the customer requested a demo/meeting */
  demoRequested: boolean;
  /** Whether human escalation was triggered */
  escalated: boolean;
  /** ISO timestamp of first engagement */
  sessionStartedAt: string;
  /** Conversation summary generated at end-of-call */
  conversationSummary?: string;
}

// ─── Initial state ────────────────────────────────────────────────────────────

export const INITIAL_LEAD: LeadInfo = {
  qualificationStatus: 'unqualified',
  demoRequested: false,
  escalated: false,
  sessionStartedAt: new Date().toISOString(),
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

export type LeadAction =
  | { type: 'UPDATE_LEAD'; payload: Partial<LeadInfo> }
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_COMPANY'; payload: string }
  | { type: 'SET_USER_COUNT'; payload: number }
  | { type: 'SET_REQUIREMENT'; payload: string }
  | { type: 'SET_BUDGET'; payload: string }
  | { type: 'SET_PAIN_POINT'; payload: string }
  | { type: 'SET_INTERESTED_PLAN'; payload: string }
  | { type: 'SET_PURCHASE_TIMELINE'; payload: PurchaseTimeline }
  | { type: 'SET_QUALIFICATION_STATUS'; payload: LeadQualificationStatus }
  | { type: 'SET_DEMO_REQUESTED'; payload: boolean }
  | { type: 'SET_ESCALATED'; payload: boolean }
  | { type: 'SET_CONVERSATION_SUMMARY'; payload: string }
  | { type: 'RESET' };

export function leadReducer(state: LeadInfo, action: LeadAction): LeadInfo {
  switch (action.type) {
    case 'UPDATE_LEAD':
      return { ...state, ...action.payload };
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'SET_COMPANY':
      return { ...state, company: action.payload };
    case 'SET_USER_COUNT':
      return { ...state, userCount: action.payload };
    case 'SET_REQUIREMENT':
      return { ...state, requirement: action.payload };
    case 'SET_BUDGET':
      return { ...state, budget: action.payload };
    case 'SET_PAIN_POINT':
      return { ...state, painPoint: action.payload };
    case 'SET_INTERESTED_PLAN':
      return { ...state, interestedPlan: action.payload };
    case 'SET_PURCHASE_TIMELINE':
      return { ...state, purchaseTimeline: action.payload };
    case 'SET_QUALIFICATION_STATUS':
      return { ...state, qualificationStatus: action.payload };
    case 'SET_DEMO_REQUESTED':
      return { ...state, demoRequested: action.payload };
    case 'SET_ESCALATED':
      return { ...state, escalated: action.payload };
    case 'SET_CONVERSATION_SUMMARY':
      return { ...state, conversationSummary: action.payload };
    case 'RESET':
      return { ...INITIAL_LEAD, sessionStartedAt: new Date().toISOString() };
    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Human-readable label for the qualification status */
export function qualificationLabel(status: LeadQualificationStatus): string {
  switch (status) {
    case 'unqualified': return 'Unqualified';
    case 'interested':  return 'Interested';
    case 'qualified':   return 'Qualified';
    case 'hot':         return 'Hot Lead 🔥';
  }
}

/** Tailwind color classes for the qualification badge */
export function qualificationColor(status: LeadQualificationStatus): string {
  switch (status) {
    case 'unqualified': return 'bg-muted text-muted-foreground';
    case 'interested':  return 'bg-blue-500/15 text-blue-400';
    case 'qualified':   return 'bg-emerald-500/15 text-emerald-400';
    case 'hot':         return 'bg-orange-500/15 text-orange-400';
  }
}

/**
 * Derive a qualification status from the current lead data.
 * Call this whenever the lead is updated to keep the status current.
 */
export function deriveQualificationStatus(
  lead: Partial<LeadInfo>,
): LeadQualificationStatus {
  const score = [
    lead.name,
    lead.company,
    lead.userCount,
    lead.requirement,
    lead.budget,
    lead.purchaseTimeline && lead.purchaseTimeline !== 'unknown',
    lead.interestedPlan,
  ].filter(Boolean).length;

  if (score >= 5) return 'hot';
  if (score >= 3) return 'qualified';
  if (score >= 1) return 'interested';
  return 'unqualified';
}

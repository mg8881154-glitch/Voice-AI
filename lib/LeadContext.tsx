'use client';

/**
 * React context + provider for the EchoSphere lead store.
 * Kept in a .tsx file so JSX compiles correctly.
 * Pure types and the reducer live in lib/leadStore.ts.
 */

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import {
  leadReducer,
  INITIAL_LEAD,
  type LeadInfo,
  type LeadAction,
} from './leadStore';

// ─── Context ──────────────────────────────────────────────────────────────────

export type LeadContextValue = {
  lead: LeadInfo;
  dispatch: React.Dispatch<LeadAction>;
  /** Convenience updater — merges a partial LeadInfo without action boilerplate */
  updateLead: (partial: Partial<LeadInfo>) => void;
};

const LeadContext = createContext<LeadContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LeadProvider({ children }: { children: ReactNode }) {
  const [lead, dispatch] = useReducer(leadReducer, {
    ...INITIAL_LEAD,
    sessionStartedAt: new Date().toISOString(),
  });

  const updateLead = (partial: Partial<LeadInfo>) =>
    dispatch({ type: 'UPDATE_LEAD', payload: partial });

  return (
    <LeadContext.Provider value={{ lead, dispatch, updateLead }}>
      {children}
    </LeadContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLeadStore(): LeadContextValue {
  const ctx = useContext(LeadContext);
  if (!ctx) throw new Error('useLeadStore must be used inside <LeadProvider>');
  return ctx;
}

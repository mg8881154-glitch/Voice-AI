'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  DomainId,
  DomainMetadata,
  DOMAIN_PRESETS,
  getActiveDomain,
  setActiveDomain as setEngineActiveDomain,
  getAllDomains,
  getCustomDomains,
  saveCustomDomains,
  CustomMediaCard,
} from '@/lib/domainEngine';

export interface CreateCustomDomainInput {
  title: string;
  subtitle?: string;
  personaName: string;
  personaTitle: string;
  greetingMessage?: string;
  languagePreference?: string;
  accentPreference?: string;
  customInstructions: string;
  mediaCards?: CustomMediaCard[];
  badge?: string;
}

interface DomainContextType {
  activeDomain: DomainId;
  allDomains: Record<string, DomainMetadata>;
  activeDomainMetadata: DomainMetadata;
  setActiveDomain: (id: DomainId) => void;
  createCustomDomain: (input: CreateCustomDomainInput) => DomainMetadata;
  deleteCustomDomain: (id: string) => void;
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

export function DomainProvider({ children }: { children: ReactNode }) {
  const [activeDomain, setActiveDomainState] = useState<DomainId>('healthcare');
  const [allDomains, setAllDomains] = useState<Record<string, DomainMetadata>>(DOMAIN_PRESETS);

  // Initialize from storage on mount
  useEffect(() => {
    const initialDomain = getActiveDomain();
    const domains = getAllDomains();
    setAllDomains(domains);
    setActiveDomainState(initialDomain);

    const handleExternalChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.domainId) {
        setActiveDomainState(detail.domainId);
        setAllDomains(getAllDomains());
      }
    };

    window.addEventListener('echosphere:domain_changed', handleExternalChange);
    return () => window.removeEventListener('echosphere:domain_changed', handleExternalChange);
  }, []);

  const handleSetActiveDomain = (id: DomainId) => {
    setActiveDomainState(id);
    setEngineActiveDomain(id);
  };

  const createCustomDomain = (input: CreateCustomDomainInput): DomainMetadata => {
    const slug = `custom_${Date.now()}_${input.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15)}`;

    const newDomain: DomainMetadata = {
      id: slug,
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || `${input.personaName} — Custom Autonomous AI Specialist`,
      tagline: 'Custom AI Voice Domain Specialist',
      badge: input.badge?.trim().toUpperCase() || 'CUSTOM AI',
      color: 'text-violet-400',
      borderColor: 'border-violet-500/40',
      gradient: 'from-violet-500/15 via-purple-600/10 to-transparent',
      accentBg: 'bg-violet-500/10',
      personaName: input.personaName.trim(),
      personaTitle: input.personaTitle.trim(),
      greetingMessage:
        input.greetingMessage?.trim() ||
        `Hello! I am ${input.personaName}, your ${input.personaTitle}. How can I assist you today?`,
      sampleUserPrompts: [
        `What can you help me with in ${input.title}?`,
        `Tell me about your services and requirements.`,
        `Can you guide me step-by-step through this process?`,
      ],
      isCustom: true,
      customInstructions: input.customInstructions.trim(),
      languagePreference: input.languagePreference || 'Multi-lingual automatic detection',
      accentPreference: input.accentPreference || 'Natural conversational',
      mediaCards: {
        custom: input.mediaCards || [],
      },
    };

    const existingCustom = getCustomDomains();
    const updatedCustoms = { ...existingCustom, [slug]: newDomain };
    saveCustomDomains(updatedCustoms);

    const updatedAll = { ...DOMAIN_PRESETS, ...updatedCustoms };
    setAllDomains(updatedAll);
    handleSetActiveDomain(slug);

    return newDomain;
  };

  const deleteCustomDomain = (id: string) => {
    const existingCustom = getCustomDomains();
    if (!existingCustom[id]) return;

    delete existingCustom[id];
    saveCustomDomains(existingCustom);

    const updatedAll = { ...DOMAIN_PRESETS, ...existingCustom };
    setAllDomains(updatedAll);

    if (activeDomain === id) {
      handleSetActiveDomain('healthcare');
    }
  };

  const activeDomainMetadata = allDomains[activeDomain] || DOMAIN_PRESETS.healthcare;

  return (
    <DomainContext.Provider
      value={{
        activeDomain,
        allDomains,
        activeDomainMetadata,
        setActiveDomain: handleSetActiveDomain,
        createCustomDomain,
        deleteCustomDomain,
      }}
    >
      {children}
    </DomainContext.Provider>
  );
}

export function useDomain() {
  const context = useContext(DomainContext);
  if (!context) {
    throw new Error('useDomain must be used within a DomainProvider');
  }
  return context;
}

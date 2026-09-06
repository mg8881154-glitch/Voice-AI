'use client';

import React, { useState } from 'react';
import {
  Stethoscope,
  Building2,
  ShoppingBag,
  Sparkles,
  Plus,
  X,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Volume2,
  Globe2,
  Mic2,
  Sliders,
  ChevronRight,
  Layers,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDomain, CreateCustomDomainInput } from '@/context/DomainContext';
import { DomainId, CustomMediaCard } from '@/lib/domainEngine';

interface DynamicDomainPersonaSwitcherProps {
  className?: string;
  showMediaCards?: boolean;
}

export function DynamicDomainPersonaSwitcher({
  className,
  showMediaCards = true,
}: DynamicDomainPersonaSwitcherProps) {
  const {
    activeDomain,
    allDomains,
    activeDomainMetadata,
    setActiveDomain,
    createCustomDomain,
    deleteCustomDomain,
  } = useDomain();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for creating a custom domain
  const [formTitle, setFormTitle] = useState('');
  const [formAgentName, setFormAgentName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formLanguage, setFormLanguage] = useState('English (US)');
  const [formAccent, setFormAccent] = useState('Professional Conversational');
  const [formGreeting, setFormGreeting] = useState('');
  const [formBadge, setFormBadge] = useState('CUSTOM');

  // Custom media cards state
  const [mediaCards, setMediaCards] = useState<Array<{
    imageUrl: string;
    title: string;
    subtitle: string;
    actionButtonLabel: string;
  }>>([
    {
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&q=80',
      title: 'Corporate Headquarters Tour',
      subtitle: 'Premier Downtown Facility',
      actionButtonLabel: 'Schedule Consultation',
    },
  ]);

  const handleAddMediaCard = () => {
    setMediaCards(prev => [
      ...prev,
      {
        imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&q=80',
        title: 'New Service Package',
        subtitle: 'Tailored Solution',
        actionButtonLabel: 'Inquire Now',
      },
    ]);
  };

  const handleRemoveMediaCard = (idx: number) => {
    setMediaCards(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateMediaCard = (idx: number, field: string, val: string) => {
    setMediaCards(prev =>
      prev.map((card, i) => (i === idx ? { ...card, [field]: val } : card))
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAgentName.trim() || !formInstructions.trim()) {
      alert('Please fill out the Domain Title, Agent Name, and Custom Instructions.');
      return;
    }

    const customCards: CustomMediaCard[] = mediaCards.map((c, i) => ({
      id: `card_${Date.now()}_${i}`,
      imageUrl: c.imageUrl.trim() || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&q=80',
      title: c.title.trim() || 'Featured Service',
      subtitle: c.subtitle.trim() || 'Custom Solution',
      actionButtonLabel: c.actionButtonLabel.trim() || 'Learn More',
    }));

    const payload: CreateCustomDomainInput = {
      title: formTitle.trim(),
      personaName: formAgentName.trim(),
      personaTitle: formRole.trim() || 'Domain Specialist',
      customInstructions: formInstructions.trim(),
      languagePreference: formLanguage,
      accentPreference: formAccent,
      greetingMessage: formGreeting.trim() || undefined,
      badge: formBadge.trim() || 'CUSTOM',
      mediaCards: customCards,
    };

    createCustomDomain(payload);
    setIsCreateModalOpen(false);

    // Reset form
    setFormTitle('');
    setFormAgentName('');
    setFormRole('');
    setFormInstructions('');
    setFormGreeting('');
  };

  // Icon selector based on domain
  const getDomainIcon = (id: string) => {
    switch (id) {
      case 'healthcare':
        return <Stethoscope className="h-4 w-4" />;
      case 'realestate':
        return <Building2 className="h-4 w-4" />;
      case 'ecommerce':
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  // Predefined domain list
  const predefinedIds: DomainId[] = ['healthcare', 'realestate', 'ecommerce'];
  const customDomains = Object.values(allDomains).filter(d => d.isCustom);

  return (
    <div className={cn('space-y-6', className)}>
      {/* ── Header: Domain Switcher Title & Action ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Dynamic AI Domain &amp; Persona Switcher
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a domain preset or create your own custom domain with dedicated system prompts and media cards
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-95 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Create Custom Domain</span>
        </button>
      </div>

      {/* ── Domain Selector Tabs / Cards Grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {/* Predefined domains */}
        {predefinedIds.map(id => {
          const domain = allDomains[id];
          if (!domain) return null;
          const isSelected = activeDomain === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveDomain(id)}
              className={cn(
                'group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 backdrop-blur-sm',
                isSelected
                  ? cn('border-opacity-80 shadow-lg', domain.borderColor, domain.accentBg, 'ring-1 ring-white/10')
                  : 'border-border/60 bg-card/30 hover:border-white/20 hover:bg-card/50'
              )}
            >
              <div className="flex w-full items-center justify-between mb-2">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl border bg-background/80 shadow-sm',
                    isSelected ? cn(domain.borderColor, domain.color) : 'border-border text-muted-foreground'
                  )}
                >
                  {getDomainIcon(id)}
                </div>
                {isSelected && (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>

              <span className={cn('text-[10px] font-mono font-bold uppercase tracking-wider', isSelected ? domain.color : 'text-muted-foreground')}>
                {domain.badge}
              </span>
              <h4 className="text-xs font-bold text-foreground mt-0.5 truncate w-full">
                {domain.title}
              </h4>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                {domain.personaName}
              </p>
            </button>
          );
        })}

        {/* Custom Domains */}
        {customDomains.map(custom => {
          const isSelected = activeDomain === custom.id;
          return (
            <div
              key={custom.id}
              className={cn(
                'group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 backdrop-blur-sm cursor-pointer',
                isSelected
                  ? 'border-violet-500/70 bg-violet-500/10 shadow-lg ring-1 ring-violet-500/30'
                  : 'border-border/60 bg-card/30 hover:border-violet-500/40 hover:bg-card/50'
              )}
              onClick={() => setActiveDomain(custom.id)}
            >
              <div>
                <div className="flex w-full items-center justify-between mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/40 bg-background/80 text-violet-400 shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete custom domain "${custom.title}"?`)) {
                        deleteCustomDomain(custom.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete domain"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-400">
                  {custom.badge}
                </span>
                <h4 className="text-xs font-bold text-foreground mt-0.5 truncate w-full">
                  {custom.title}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                  {custom.personaName}
                </p>
              </div>

              {isSelected && (
                <span className="mt-2 flex items-center gap-1 text-[9px] font-bold text-violet-300">
                  <CheckCircle2 className="h-3 w-3 text-violet-400" /> Active Persona
                </span>
              )}
            </div>
          );
        })}

        {/* Quick Add Custom Card */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/10 p-4 text-center text-muted-foreground hover:border-indigo-500/60 hover:text-indigo-400 hover:bg-card/25 transition-all group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/40 group-hover:bg-indigo-500/15 group-hover:text-indigo-400 transition mb-1.5">
            <Plus className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold">New Custom</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">Configure Persona</span>
        </button>
      </div>

      {/* ── Active Persona Spotlight Banner ── */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border p-5 transition-all backdrop-blur-md bg-gradient-to-r',
          activeDomainMetadata.borderColor,
          activeDomainMetadata.gradient,
          'shadow-xl'
        )}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-mono font-bold uppercase tracking-wider', activeDomainMetadata.color)}>
                {activeDomainMetadata.badge}
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-xs text-muted-foreground font-mono">
                {activeDomainMetadata.isCustom
                  ? `${activeDomainMetadata.languagePreference || 'Multi-lingual'} (${activeDomainMetadata.accentPreference || 'Standard'})`
                  : '30+ Languages Auto-Detected'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              {activeDomainMetadata.personaName}
              <span className="text-xs font-normal text-muted-foreground">({activeDomainMetadata.personaTitle})</span>
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeDomainMetadata.subtitle}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-right self-start lg:self-center">
            <p className="text-[10px] uppercase font-mono text-muted-foreground">Context Hook</p>
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 justify-end">
              <CheckCircle2 className="h-3.5 w-3.5" /> React Context Synced
            </p>
          </div>
        </div>

        {/* Spoken Greeting Quote */}
        <div className="mt-4 rounded-xl border border-white/5 bg-background/50 p-3 text-xs text-foreground/90 font-mono flex items-start gap-2.5">
          <Volume2 className={cn('h-4 w-4 shrink-0 mt-0.5', activeDomainMetadata.color)} />
          <p className="italic leading-relaxed">
            &quot;{activeDomainMetadata.greetingMessage}&quot;
          </p>
        </div>
      </div>

      {/* ── Dynamic Media Cards Preview for Active Domain ── */}
      {showMediaCards && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" />
              Dynamic In-Session Media Cards ({activeDomainMetadata.title})
            </h4>
            <span className="text-[11px] text-muted-foreground font-mono">
              Live In-Call Visualizer
            </span>
          </div>

          {/* Custom Domain Media Cards */}
          {activeDomainMetadata.isCustom && activeDomainMetadata.mediaCards.custom && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeDomainMetadata.mediaCards.custom.map(card => (
                <div
                  key={card.id}
                  className="rounded-2xl border border-violet-500/30 bg-card/40 overflow-hidden backdrop-blur-sm flex flex-col justify-between hover:border-violet-500/60 transition"
                >
                  <div className="relative h-36 w-full bg-muted/30">
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[9px] font-bold text-violet-300 border border-violet-500/40">
                      CUSTOM CARD
                    </span>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-foreground">{card.title}</h5>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{card.subtitle}</p>
                    </div>

                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-violet-500/15 border border-violet-500/40 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/25 transition mt-2"
                    >
                      {card.actionButtonLabel} <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fallback to standard cards for predefined domains */}
          {!activeDomainMetadata.isCustom && activeDomain === 'healthcare' && activeDomainMetadata.mediaCards.healthcare && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {activeDomainMetadata.mediaCards.healthcare.map(doc => (
                <div key={doc.id} className="rounded-2xl border border-emerald-500/30 bg-card/40 p-4 space-y-2.5 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <img src={doc.avatar} alt={doc.name} className="h-10 w-10 rounded-xl object-cover border border-emerald-500/30" />
                    <div className="overflow-hidden">
                      <h5 className="text-xs font-bold text-foreground truncate">{doc.name}</h5>
                      <p className="text-[11px] text-emerald-400 font-medium truncate">{doc.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                    <span>{doc.availableSlot}</span>
                    <span className="font-bold text-emerald-300">{doc.fee}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!activeDomainMetadata.isCustom && activeDomain === 'realestate' && activeDomainMetadata.mediaCards.realestate && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {activeDomainMetadata.mediaCards.realestate.map(prop => (
                <div key={prop.id} className="rounded-2xl border border-amber-500/30 bg-card/40 overflow-hidden backdrop-blur-sm flex flex-col">
                  <div className="h-28 w-full relative">
                    <img src={prop.image} alt={prop.title} className="h-full w-full object-cover" />
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-0.5 text-xs font-bold text-white">
                      {prop.price}
                    </span>
                  </div>
                  <div className="p-3">
                    <h5 className="text-xs font-bold text-foreground truncate">{prop.title}</h5>
                    <p className="text-[11px] text-muted-foreground">{prop.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!activeDomainMetadata.isCustom && activeDomain === 'ecommerce' && activeDomainMetadata.mediaCards.ecommerce && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {activeDomainMetadata.mediaCards.ecommerce.map(prod => (
                <div key={prod.id} className="rounded-2xl border border-indigo-500/30 bg-card/40 p-3 space-y-2 backdrop-blur-sm flex items-center gap-3">
                  <img src={prod.image} alt={prod.title} className="h-12 w-12 rounded-xl object-cover border border-indigo-500/30 shrink-0" />
                  <div className="overflow-hidden">
                    <h5 className="text-xs font-bold text-foreground truncate">{prod.title}</h5>
                    <p className="text-xs font-semibold text-indigo-300">{prod.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Create Custom Domain ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="flex h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-indigo-500/30 bg-slate-950 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 bg-card/60 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Create Custom Domain &amp; Persona</h3>
                  <p className="text-xs text-muted-foreground">
                    Define agent role, custom prompt instructions, language/accent, and rich media cards
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Scroll Area */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Row 1: Domain Title & Badge */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Domain Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Legal Consulting, Travel Concierge, Fitness Coach"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card/50 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">UI Badge</label>
                  <input
                    type="text"
                    placeholder="e.g., LEGAL AI"
                    value={formBadge}
                    onChange={e => setFormBadge(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card/50 px-3.5 py-2 text-xs text-foreground font-mono uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Row 2: Agent Name & Role */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Agent Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Attorney Vance, Chef Mario, Coach Maya"
                    value={formAgentName}
                    onChange={e => setFormAgentName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card/50 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Agent Role / Subtitle *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Senior Corporate Legal Counsel"
                    value={formRole}
                    onChange={e => setFormRole(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card/50 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Row 3: Language & Accent Preferences */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 text-indigo-400" /> Language Preference
                  </label>
                  <select
                    value={formLanguage}
                    onChange={e => setFormLanguage(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card/50 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="English (US)">English (US Standard)</option>
                    <option value="Bilingual Hindi-English">Bilingual Hindi-English (Hinglish)</option>
                    <option value="Spanish (Latin America)">Spanish (Latin America)</option>
                    <option value="French (Parisian)">French (European)</option>
                    <option value="German (Standard)">German (Hochdeutsch)</option>
                    <option value="Mandarin Chinese">Mandarin Chinese</option>
                    <option value="Japanese">Japanese (Standard)</option>
                    <option value="Arabic (Gulf)">Arabic (Modern Standard)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mic2 className="h-3.5 w-3.5 text-violet-400" /> Voice Accent / Cadence
                  </label>
                  <select
                    value={formAccent}
                    onChange={e => setFormAccent(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card/50 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Professional Conversational">Professional Consultative</option>
                    <option value="Warm & Empathetic">Warm &amp; Empathetic (Care tone)</option>
                    <option value="High-Energy Sales">High-Energy &amp; Persuasive</option>
                    <option value="Authoritative Academic">Authoritative &amp; Structured</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Spoken Greeting */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Spoken Opening Greeting</label>
                <input
                  type="text"
                  placeholder="e.g., Hello! I am Attorney Vance. Are you looking to discuss contract review or incorporation?"
                  value={formGreeting}
                  onChange={e => setFormGreeting(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card/50 px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Row 5: Custom System Instructions */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Custom System Instructions *
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Injected into Nova&apos;s LLM core
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder={`Define specific directives, pricing guidelines, objections, or qualification rules:\n- Qualify company size and incorporation status\n- Offer 30-minute legal audit consultation\n- For criminal or urgent disputes, trigger human escalation immediately`}
                  value={formInstructions}
                  onChange={e => setFormInstructions(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card/50 p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
                />
              </div>

              {/* Row 6: Custom Media Cards Builder */}
              <div className="space-y-3 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-foreground">
                      Custom In-Session Media Cards
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      These cards render dynamically on screen while the user speaks with Nova
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMediaCard}
                    className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Media Card
                  </button>
                </div>

                <div className="space-y-3">
                  {mediaCards.map((card, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border/70 bg-card/30 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-indigo-300">
                          Media Card #{idx + 1}
                        </span>
                        {mediaCards.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMediaCard(idx)}
                            className="text-xs text-rose-400 hover:text-rose-300 transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-[11px] text-muted-foreground">Card Title</label>
                          <input
                            type="text"
                            value={card.title}
                            onChange={e => handleUpdateMediaCard(idx, 'title', e.target.value)}
                            placeholder="e.g., Full IP & Trademark Audit"
                            className="w-full rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs text-foreground mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-muted-foreground">Subtitle / Detail</label>
                          <input
                            type="text"
                            value={card.subtitle}
                            onChange={e => handleUpdateMediaCard(idx, 'subtitle', e.target.value)}
                            placeholder="e.g., Fixed fee $499 • 48hr delivery"
                            className="w-full rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs text-foreground mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-muted-foreground">Image URL</label>
                          <input
                            type="text"
                            value={card.imageUrl}
                            onChange={e => handleUpdateMediaCard(idx, 'imageUrl', e.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs text-foreground mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-muted-foreground">Action Button Label</label>
                          <input
                            type="text"
                            value={card.actionButtonLabel}
                            onChange={e => handleUpdateMediaCard(idx, 'actionButtonLabel', e.target.value)}
                            placeholder="e.g., Book Audit Session"
                            className="w-full rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs text-foreground mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/40 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-xl shadow-indigo-500/25 transition hover:opacity-95 active:scale-95"
                >
                  <Sparkles className="h-4 w-4" />
                  Save &amp; Activate Persona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

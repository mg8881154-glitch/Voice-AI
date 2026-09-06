'use client';

import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Building2,
  ShoppingBag,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  Star,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  Truck,
  Sparkles,
  ArrowRight,
  PhoneCall,
  Volume2,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DomainId,
  DOMAIN_PRESETS,
  getActiveDomain,
  setActiveDomain,
  DomainMetadata,
} from '@/lib/domainEngine';

interface DomainPersonaSelectorProps {
  onSelectDomain?: (domainId: DomainId) => void;
  className?: string;
  showMediaCards?: boolean;
}

export function DomainPersonaSelector({
  onSelectDomain,
  className,
  showMediaCards = true,
}: DomainPersonaSelectorProps) {
  const [selectedDomainId, setSelectedDomainId] = useState<DomainId>('healthcare');
  const [activeTab, setActiveTab] = useState<'all' | 'media' | 'prompts'>('media');

  useEffect(() => {
    const current = getActiveDomain();
    setSelectedDomainId(current);

    const handleDomainChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.domainId) {
        setSelectedDomainId(detail.domainId);
      }
    };

    window.addEventListener('echosphere:domain_changed', handleDomainChange);
    return () => window.removeEventListener('echosphere:domain_changed', handleDomainChange);
  }, []);

  const handleDomainClick = (id: DomainId) => {
    setSelectedDomainId(id);
    setActiveDomain(id);
    if (onSelectDomain) {
      onSelectDomain(id);
    }
  };

  const domain = DOMAIN_PRESETS[selectedDomainId] || DOMAIN_PRESETS.healthcare;

  const domainIcons: Record<DomainId, React.ReactNode> = {
    healthcare: <Stethoscope className="h-5 w-5" />,
    realestate: <Building2 className="h-5 w-5" />,
    ecommerce:  <ShoppingBag className="h-5 w-5" />,
    edtech:     <GraduationCap className="h-5 w-5" />,
  };

  return (
    <div className={cn('space-y-5', className)}>
      {/* ─── Domain Selector Header & Quick Switcher ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Domain-Specific Persona Engine
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Switch between tailored system prompts, multilingual vocabularies, and dynamic media cards
          </p>
        </div>

        {/* Pill Selection */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card/40 p-1 backdrop-blur-sm overflow-x-auto">
          {(Object.keys(DOMAIN_PRESETS) as DomainId[]).map(id => {
            const isSelected = selectedDomainId === id;
            const item = DOMAIN_PRESETS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleDomainClick(id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap',
                  isSelected
                    ? cn('bg-background text-foreground shadow-sm border', item.borderColor, item.color)
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                {domainIcons[id]}
                <span>{item.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Active Persona Hero Banner ─── */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md bg-gradient-to-r',
          domain.borderColor,
          domain.gradient,
          'border-opacity-60 shadow-xl'
        )}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-background/60 shadow-inner',
                domain.borderColor,
                domain.color
              )}
            >
              {domainIcons[selectedDomainId]}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-mono font-bold tracking-wider uppercase', domain.color)}>
                  {domain.badge}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-xs text-muted-foreground font-medium">30+ Languages Auto-Routed</span>
              </div>
              <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                {domain.personaName}
                <span className="text-xs font-normal text-muted-foreground">({domain.personaTitle})</span>
              </h4>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                {domain.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-right">
              <p className="text-[10px] uppercase font-mono text-muted-foreground">Handover Protocol</p>
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                <ShieldCheck className="h-3.5 w-3.5" /> Auto-Escalate Active
              </p>
            </div>
          </div>
        </div>

        {/* Spoken Greeting Quote */}
        <div className="mt-4 rounded-xl border border-white/5 bg-background/40 p-3 text-xs text-foreground/90 font-mono flex items-start gap-2.5">
          <Volume2 className={cn('h-4 w-4 shrink-0 mt-0.5', domain.color)} />
          <p className="italic">
            &quot;{domain.greetingMessage}&quot;
          </p>
        </div>
      </div>

      {/* ─── Dynamic Rich UI Media Cards ─── */}
      {showMediaCards && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Dynamic In-Session Media Cards ({domain.title})
            </h4>
            <span className="text-[11px] text-muted-foreground font-mono">
              Live sync with Nova speech stream
            </span>
          </div>

          {/* 1. Healthcare Cards */}
          {selectedDomainId === 'healthcare' && domain.mediaCards.healthcare && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {domain.mediaCards.healthcare.map(doc => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-emerald-500/30 bg-card/40 p-4 transition-all hover:border-emerald-500/60 hover:bg-card/60 backdrop-blur-sm space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={doc.avatar}
                      alt={doc.name}
                      className="h-12 w-12 rounded-xl object-cover border border-emerald-500/30"
                    />
                    <div className="overflow-hidden">
                      <h5 className="text-xs font-bold text-foreground truncate">{doc.name}</h5>
                      <p className="text-[11px] text-emerald-400 font-medium truncate">{doc.specialty}</p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-foreground">{doc.rating}</span>
                        <span>•</span>
                        <span>{doc.hospital}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-background/50 p-2.5 text-[11px] border border-white/5">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      Next Slot:
                    </span>
                    <span className="font-bold text-emerald-300">{doc.availableSlot}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-foreground">{doc.fee}</span>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25 transition"
                    >
                      <Calendar className="h-3 w-3" /> Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Real Estate Cards */}
          {selectedDomainId === 'realestate' && domain.mediaCards.realestate && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {domain.mediaCards.realestate.map(prop => (
                <div
                  key={prop.id}
                  className="rounded-2xl border border-amber-500/30 bg-card/40 overflow-hidden transition-all hover:border-amber-500/60 hover:bg-card/60 backdrop-blur-sm flex flex-col"
                >
                  <div className="relative h-36 w-full">
                    <img
                      src={prop.image}
                      alt={prop.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/40 backdrop-blur-sm">
                      {prop.tag}
                    </span>
                    <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                      {prop.price}
                    </span>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-foreground">{prop.title}</h5>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-amber-400 shrink-0" /> {prop.location}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                      <span>{prop.bedrooms} Beds</span>
                      <span>•</span>
                      <span>{prop.bathrooms} Baths</span>
                      <span>•</span>
                      <span className="font-mono">{prop.sqft} sqft</span>
                    </div>

                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 transition mt-2"
                    >
                      <Building2 className="h-3.5 w-3.5" /> Schedule 3D Virtual Tour
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. E-Commerce Cards */}
          {selectedDomainId === 'ecommerce' && domain.mediaCards.ecommerce && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {domain.mediaCards.ecommerce.map(item => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-indigo-500/30 bg-card/40 p-4 transition-all hover:border-indigo-500/60 hover:bg-card/60 backdrop-blur-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-16 w-16 rounded-xl object-cover border border-indigo-500/30 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">
                        {item.category}
                      </span>
                      <h5 className="text-xs font-bold text-foreground truncate">{item.title}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-foreground">{item.price}</span>
                        {item.originalPrice && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            {item.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-background/50 p-2 text-[11px] border border-white/5">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Truck className="h-3.5 w-3.5" />
                      {item.deliveryEstimate}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {item.sku}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-1 rounded-xl bg-indigo-500/15 border border-indigo-500/40 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 transition"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Inquire via Voice
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 4. EdTech Cards */}
          {selectedDomainId === 'edtech' && domain.mediaCards.edtech && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {domain.mediaCards.edtech.map(course => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-rose-500/30 bg-card/40 p-4 transition-all hover:border-rose-500/60 hover:bg-card/60 backdrop-blur-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-rose-400">
                        {course.duration}
                      </span>
                      {course.scholarshipAvailable && (
                        <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                          SCHOLARSHIP READY
                        </span>
                      )}
                    </div>
                    <h5 className="text-xs font-bold text-foreground">{course.title}</h5>
                    <p className="text-[11px] text-muted-foreground">{course.level}</p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {course.skills.map(s => (
                      <span
                        key={s}
                        className="rounded-md bg-background/60 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground border border-white/5"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="border-t border-border/50 pt-2 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Tuition Fee</p>
                      <p className="text-xs font-bold text-foreground">{course.tuition}</p>
                    </div>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-xl bg-rose-500/15 border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition"
                    >
                      <GraduationCap className="h-3.5 w-3.5" /> Book Counselor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Sample Spoken Prompts for this Domain ─── */}
      <div className="rounded-2xl border border-border/60 bg-card/30 p-4 space-y-2.5">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          Try Asking Nova in this Domain (Any Language):
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {domain.sampleUserPrompts.map((prompt, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-white/5 bg-background/40 px-3 py-2 text-xs text-foreground/85 flex items-center gap-2 hover:border-indigo-500/30 transition cursor-default"
            >
              <ChevronRight className="h-3 w-3 text-indigo-400 shrink-0" />
              <span className="italic truncate">&quot;{prompt}&quot;</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

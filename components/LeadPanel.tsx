'use client';

import { User, Building2, Users, Briefcase, DollarSign, AlertCircle, Package, Clock, Edit2, Check, X } from 'lucide-react';
import { useState } from 'react';
import { useLeadStore } from '@/lib/LeadContext';
import {
  qualificationLabel,
  qualificationColor,
  type LeadInfo,
  type PurchaseTimeline,
} from '@/lib/leadStore';
import { PLANS } from '@/lib/productKnowledge';
import { cn } from '@/lib/utils';

// ─── Editable field ───────────────────────────────────────────────────────────

type EditableFieldProps = {
  label: string;
  value: string | undefined;
  icon: React.ReactNode;
  onSave: (val: string) => void;
  placeholder?: string;
  inputType?: string;
};

function EditableField({
  label,
  value,
  icon,
  onSave,
  placeholder = 'Not captured yet',
  inputType = 'text',
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  const commit = () => {
    if (draft.trim()) onSave(draft.trim());
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value ?? '');
    setEditing(false);
  };

  return (
    <div className="group flex items-start gap-2 py-2 border-b border-border/40 last:border-0">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
          {label}
        </p>
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              type={inputType}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') cancel();
              }}
              className="h-6 w-full rounded border border-border bg-background px-1.5 text-xs text-foreground outline-none focus:border-primary"
            />
            <button onClick={commit} className="text-primary hover:text-primary/80" aria-label="Save">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={cancel} className="text-muted-foreground hover:text-foreground" aria-label="Cancel">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <span className={cn('text-xs', value ? 'text-foreground' : 'text-muted-foreground/50 italic')}>
              {value || placeholder}
            </span>
            <button
              onClick={() => { setDraft(value ?? ''); setEditing(true); }}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              aria-label={`Edit ${label}`}
            >
              <Edit2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Select field (for dropdowns) ─────────────────────────────────────────────

type SelectFieldProps<T extends string> = {
  label: string;
  value: T | undefined;
  icon: React.ReactNode;
  options: { value: T; label: string }[];
  onChange: (val: T) => void;
  placeholder?: string;
};

function SelectField<T extends string>({
  label,
  value,
  icon,
  options,
  onChange,
  placeholder = 'Not captured yet',
}: SelectFieldProps<T>) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-border/40 last:border-0">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
          {label}
        </p>
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value as T)}
          className="h-6 w-full rounded border border-border bg-background px-1.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── LeadPanel ────────────────────────────────────────────────────────────────

const PLAN_OPTIONS = PLANS.map((p) => ({ value: p.id, label: p.name }));

const TIMELINE_OPTIONS: { value: PurchaseTimeline; label: string }[] = [
  { value: 'immediate', label: 'Immediate' },
  { value: '1-3 months', label: '1–3 months' },
  { value: '3-6 months', label: '3–6 months' },
  { value: '6+ months', label: '6+ months' },
  { value: 'unknown', label: 'Unknown' },
];

type LeadPanelProps = {
  className?: string;
};

export function LeadPanel({ className }: LeadPanelProps) {
  const { lead, updateLead } = useLeadStore();

  const update = <K extends keyof LeadInfo>(key: K) =>
    (val: LeadInfo[K]) => updateLead({ [key]: val } as Partial<LeadInfo>);

  const planLabel = PLANS.find((p) => p.id === lead.interestedPlan)?.name;

  return (
    <section
      className={cn(
        'flex flex-col rounded-2xl border border-border bg-card/30 backdrop-blur-sm overflow-hidden',
        className,
      )}
      aria-label="Lead information panel"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Lead Information</h2>
          <p className="text-xs text-muted-foreground">Captured from conversation</p>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
            qualificationColor(lead.qualificationStatus),
          )}
        >
          {qualificationLabel(lead.qualificationStatus)}
        </span>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-1 min-h-0">
        <EditableField
          label="Name"
          value={lead.name}
          icon={<User className="h-3.5 w-3.5" />}
          onSave={update('name')}
        />
        <EditableField
          label="Company"
          value={lead.company}
          icon={<Building2 className="h-3.5 w-3.5" />}
          onSave={update('company')}
        />
        <EditableField
          label="No. of Users"
          value={lead.userCount?.toString()}
          icon={<Users className="h-3.5 w-3.5" />}
          inputType="number"
          onSave={(v) => updateLead({ userCount: parseInt(v, 10) })}
        />
        <EditableField
          label="Requirement"
          value={lead.requirement}
          icon={<Briefcase className="h-3.5 w-3.5" />}
          onSave={update('requirement')}
        />
        <EditableField
          label="Budget"
          value={lead.budget}
          icon={<DollarSign className="h-3.5 w-3.5" />}
          onSave={update('budget')}
        />
        <EditableField
          label="Pain Point"
          value={lead.painPoint}
          icon={<AlertCircle className="h-3.5 w-3.5" />}
          onSave={update('painPoint')}
        />
        <SelectField
          label="Interested Plan"
          value={lead.interestedPlan as string | undefined}
          icon={<Package className="h-3.5 w-3.5" />}
          options={PLAN_OPTIONS}
          onChange={update('interestedPlan')}
          placeholder={planLabel ?? 'Not captured yet'}
        />
        <SelectField
          label="Purchase Timeline"
          value={lead.purchaseTimeline}
          icon={<Clock className="h-3.5 w-3.5" />}
          options={TIMELINE_OPTIONS}
          onChange={update('purchaseTimeline')}
        />
      </div>

      {/* Status flags */}
      <div className="shrink-0 border-t border-border px-4 py-2 flex items-center gap-3">
        <Flag active={lead.demoRequested} label="Demo requested" activeColor="text-emerald-400" />
        <Flag active={lead.escalated} label="Escalated" activeColor="text-amber-400" />
      </div>
    </section>
  );
}

function Flag({
  active,
  label,
  activeColor,
}: {
  active: boolean;
  label: string;
  activeColor: string;
}) {
  return (
    <span className={cn('flex items-center gap-1 text-[11px] font-medium', active ? activeColor : 'text-muted-foreground/40')}>
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-current' : 'bg-current')} />
      {label}
    </span>
  );
}

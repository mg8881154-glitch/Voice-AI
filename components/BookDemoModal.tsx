'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Clock, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import {
  getAvailableSlots,
  bookDemo,
  MEETING_TYPE_LABELS,
  type TimeSlot,
  type MeetingType,
  type BookingConfirmation,
} from '@/lib/bookingService';
import { useLeadStore } from '@/lib/LeadContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BookDemoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onBooked?: (confirmation: BookingConfirmation) => void;
};

type Step = 'type' | 'slot' | 'details' | 'confirm' | 'success';

export function BookDemoModal({ isOpen, onClose, onBooked }: BookDemoModalProps) {
  const { lead, updateLead } = useLeadStore();

  const [step, setStep] = useState<Step>('type');
  const [meetingType, setMeetingType] = useState<MeetingType>('product_demo');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState(lead.name ?? '');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState(lead.company ?? '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('type');
      setSelectedSlot(null);
      setConfirmation(null);
      setError(null);
      setName(lead.name ?? '');
      setCompany(lead.company ?? '');
    }
  }, [isOpen, lead.name, lead.company]);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const available = await getAvailableSlots(meetingType, 7);
      setSlots(available);
    } catch {
      setError('Failed to load available slots. Please try again.');
    } finally {
      setLoadingSlots(false);
    }
  }, [meetingType]);

  useEffect(() => {
    if (step === 'slot') loadSlots();
  }, [step, loadSlots]);

  const handleSubmit = async () => {
    if (!selectedSlot || !name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await bookDemo({
        meetingType,
        slotId: selectedSlot.id,
        attendeeName: name.trim(),
        attendeeEmail: email.trim(),
        attendeeCompany: company.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setConfirmation(result);
      setStep('success');
      updateLead({ demoRequested: true, name: name.trim(), company: company.trim() || lead.company });
      onBooked?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Book a demo"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Book a Demo</h2>
            <p className="text-xs text-muted-foreground">Schedule time with our team</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress dots */}
        {step !== 'success' && (
          <div className="flex items-center justify-center gap-1.5 pt-4 px-6">
            {(['type', 'slot', 'details', 'confirm'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  step === s ? 'w-6 bg-primary' : i < ['type','slot','details','confirm'].indexOf(step) ? 'w-4 bg-primary/40' : 'w-4 bg-border',
                )}
              />
            ))}
          </div>
        )}

        <div className="px-6 py-5">
          {/* Step 1: Meeting type */}
          {step === 'type' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">What type of session would you like?</p>
              {(Object.entries(MEETING_TYPE_LABELS) as [MeetingType, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMeetingType(key)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors',
                    meetingType === key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:border-primary/50',
                  )}
                >
                  <span className="font-medium">{label}</span>
                  {meetingType === key && <CheckCircle2 className="h-4 w-4" />}
                </button>
              ))}
              <Button className="w-full mt-2" onClick={() => setStep('slot')}>
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Slot picker */}
          {step === 'slot' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Pick a time slot
              </p>
              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                        selectedSlot?.id === slot.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-foreground hover:border-primary/50',
                      )}
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{slot.displayLabel}</span>
                      {selectedSlot?.id === slot.id && <CheckCircle2 className="ml-auto h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('type')}>Back</Button>
                <Button className="flex-1" disabled={!selectedSlot} onClick={() => setStep('details')}>
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Contact details */}
          {step === 'details' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Your details</p>
              {[
                { id: 'name', label: 'Full Name *', value: name, set: setName, type: 'text', required: true },
                { id: 'email', label: 'Work Email *', value: email, set: setEmail, type: 'email', required: true },
                { id: 'company', label: 'Company', value: company, set: setCompany, type: 'text', required: false },
              ].map(({ id, label, value, set, type, required }) => (
                <div key={id}>
                  <label htmlFor={id} className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
                  <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    required={required}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
              ))}
              <div>
                <label htmlFor="notes" className="block text-xs font-medium text-muted-foreground mb-1">Notes (optional)</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Anything specific you'd like to cover?"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('slot')}>Back</Button>
                <Button className="flex-1" disabled={!name.trim() || !email.trim()} onClick={() => setStep('confirm')}>
                  Review <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && selectedSlot && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">Confirm your booking</p>
              <div className="rounded-xl border border-border bg-background/50 p-4 space-y-2 text-sm">
                <Row label="Session" value={MEETING_TYPE_LABELS[meetingType]} />
                <Row label="Time" value={selectedSlot.displayLabel} />
                <Row label="Name" value={name} />
                <Row label="Email" value={email} />
                {company && <Row label="Company" value={company} />}
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('details')}>Back</Button>
                <Button className="flex-1" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Booking...</> : 'Confirm Booking'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && confirmation && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Demo Booked!</p>
                <p className="mt-1 text-sm text-muted-foreground">{confirmation.slot.displayLabel}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Confirmation ID: <span className="font-mono text-primary">{confirmation.confirmationId}</span>
                </p>
              </div>
              {confirmation.meetingLink && (
                <a
                  href={confirmation.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline underline-offset-2"
                >
                  Join link (placeholder)
                </a>
              )}
              <p className="text-xs text-muted-foreground">
                A calendar invite will be sent to <strong>{email}</strong> shortly.
              </p>
              <Button className="w-full" onClick={onClose}>Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium text-right">{value}</span>
    </div>
  );
}

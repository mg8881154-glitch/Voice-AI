/**
 * EchoSphere Meeting / Demo Booking Service
 *
 * For the prototype this uses an in-memory store.
 * The interface is designed so a real calendar API (Google Calendar, Calendly,
 * Outlook, Chili Piper, etc.) can be wired in by implementing `CalendarAdapter`
 * and swapping `activeCalendarAdapter` — no component changes needed.
 *
 * Real calendar integrations must be implemented server-side (app/api/booking/...)
 * to keep API keys off the client.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type MeetingType = 'product_demo' | 'sales_call' | 'technical_review';

export interface TimeSlot {
  id: string;
  date: string;          // ISO date string YYYY-MM-DD
  time: string;          // HH:MM 24-hour
  displayLabel: string;  // e.g. "Mon, 3 Jun · 2:00 PM"
  available: boolean;
}

export interface BookingRequest {
  meetingType: MeetingType;
  slotId: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeCompany?: string;
  notes?: string;
}

export interface BookingConfirmation {
  confirmationId: string;
  meetingType: MeetingType;
  slot: TimeSlot;
  attendeeName: string;
  attendeeEmail: string;
  attendeeCompany?: string;
  notes?: string;
  createdAt: string;
  calendarLink?: string;  // populated by real adapters
  meetingLink?: string;   // e.g. Zoom / Teams URL
}

// ─── Calendar Adapter Interface ───────────────────────────────────────────────

export interface CalendarAdapter {
  name: string;
  getAvailableSlots(meetingType: MeetingType, daysAhead?: number): Promise<TimeSlot[]>;
  bookSlot(request: BookingRequest): Promise<BookingConfirmation>;
  cancelBooking(confirmationId: string): Promise<void>;
}

// ─── Mock Adapter (default) ───────────────────────────────────────────────────

function generateMockSlots(daysAhead = 7): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const times = ['09:00', '10:30', '13:00', '14:30', '16:00'];
  const now = new Date();

  for (let d = 1; d <= daysAhead; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dateStr = date.toISOString().slice(0, 10);
    const dayLabel = date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    times.forEach((time, i) => {
      // Simulate some slots being taken
      const available = Math.random() > 0.3;
      const [h, m] = time.split(':').map(Number);
      const displayHour = h > 12 ? h - 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      slots.push({
        id: `slot_${dateStr}_${time.replace(':', '')}`,
        date: dateStr,
        time,
        displayLabel: `${dayLabel} · ${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`,
        available: available || i === 0, // always keep the first slot free
      });
    });
  }

  return slots;
}

const mockBookings: BookingConfirmation[] = [];

export const mockCalendarAdapter: CalendarAdapter = {
  name: 'Mock calendar',

  async getAvailableSlots(meetingType, daysAhead = 7) {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 300));
    return generateMockSlots(daysAhead).filter((s) => s.available);
  },

  async bookSlot(request) {
    await new Promise((r) => setTimeout(r, 400));
    const allSlots = generateMockSlots(7);
    const slot = allSlots.find((s) => s.id === request.slotId);
    if (!slot) throw new Error('Slot not found or no longer available');

    const confirmation: BookingConfirmation = {
      confirmationId: `ECHO-${Date.now().toString(36).toUpperCase()}`,
      meetingType: request.meetingType,
      slot,
      attendeeName: request.attendeeName,
      attendeeEmail: request.attendeeEmail,
      attendeeCompany: request.attendeeCompany,
      notes: request.notes,
      createdAt: new Date().toISOString(),
      meetingLink: 'https://meet.echosphere.ai/demo-placeholder',
    };

    mockBookings.push(confirmation);
    console.info('[Booking] Demo booked:', confirmation.confirmationId);
    return confirmation;
  },

  async cancelBooking(confirmationId) {
    await new Promise((r) => setTimeout(r, 200));
    const idx = mockBookings.findIndex((b) => b.confirmationId === confirmationId);
    if (idx !== -1) mockBookings.splice(idx, 1);
  },
};

// ─── Google Calendar stub ─────────────────────────────────────────────────────
// export const googleCalendarAdapter: CalendarAdapter = { name: 'Google Calendar', ... };
// Implement by proxying through /api/booking/google which uses GOOGLE_CALENDAR_CREDENTIALS

// ─── Active adapter ───────────────────────────────────────────────────────────

export const activeCalendarAdapter: CalendarAdapter = mockCalendarAdapter;

// ─── Service helpers ──────────────────────────────────────────────────────────

export async function getAvailableSlots(
  meetingType: MeetingType = 'product_demo',
  daysAhead = 7,
): Promise<TimeSlot[]> {
  return activeCalendarAdapter.getAvailableSlots(meetingType, daysAhead);
}

export async function bookDemo(
  request: BookingRequest,
): Promise<BookingConfirmation> {
  return activeCalendarAdapter.bookSlot(request);
}

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  product_demo: 'Product Demo',
  sales_call: 'Sales Call',
  technical_review: 'Technical Review',
};

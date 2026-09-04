/**
 * EchoSphere Phone Call Service
 *
 * Provides outbound PSTN calling through Agora's dial-out API.
 * The architecture is adapter-based: swap `activePhoneAdapter` to route
 * through a different carrier (Twilio, Vonage, etc.) without changing any
 * component code.
 *
 * Real PSTN calls must be initiated server-side (see app/api/dial-out/route.ts)
 * to keep Agora App Certificate off the browser.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type CallStatus =
  | 'idle'
  | 'dialing'
  | 'ringing'
  | 'connected'
  | 'on_hold'
  | 'ended'
  | 'failed'
  | 'missed';

export type CallDirection = 'outbound' | 'inbound';

export interface PhoneCallRecord {
  id: string;
  direction: CallDirection;
  phoneNumber: string;
  displayName?: string;
  status: CallStatus;
  startedAt: string;       // ISO timestamp when dial was initiated
  connectedAt?: string;    // ISO timestamp when the call was picked up
  endedAt?: string;        // ISO timestamp when the call ended
  durationSeconds?: number;
  channelName?: string;    // Agora RTC channel this call bridged into
  agentId?: string;        // Agora agent_id for the session
  notes?: string;
}

export interface DialOutRequest {
  phoneNumber: string;       // E.164 format e.g. +919876543210
  channelName: string;       // Agora channel to bridge the PSTN leg into
  agentUid: string;          // Agora UID of the AI agent in that channel
  displayName?: string;
}

export interface DialOutResponse {
  callId: string;
  status: CallStatus;
  message: string;
}

export interface EndCallRequest {
  callId: string;
  channelName: string;
}

// ─── Phone validation helpers ─────────────────────────────────────────────────

/** Normalise a raw phone input to E.164 format (best-effort). */
export function normalisePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    // Indian landline / mobile starting with 0 → assume +91
    return `+91${digits.slice(1)}`;
  }
  if (!raw.trim().startsWith('+')) {
    // No country code prefix — prepend +
    return `+${digits}`;
  }
  return `+${digits}`;
}

/** Returns true if the string looks like a valid E.164 number. */
export function isValidPhoneNumber(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

/** Pretty-format for display: +919876543210 → +91 98765 43210 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone.startsWith('+')) return phone;
  const country = phone.slice(0, phone.length > 12 ? 3 : 2);
  const rest = phone.slice(country.length);
  const chunks = rest.match(/.{1,5}/g) ?? [rest];
  return `${country} ${chunks.join(' ')}`;
}

/** Format seconds → mm:ss */
export function formatCallDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Call History (in-memory, localStorage-backed) ───────────────────────────

const HISTORY_KEY = 'echosphere_call_history';

export function loadCallHistory(): PhoneCallRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveCallToHistory(record: PhoneCallRecord): void {
  if (typeof window === 'undefined') return;
  const history = loadCallHistory();
  const idx = history.findIndex((r) => r.id === record.id);
  if (idx !== -1) {
    history[idx] = record;
  } else {
    history.unshift(record); // newest first
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

export function clearCallHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}

// ─── Active call singleton ────────────────────────────────────────────────────

let _activeCallId: string | null = null;
let _activeChannelName: string | null = null;

export function setActiveCall(callId: string, channelName: string): void {
  _activeCallId = callId;
  _activeChannelName = channelName;
}

export function clearActiveCall(): void {
  _activeCallId = null;
  _activeChannelName = null;
}

export function getActiveCallId(): string | null {
  return _activeCallId;
}

export function getActiveChannelName(): string | null {
  return _activeChannelName;
}

// ─── Client-side helpers (proxy through server routes) ───────────────────────

/**
 * Initiate an outbound PSTN call.
 * Proxies through /api/dial-out to keep credentials server-side.
 */
export async function dialOut(req: DialOutRequest): Promise<DialOutResponse> {
  const res = await fetch('/api/dial-out', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `Dial-out failed: ${res.status}`,
    );
  }

  return res.json() as Promise<DialOutResponse>;
}

/**
 * Hang up an active PSTN call.
 * Proxies through /api/end-call.
 */
export async function endPhoneCall(req: EndCallRequest): Promise<void> {
  const res = await fetch('/api/end-call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `End-call failed: ${res.status}`,
    );
  }
}

// ─── Status label helpers ─────────────────────────────────────────────────────

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  idle:      'Ready',
  dialing:   'Dialing…',
  ringing:   'Ringing…',
  connected: 'Connected',
  on_hold:   'On Hold',
  ended:     'Call Ended',
  failed:    'Call Failed',
  missed:    'Missed',
};

export const CALL_STATUS_COLORS: Record<CallStatus, string> = {
  idle:      'text-muted-foreground',
  dialing:   'text-amber-400',
  ringing:   'text-indigo-400',
  connected: 'text-emerald-400',
  on_hold:   'text-amber-400',
  ended:     'text-muted-foreground',
  failed:    'text-destructive',
  missed:    'text-destructive',
};

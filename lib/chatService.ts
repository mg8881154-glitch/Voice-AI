/**
 * EchoSphere Chat & Presence Service
 *
 * Wraps Agora RTM to provide:
 *   • 1-on-1 and channel messaging
 *   • Online / offline presence tracking
 *   • Typing indicators
 *   • Persistent message history (localStorage)
 *
 * All external RTM calls go through this service so the ChatPanel
 * component stays clean and the implementation can be swapped.
 */

export type PresenceStatus = 'online' | 'away' | 'offline';

export interface ChatUser {
  uid: string;
  name: string;
  status: PresenceStatus;
  lastSeen?: string;
}

export interface ChatMessage {
  id: string;
  channelOrPeer: string;
  senderUid: string;
  senderName: string;
  text: string;
  timestamp: number;
  read: boolean;
}

// ─── Message history (localStorage) ──────────────────────────────────────────

const HISTORY_KEY = 'echosphere_chat_history';

export function loadChatHistory(channelOrPeer: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const all: Record<string, ChatMessage[]> = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '{}');
    return all[channelOrPeer] ?? [];
  } catch { return []; }
}

export function saveChatMessage(msg: ChatMessage): void {
  if (typeof window === 'undefined') return;
  try {
    const all: Record<string, ChatMessage[]> = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '{}');
    if (!all[msg.channelOrPeer]) all[msg.channelOrPeer] = [];
    all[msg.channelOrPeer] = [...all[msg.channelOrPeer].slice(-99), msg];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
  } catch {}
}

// ─── Presence helpers ─────────────────────────────────────────────────────────

const PRESENCE_KEY = 'echosphere_presence';

export function savePresence(uid: string, status: PresenceStatus): void {
  if (typeof window === 'undefined') return;
  try {
    const all: Record<string, { status: PresenceStatus; lastSeen: string }> =
      JSON.parse(localStorage.getItem(PRESENCE_KEY) ?? '{}');
    all[uid] = { status, lastSeen: new Date().toISOString() };
    localStorage.setItem(PRESENCE_KEY, JSON.stringify(all));
  } catch {}
}

export function loadPresence(uid: string): PresenceStatus {
  if (typeof window === 'undefined') return 'offline';
  try {
    const all: Record<string, { status: PresenceStatus }> =
      JSON.parse(localStorage.getItem(PRESENCE_KEY) ?? '{}');
    return all[uid]?.status ?? 'offline';
  } catch { return 'offline'; }
}

// ─── Status badge colors ──────────────────────────────────────────────────────

export const PRESENCE_COLORS: Record<PresenceStatus, string> = {
  online:  'bg-emerald-400',
  away:    'bg-amber-400',
  offline: 'bg-muted-foreground/30',
};

export const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  online:  'Online',
  away:    'Away',
  offline: 'Offline',
};

// ─── Message type guard ───────────────────────────────────────────────────────

export interface RtmChatPayload {
  type: 'chat' | 'typing' | 'presence';
  senderName?: string;
  text?: string;
  status?: PresenceStatus;
}

export function parseRtmMessage(raw: string): RtmChatPayload | null {
  try {
    return JSON.parse(raw) as RtmChatPayload;
  } catch { return null; }
}

export function buildChatPayload(senderName: string, text: string): string {
  return JSON.stringify({ type: 'chat', senderName, text } satisfies RtmChatPayload);
}

export function buildTypingPayload(): string {
  return JSON.stringify({ type: 'typing' } satisfies RtmChatPayload);
}

export function buildPresencePayload(status: PresenceStatus): string {
  return JSON.stringify({ type: 'presence', status } satisfies RtmChatPayload);
}

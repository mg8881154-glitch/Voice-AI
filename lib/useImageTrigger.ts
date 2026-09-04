/**
 * useImageTrigger — v3
 *
 * Three-layer image triggering system:
 *
 * Layer 1 — USER REQUEST (highest priority, most reliable):
 *   Scans user turns for "show me X", "dikhao X", "image of X" etc.
 *   Does NOT depend on Nova emitting any tag → works even if LLM strips tags.
 *
 * Layer 2 — AGENT TAG (medium priority):
 *   Looks for [SHOW_IMAGE: query] in agent transcript turns.
 *   Works if LLM respects the format instruction.
 *
 * Layer 3 — STATIC KEYWORD (fallback):
 *   Scores completed agent text against imageKnowledge.ts product triggers.
 *
 * Auto-dismisses after 12 s. User can also dismiss manually.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getBestImageTrigger, type ImageTrigger } from './imageKnowledge';
import type { FetchImageResult } from '@/app/api/fetch-image/route';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DisplayImage =
  | { kind: 'static';  trigger: ImageTrigger }
  | { kind: 'dynamic'; result: FetchImageResult; query: string }
  | { kind: 'loading'; query: string };

type TranscriptItem = {
  uid:    string | number;
  text?:  string;
  status?: unknown;
};

// ─── Tag helpers ──────────────────────────────────────────────────────────────

const SHOW_IMAGE_RE = /\[SHOW_IMAGE:\s*([^\]]+)\]/i;

export function parseShowImageTag(text: string): string | null {
  const m = text.match(SHOW_IMAGE_RE);
  return m ? m[1].trim() : null;
}

export function stripShowImageTag(text: string): string {
  return text.replace(SHOW_IMAGE_RE, '').replace(/\s{2,}/g, ' ').trim();
}

// ─── User-request parser ──────────────────────────────────────────────────────
// Detects "show me a dog", "dog ki image dikhao", "can you show a cat" etc.

const USER_IMAGE_PATTERNS: RegExp[] = [
  /(?:show\s+(?:me\s+)?(?:a\s+|an\s+|the\s+)?|display\s+(?:a\s+|an\s+|the\s+)?)(.{2,40})(?:\s+image|\s+photo|\s+picture|$)/i,
  /(?:image|photo|picture)\s+(?:of\s+|for\s+)(.{2,40})/i,
  /(.{2,40})\s+(?:ki\s+image|ki\s+photo|dikhao|dikha\s*do|show\s+karo)/i,
  /(?:can\s+you\s+show|please\s+show)\s+(?:me\s+)?(?:a\s+|an\s+|the\s+)?(.{2,40})/i,
  /(?:mujhe|mujhko)\s+(.{2,40})\s+(?:dikhao|dikha)/i,
];

const STOP_WORDS = new Set([
  'me', 'the', 'a', 'an', 'some', 'your', 'our', 'their', 'this', 'that',
  'it', 'is', 'are', 'was', 'were', 'will', 'can', 'please', 'image', 'photo',
]);

function parseUserImageRequest(text: string): string | null {
  for (const re of USER_IMAGE_PATTERNS) {
    const m = text.match(re);
    if (!m) continue;
    const raw = m[1].trim().replace(/[?.!,]+$/, '').trim();
    if (raw.length < 2) continue;
    const words = raw.toLowerCase().split(/\s+/);
    // Filter out pure stop-word matches
    const meaningful = words.filter(w => !STOP_WORDS.has(w));
    if (meaningful.length === 0) continue;
    // Return cleaned query
    return raw;
  }
  return null;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function isCompleted(status: unknown): boolean {
  if (status == null) return false;
  const s = String(status).toLowerCase();
  // TurnStatus enum: 0=IN_PROGRESS, 1=END, 2=INTERRUPTED
  // Also handle string forms from normalizeTranscript
  return s === 'end' || s === 'interrupted' || s === '1' || s === '2';
}

function isInProgress(status: unknown): boolean {
  if (status == null) return false;
  const s = String(status).toLowerCase();
  return s === 'in_progress' || s === 'inprogress' || s === '0';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 15_000;

export function useImageTrigger(
  transcript: TranscriptItem[],
  agentUID: string,
): {
  currentImage: DisplayImage | null;
  dismissImage: () => void;
} {
  const [currentImage, setCurrentImage] = useState<DisplayImage | null>(null);

  const lastUserQueryRef    = useRef<string>('');
  const lastTagQueryRef     = useRef<string>('');
  const lastStaticTextRef   = useRef<string>('');
  const fetchingRef         = useRef<string>('');
  const timerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAutoDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCurrentImage(null), AUTO_DISMISS_MS);
  }, []);

  const dismissImage = useCallback(() => {
    setCurrentImage(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const fetchAndShow = useCallback((query: string, fallbackText?: string) => {
    if (query === fetchingRef.current) return;
    fetchingRef.current = query;

    setCurrentImage({ kind: 'loading', query });
    scheduleAutoDismiss();

    fetch(`/api/fetch-image?q=${encodeURIComponent(query)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<FetchImageResult>;
      })
      .then(result => {
        fetchingRef.current = '';
        setCurrentImage({ kind: 'dynamic', result, query });
        scheduleAutoDismiss();
      })
      .catch(err => {
        console.warn('[ImageTrigger] fetch-image failed:', err);
        fetchingRef.current = '';
        if (fallbackText) {
          const staticMatch = getBestImageTrigger(fallbackText);
          if (staticMatch) {
            setCurrentImage({ kind: 'static', trigger: staticMatch });
            scheduleAutoDismiss();
            return;
          }
        }
        setCurrentImage(null);
      });
  }, [scheduleAutoDismiss]);

  useEffect(() => {
    if (transcript.length === 0) return;

    // ── LAYER 1: Scan USER turns for image requests ───────────────────────────
    // This is the most reliable layer — does not depend on LLM formatting.
    const userItems = transcript.filter(item => {
      const uid = String(item.uid);
      const isUser = uid !== String(agentUID) && uid !== '123456';
      const hasText = typeof item.text === 'string' && item.text.trim().length > 0;
      const statusOk = isCompleted(item.status) || isInProgress(item.status);
      return isUser && hasText && statusOk;
    });

    // Check most recent user turns (last 3) for image requests
    const recentUserTurns = userItems.slice(-3).reverse();
    for (const item of recentUserTurns) {
      const text = item.text!.trim();
      const query = parseUserImageRequest(text);
      if (!query) continue;
      if (query === lastUserQueryRef.current) break; // already processed
      lastUserQueryRef.current = query;
      fetchAndShow(query);
      return; // user request takes priority — stop here
    }

    // ── LAYER 2: Scan AGENT turns for [SHOW_IMAGE: query] tag ─────────────────
    const agentItems = transcript.filter(item => {
      const uid = String(item.uid);
      const isAgent = uid === String(agentUID) || uid === '123456';
      const hasText = typeof item.text === 'string' && item.text.trim().length > 0;
      const statusOk = isCompleted(item.status) || isInProgress(item.status);
      return isAgent && hasText && statusOk;
    });

    for (let i = agentItems.length - 1; i >= 0; i--) {
      const rawText = agentItems[i].text!.trim();
      const query = parseShowImageTag(rawText);
      if (!query) continue;
      if (query === lastTagQueryRef.current) break;
      lastTagQueryRef.current = query;
      fetchAndShow(query, rawText);
      return;
    }

    // ── LAYER 3: Static keyword match on completed agent turns ─────────────────
    const completedAgent = agentItems.filter(item => isCompleted(item.status));
    if (completedAgent.length === 0) return;

    const latest  = completedAgent[completedAgent.length - 1];
    const rawText = (latest.text ?? '').trim();
    if (rawText === lastStaticTextRef.current) return;
    lastStaticTextRef.current = rawText;

    const staticMatch = getBestImageTrigger(rawText);
    if (!staticMatch) return;

    setCurrentImage({ kind: 'static', trigger: staticMatch });
    scheduleAutoDismiss();

  }, [transcript, agentUID, fetchAndShow, scheduleAutoDismiss]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { currentImage, dismissImage };
}

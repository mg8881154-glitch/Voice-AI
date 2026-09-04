/**
 * useLeadExtractor
 *
 * Watches the live transcript and automatically extracts lead data using
 * lightweight regex / keyword patterns — no extra LLM call needed.
 *
 * Every time the transcript array changes this hook scans all completed turns
 * (END + INTERRUPTED), merges any new findings into the LeadContext, and
 * recomputes the qualification status reactively.
 *
 * Architecture note: this runs purely on the client transcript string, so it
 * works offline and adds zero latency.  Replace the regex matchers with a
 * server-side NLP call if you need higher accuracy in production.
 */

import { useEffect, useRef } from 'react';
import { useLeadStore } from './LeadContext';
import { deriveQualificationStatus, type LeadInfo, type PurchaseTimeline } from './leadStore';

// ─── Types ────────────────────────────────────────────────────────────────────

// Deliberately loose — accepts both the toolkit's TranscriptHelperItem shape
// and the normalised transcript items produced by lib/conversation.ts.
// status is typed as unknown so it accepts TurnStatus enum values as well as strings.
type TranscriptItem = {
  uid: string | number;
  text?: string;
  status?: unknown;
};

// ─── Extractor patterns ───────────────────────────────────────────────────────

/**
 * Each extractor receives the full accumulated transcript text (all turns
 * concatenated, lowercased) and returns a partial LeadInfo or null.
 * They are cheap — no async, no network.
 */

function extractUserCount(text: string): number | undefined {
  // "120 users", "50 employees", "team of 30", "30 seats", "around 200 people"
  const patterns = [
    /\b(\d{1,4})\s*(?:users?|employees?|seats?|people|agents?|reps?|licenses?)\b/i,
    /\bteam\s+of\s+(\d{1,4})\b/i,
    /\baround\s+(\d{1,4})\b/i,
    /\babout\s+(\d{1,4})\s*(?:users?|employees?|seats?|people)?\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > 0 && n <= 100000) return n;
    }
  }
  return undefined;
}

function extractName(text: string): string | undefined {
  // "my name is John", "I'm Sarah", "this is Mike from Acme"
  const patterns = [
    /my name is ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/i,
    /i(?:'m| am) ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/i,
    /this is ([A-Z][a-z]+(?: [A-Z][a-z]+)?)\b/i,
    /call me ([A-Z][a-z]+(?: [A-Z][a-z]+)?)\b/i,
  ];
  const stopWords = new Set([
    'looking', 'interested', 'calling', 'writing', 'reaching',
    'contacting', 'following', 'hoping', 'trying', 'wondering',
    'not', 'also', 'just', 'here', 'from', 'with',
  ]);
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const name = m[1].trim();
      const first = name.split(' ')[0].toLowerCase();
      if (!stopWords.has(first) && name.length >= 2 && name.length <= 40) {
        return name;
      }
    }
  }
  return undefined;
}

function extractCompany(text: string): string | undefined {
  // "from Acme Corp", "at TechStart", "work for Microsoft", "our company is..."
  const patterns = [
    /(?:from|at|with|for|representing)\s+([A-Z][A-Za-z0-9 &.,']{1,40}?)(?:\s*[.,]|\s+and\b|\s+we\b|\s+our\b|$)/,
    /(?:company|org(?:anisation|anization)?|firm|business)\s+(?:is|called|named)\s+([A-Z][A-Za-z0-9 &.,']{1,40})/i,
    /i(?:'m| work| am working) (?:at|for|with)\s+([A-Z][A-Za-z0-9 &.,']{1,40})/i,
  ];
  const stopWords = new Set([
    'the', 'a', 'an', 'this', 'that', 'my', 'your', 'our', 'their',
    'here', 'there', 'now', 'today', 'looking', 'trying', 'calling',
  ]);
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const company = m[1].trim();
      const first = company.split(' ')[0].toLowerCase();
      if (!stopWords.has(first) && company.length >= 2 && company.length <= 50) {
        return company;
      }
    }
  }
  return undefined;
}

function extractBudget(text: string): string | undefined {
  // "$5000", "5k a month", "around $200 per user", "budget of 10k", "no budget", "tight budget"
  const patterns = [
    /\$\s*[\d,]+(?:k|K|m|M)?(?:\s*(?:per|\/)\s*\w+)?/,
    /[\d,]+\s*(?:k|K|m|M)\s*(?:dollars?|usd|per\s+\w+)?/i,
    /budget\s+(?:of\s+|around\s+|is\s+)?\$?[\d,]+(?:k|K)?/i,
    /(?:tight|limited|small|large|big|no)\s+budget/i,
    /(?:spend|spending|pay|paying)\s+(?:up\s+to\s+|around\s+|about\s+)?\$?[\d,]+(?:k|K)?/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[0].trim();
  }
  return undefined;
}

function extractTimeline(text: string): PurchaseTimeline | undefined {
  const lower = text.toLowerCase();
  if (/(?:right away|immediately|asap|this week|today|urgent|now)/.test(lower)) return 'immediate';
  if (/(?:next month|within a month|1[\s-]3 months?|one to three|couple of months)/.test(lower)) return '1-3 months';
  if (/(?:3[\s-]6 months?|three to six|quarter|q[1-4]\b|next quarter)/.test(lower)) return '3-6 months';
  if (/(?:6\+? months?|six months|next year|long.?term|eventually|no rush|not urgent)/.test(lower)) return '6+ months';
  return undefined;
}

function extractRequirement(text: string): string | undefined {
  const patterns = [
    /(?:need|want|looking for|require|trying to)\s+(?:to\s+)?(.{10,80}?)(?:\.|,|$)/i,
    /(?:use case|main\s+(?:goal|objective|purpose|need))\s+(?:is|would be)\s+(.{10,80}?)(?:\.|,|$)/i,
    /(?:help (?:us|me) with|solve|automate|improve)\s+(.{10,80}?)(?:\.|,|$)/i,
  ];
  const stop = new Set(['more', 'information', 'info', 'details', 'pricing', 'price', 'demo']);
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const req = m[1].trim();
      const firstWord = req.split(' ')[0].toLowerCase();
      if (!stop.has(firstWord) && req.length >= 8) return req;
    }
  }
  return undefined;
}

function extractPainPoint(text: string): string | undefined {
  const patterns = [
    /(?:problem|issue|challenge|pain point|struggle|frustrat(?:ed|ing)|annoying)\s+(?:is|with|about|that)?\s*(.{10,100}?)(?:\.|,|$)/i,
    /(?:currently|right now)\s+(?:we'?re?|I'?m)\s+(.{10,80}?)(?:\.|,|$)/i,
    /(?:not working|doesn'?t work|failing|too slow|too expensive|manual process)(.{0,60}?)(?:\.|,|$)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const pain = (m[1] ?? m[0]).trim();
      if (pain.length >= 8) return pain;
    }
  }
  return undefined;
}

function extractInterestedPlan(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/enterprise/.test(lower)) return 'enterprise';
  if (/business\s+plan/.test(lower)) return 'business';
  if (/starter\s+plan/.test(lower)) return 'starter';
  return undefined;
}

function extractDemoRequested(text: string): boolean {
  return /\b(?:demo|demonstration|trial|pilot|book|schedule|show me|see it in action|enterprise demo)\b/i.test(text);
}

function extractEscalation(text: string): boolean {
  return /\b(?:speak to|talk to|human|real person|actual person|someone else|manager|specialist|sales (?:rep|person|team))\b/i.test(text);
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useLeadExtractor(
  transcript: TranscriptItem[],
  localUID: string,
) {
  const { lead, updateLead } = useLeadStore();

  // Track which turn_ids we've already processed to avoid re-scanning
  const processedTexts = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (transcript.length === 0) return;

    // Only process completed turns (status END or INTERRUPTED) from the USER side.
    // Agent turns are excluded — we don't want Nova's own text to pollute the lead.
    const userTurns = transcript.filter((item) => {
      const isUser = String(item.uid) === String(localUID) || item.uid === 0 || item.uid === '0';
      const s = String(item.status ?? '').toLowerCase();
      const isCompleted =
        s === 'end' ||
        s === 'interrupted' ||
        s === '2' || // TurnStatus.END numeric value
        s === '3';   // TurnStatus.INTERRUPTED numeric value
      return isUser && isCompleted && item.text && item.text.trim().length > 0;
    });

    if (userTurns.length === 0) return;

    // Accumulate all user text into one string for pattern matching
    const allUserText = userTurns.map((t) => t.text ?? '').join(' ');

    // Only run extraction if something new was added
    const textKey = allUserText.slice(-200); // last 200 chars as fingerprint
    if (processedTexts.current.has(textKey)) return;
    processedTexts.current.add(textKey);

    // Build a patch with newly found fields
    const patch: Partial<LeadInfo> = {};

    // User count — always take the LATEST value (may change mid-call)
    // Scan individual turns in reverse order so the most recent mention wins
    const reversedUserTexts = [...userTurns].reverse().map((t) => t.text ?? '');
    for (const turnText of reversedUserTexts) {
      const count = extractUserCount(turnText);
      if (count !== undefined) {
        patch.userCount = count;
        break;
      }
    }

    if (!lead.name) {
      const name = extractName(allUserText);
      if (name) patch.name = name;
    }

    if (!lead.company) {
      const company = extractCompany(allUserText);
      if (company) patch.company = company;
    }

    if (!lead.budget) {
      const budget = extractBudget(allUserText);
      if (budget) patch.budget = budget;
    }

    if (!lead.purchaseTimeline) {
      const timeline = extractTimeline(allUserText);
      if (timeline) patch.purchaseTimeline = timeline;
    }

    if (!lead.requirement) {
      const req = extractRequirement(allUserText);
      if (req) patch.requirement = req;
    }

    if (!lead.painPoint) {
      const pain = extractPainPoint(allUserText);
      if (pain) patch.painPoint = pain;
    }

    if (!lead.interestedPlan) {
      const plan = extractInterestedPlan(allUserText);
      if (plan) patch.interestedPlan = plan;
    }

    if (!lead.demoRequested && extractDemoRequested(allUserText)) {
      patch.demoRequested = true;
    }

    if (!lead.escalated && extractEscalation(allUserText)) {
      patch.escalated = true;
    }

    // Only update if we actually found something new
    if (Object.keys(patch).length === 0) return;

    // Derive the new qualification status from the merged lead
    const merged = { ...lead, ...patch };
    const newStatus = deriveQualificationStatus(merged);
    if (newStatus !== lead.qualificationStatus) {
      patch.qualificationStatus = newStatus;
    }

    updateLead(patch);
  }, [transcript, localUID, lead, updateLead]);
}

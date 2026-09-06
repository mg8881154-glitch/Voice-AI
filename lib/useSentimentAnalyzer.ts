'use client';

import { useMemo } from 'react';
import type { TranscriptHelperItem, UserTranscription, AgentTranscription } from 'agora-agent-client-toolkit';

export type SentimentTone = 'positive' | 'neutral' | 'skeptical' | 'frustrated';

export interface SentimentAnalysis {
  tone: SentimentTone;
  score: number; // 0 to 100
  label: string;
  color: string;
  textColor: string;
  bgGlow: string;
  emoji: string;
  coachingTip: string;
  detectedKeywords: string[];
}

const POSITIVE_KEYWORDS = [
  'great', 'good', 'interested', 'demo', 'book', 'love', 'perfect', 'awesome', 'makes sense',
  'enterprise', 'pricing', 'buy', 'schedule', 'yes', 'ha', 'sahi', 'badhiya', 'accha', 'bilkul',
  'budget', 'ready', 'sign', 'agree', 'feature', 'help', 'team'
];

const SKEPTICAL_KEYWORDS = [
  'expensive', 'high', 'cost', 'competitor', 'drift', 'intercom', 'compare', 'not sure',
  'maybe', 'doubt', 'why', 'pricey', 'mehnga', 'soch', 'zyada', 'cheaper', 'alternative'
];

const FRUSTRATED_KEYWORDS = [
  'slow', 'bad', 'waste', 'frustrated', 'stop', 'human', 'specialist', 'agent',
  'complaint', 'broken', 'confused', 'kya bakwas', 'nahi', 'no', 'problem', 'hate'
];

export function analyzeTranscriptSentiment(
  messageList: TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>[]
): SentimentAnalysis {
  // Filter for user turns (or all turns if user isn't separated)
  const userTurns = messageList.filter(m => m.uid !== '123456'); // 123456 is default agent uid
  const recentTurnsText = userTurns
    .slice(-4)
    .map(m => ('text' in m ? String(m.text) : ''))
    .join(' ')
    .toLowerCase();

  if (!recentTurnsText || recentTurnsText.trim().length === 0) {
    return {
      tone: 'neutral',
      score: 65,
      label: 'Initial Rapport Building',
      color: 'bg-indigo-400',
      textColor: 'text-indigo-300',
      bgGlow: 'glow-indigo',
      emoji: '🤝',
      coachingTip: 'Prospect is listening — establish business problem and team size early.',
      detectedKeywords: [],
    };
  }

  const detectedPositives = POSITIVE_KEYWORDS.filter(k => recentTurnsText.includes(k));
  const detectedSkeptical = SKEPTICAL_KEYWORDS.filter(k => recentTurnsText.includes(k));
  const detectedFrustrated = FRUSTRATED_KEYWORDS.filter(k => recentTurnsText.includes(k));

  if (detectedFrustrated.length > 0) {
    return {
      tone: 'frustrated',
      score: 25,
      label: 'Friction / Escalation Requested',
      color: 'bg-rose-500',
      textColor: 'text-rose-400',
      bgGlow: 'glow-rose',
      emoji: '⚠️',
      coachingTip: 'Acknowledge frustration warmly, offer human sales specialist transfer immediately.',
      detectedKeywords: detectedFrustrated,
    };
  }

  if (detectedSkeptical.length > 0 && detectedSkeptical.length >= detectedPositives.length) {
    return {
      tone: 'skeptical',
      score: 48,
      label: 'Skeptical / Pricing Objection',
      color: 'bg-amber-400',
      textColor: 'text-amber-300',
      bgGlow: 'glow-amber',
      emoji: '🤔',
      coachingTip: 'Reframe around missed revenue & sub-500ms voice speed vs text-first competitors.',
      detectedKeywords: detectedSkeptical,
    };
  }

  if (detectedPositives.length > 0) {
    return {
      tone: 'positive',
      score: 88,
      label: 'High Buying Intent 🔥',
      color: 'bg-emerald-400',
      textColor: 'text-emerald-300',
      bgGlow: 'glow-emerald',
      emoji: '🎯',
      coachingTip: 'Interest validated! Lock in calendar booking for a 30-minute demonstration.',
      detectedKeywords: detectedPositives,
    };
  }

  return {
    tone: 'neutral',
    score: 68,
    label: 'Engaged & Inquiring',
    color: 'bg-blue-400',
    textColor: 'text-blue-300',
    bgGlow: 'glow-cyan',
    emoji: '💬',
    coachingTip: 'Answer question crisply with concrete metrics and ask for expected seat count.',
    detectedKeywords: [],
  };
}

export function useSentimentAnalyzer(
  messageList: TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>[]
): SentimentAnalysis {
  return useMemo(() => analyzeTranscriptSentiment(messageList), [messageList]);
}

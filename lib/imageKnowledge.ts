/**
 * EchoSphere Image Knowledge Base
 *
 * Maps conversation keywords / topics → images that the agent displays
 * alongside its voice response.
 *
 * Images use high-quality Unsplash URLs (no API key needed).
 * Replace any URL with your own hosted asset at any time — the interface
 * stays the same.
 *
 * Architecture:
 *  useImageTrigger (hook) scans every new agent transcript turn,
 *  scores it against IMAGE_TRIGGERS, picks the highest-scoring match,
 *  and surfaces an ImageTrigger object which AgentImageCard renders.
 */

export type ImageCategory =
  | 'pricing'
  | 'starter_plan'
  | 'business_plan'
  | 'enterprise_plan'
  | 'feature_voice'
  | 'feature_crm'
  | 'feature_analytics'
  | 'feature_security'
  | 'feature_booking'
  | 'competitor'
  | 'demo'
  | 'escalation'
  | 'team'
  | 'roi'
  | 'onboarding';

export interface ImageTrigger {
  id: string;
  category: ImageCategory;
  title: string;
  description: string;
  imageUrl: string;
  /** Low-res placeholder shown while full image loads */
  thumbUrl: string;
  /** Keywords that activate this trigger (checked against agent speech) */
  keywords: string[];
  /** Higher = shown first when multiple match */
  priority: number;
}

// ─── Trigger definitions ──────────────────────────────────────────────────────

export const IMAGE_TRIGGERS: ImageTrigger[] = [
  // ── Plans ──────────────────────────────────────────────────────────────────
  {
    id: 'starter_plan',
    category: 'starter_plan',
    title: 'Starter Plan',
    description: 'Perfect for small teams of 1–10 · $49/month · 500 AI voice minutes',
    imageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=40&q=20',
    keywords: ['starter', 'starter plan', 'small team', 'small business', '10 users', '10 seats'],
    priority: 8,
  },
  {
    id: 'business_plan',
    category: 'business_plan',
    title: 'Business Plan',
    description: 'Best for growing teams · Up to 100 seats · $199/month · Full CRM integration',
    imageUrl:
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=40&q=20',
    keywords: [
      'business plan', 'business', '50 users', '50 seats', '100 users', '100 seats',
      'growing team', 'sales team', 'mid-size',
    ],
    priority: 9,
  },
  {
    id: 'enterprise_plan',
    category: 'enterprise_plan',
    title: 'Enterprise Plan',
    description: 'Unlimited seats · Custom LLM · Dedicated success manager · SOC 2 Type II',
    imageUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=40&q=20',
    keywords: [
      'enterprise', 'enterprise plan', '120 users', '200 users', '500 users',
      'large team', 'unlimited seats', 'custom pricing', 'enterprise demo',
    ],
    priority: 10,
  },

  // ── Pricing general ─────────────────────────────────────────────────────────
  {
    id: 'pricing',
    category: 'pricing',
    title: 'EchoSphere Pricing',
    description: 'Starter $49 · Business $199 · Enterprise custom · Annual discount available',
    imageUrl:
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=40&q=20',
    keywords: [
      'price', 'pricing', 'cost', 'how much', 'per month', 'per year',
      'annual', 'monthly', 'budget', 'affordable',
    ],
    priority: 6,
  },

  // ── Features ────────────────────────────────────────────────────────────────
  {
    id: 'feature_voice',
    category: 'feature_voice',
    title: 'Real-Time Voice AI',
    description: 'Sub-500ms latency · Natural turn-taking · Interruption handling · 10+ languages',
    imageUrl:
      'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=40&q=20',
    keywords: [
      'voice', 'voice ai', 'real-time', 'latency', 'interruption',
      'turn taking', 'natural conversation', 'speak', 'audio',
    ],
    priority: 7,
  },
  {
    id: 'feature_crm',
    category: 'feature_crm',
    title: 'CRM Integration',
    description: 'Native connectors for Salesforce, HubSpot, Pipedrive · Auto lead capture',
    imageUrl:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=40&q=20',
    keywords: [
      'crm', 'salesforce', 'hubspot', 'pipedrive', 'integration',
      'lead capture', 'lead management', 'contact', 'pipeline',
    ],
    priority: 7,
  },
  {
    id: 'feature_analytics',
    category: 'feature_analytics',
    title: 'Real-Time Analytics',
    description: 'Live call metrics · Lead scoring · Conversion tracking · Team dashboard',
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=40&q=20',
    keywords: [
      'analytics', 'metrics', 'dashboard', 'reporting', 'data',
      'insights', 'tracking', 'performance', 'conversion',
    ],
    priority: 7,
  },
  {
    id: 'feature_security',
    category: 'feature_security',
    title: 'Enterprise Security',
    description: 'SOC 2 Type II · AES-256 encryption · TLS 1.3 · GDPR & CCPA compliant',
    imageUrl:
      'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=40&q=20',
    keywords: [
      'security', 'secure', 'soc 2', 'gdpr', 'ccpa', 'compliance',
      'encryption', 'safe', 'trust', 'privacy', 'data protection', 'on-premise',
    ],
    priority: 8,
  },
  {
    id: 'feature_booking',
    category: 'feature_booking',
    title: 'Meeting & Demo Booking',
    description: 'AI detects buying intent and books meetings directly in the conversation',
    imageUrl:
      'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=40&q=20',
    keywords: [
      'book', 'booking', 'schedule', 'meeting', 'demo', 'calendar',
      'appointment', 'slot', 'availability', 'free time',
    ],
    priority: 8,
  },

  // ── Competitor ──────────────────────────────────────────────────────────────
  {
    id: 'competitor',
    category: 'competitor',
    title: 'EchoSphere vs Competitors',
    description: 'Voice-first · Faster · More affordable · No per-conversation overage fees',
    imageUrl:
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=40&q=20',
    keywords: [
      'competitor', 'competition', 'compare', 'versus', 'vs',
      'drift', 'intercom', 'salesloft', 'cheaper', 'alternative',
      'other option', 'different product',
    ],
    priority: 9,
  },

  // ── ROI / Value ──────────────────────────────────────────────────────────────
  {
    id: 'roi',
    category: 'roi',
    title: 'ROI with EchoSphere',
    description: 'Avg. 3x more leads captured · Payback in under 30 days for most customers',
    imageUrl:
      'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?w=40&q=20',
    keywords: [
      'roi', 'return', 'value', 'worth it', 'justify', 'expensive',
      'too much', 'after-hours', 'missed leads', 'payback',
    ],
    priority: 7,
  },

  // ── Demo / Escalation ───────────────────────────────────────────────────────
  {
    id: 'demo',
    category: 'demo',
    title: 'Book a Personalised Demo',
    description: '30-min session · Custom LLM setup · Live call analytics · No commitment',
    imageUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=40&q=20',
    keywords: [
      'demo', 'demonstration', 'show me', 'see it', 'walkthrough',
      'trial', 'pilot', 'test drive', 'enterprise demo',
    ],
    priority: 10,
  },
  {
    id: 'escalation',
    category: 'escalation',
    title: 'Talk to a Human Specialist',
    description: 'Our enterprise team is available Mon–Fri 9am–6pm · Avg response < 5 min',
    imageUrl:
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=40&q=20',
    keywords: [
      'human', 'speak to', 'talk to', 'real person', 'specialist',
      'sales rep', 'account manager', 'escalate',
    ],
    priority: 9,
  },
  {
    id: 'team',
    category: 'team',
    title: 'EchoSphere Team',
    description: 'Backed by sales experts and AI engineers dedicated to your success',
    imageUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=40&q=20',
    keywords: ['team', 'company', 'who are you', 'about', 'founded', 'support'],
    priority: 5,
  },
  {
    id: 'onboarding',
    category: 'onboarding',
    title: 'Get Started in Minutes',
    description: 'Sign up → connect credentials → embed widget → go live in under 15 minutes',
    imageUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
    thumbUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=40&q=20',
    keywords: [
      'get started', 'setup', 'install', 'integrate', 'how to',
      'onboard', 'quickstart', 'begin', 'start using',
    ],
    priority: 6,
  },
];

// ─── Scoring helper ───────────────────────────────────────────────────────────

/**
 * Score a piece of text against a trigger's keywords.
 * Returns the number of keyword matches found (case-insensitive).
 */
export function scoreTrigger(text: string, trigger: ImageTrigger): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of trigger.keywords) {
    if (lower.includes(kw.toLowerCase())) {
      // Exact phrase match scores higher than partial
      score += kw.includes(' ') ? 3 : 1;
    }
  }
  return score;
}

/**
 * Given a piece of agent speech, return the best-matching ImageTrigger
 * or null if nothing relevant was found.
 */
export function getBestImageTrigger(agentText: string): ImageTrigger | null {
  if (!agentText || agentText.trim().length < 5) return null;

  let best: ImageTrigger | null = null;
  let bestScore = 0;

  for (const trigger of IMAGE_TRIGGERS) {
    const raw = scoreTrigger(agentText, trigger);
    if (raw === 0) continue;
    // Combine keyword score with priority weight
    const weighted = raw * 2 + trigger.priority;
    if (weighted > bestScore) {
      bestScore = weighted;
      best = trigger;
    }
  }

  // Require a minimum score to avoid spurious matches
  return bestScore >= 4 ? best : null;
}

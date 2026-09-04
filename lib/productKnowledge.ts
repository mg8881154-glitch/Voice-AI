/**
 * EchoSphere Product Knowledge Base
 *
 * This file is the single source of truth for product information used by the
 * AI sales agent.  It is intentionally kept separate from UI components so it
 * can be swapped out for a real database / RAG retrieval layer later without
 * touching any component code.
 */

export type Plan = {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  userRange: string;
  features: string[];
  bestFor: string;
  highlighted?: boolean;
};

export type FAQ = {
  question: string;
  answer: string;
};

export type CompetitorComparison = {
  competitor: string;
  ourAdvantage: string[];
  theirAdvantage: string[];
};

export const PRODUCT = {
  name: 'EchoSphere',
  tagline: 'Real-Time Voice AI Sales Agent',
  description:
    'An enterprise-grade AI voice agent platform that engages leads, qualifies prospects, and books meetings — 24 × 7 without human intervention.',
};

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 49,
    annualPrice: 39,
    userRange: '1–10 seats',
    bestFor: 'Small teams and early-stage startups',
    features: [
      'Up to 10 agent seats',
      '500 AI voice minutes / month',
      'Basic lead qualification',
      'Email notifications',
      'Standard support (email)',
      '1 custom product persona',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 199,
    annualPrice: 159,
    userRange: '11–100 seats',
    bestFor: 'Growing sales teams needing automation',
    highlighted: true,
    features: [
      'Up to 100 agent seats',
      '5 000 AI voice minutes / month',
      'Full lead qualification & scoring',
      'CRM integrations (Salesforce, HubSpot)',
      'Meeting / demo booking',
      'Real-time transcript & analytics',
      'Priority support (chat + email)',
      '5 custom product personas',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 0, // custom pricing
    annualPrice: 0,
    userRange: '100+ seats',
    bestFor: 'Large organisations with custom requirements',
    features: [
      'Unlimited agent seats',
      'Unlimited AI voice minutes',
      'Custom LLM / STT / TTS integration',
      'Dedicated infrastructure & SLA 99.99%',
      'Advanced analytics & BI export',
      'Custom CRM & ERP connectors',
      'SOC 2 Type II & GDPR compliance',
      'Dedicated customer success manager',
      'On-premise deployment option',
    ],
  },
];

export const FAQS: FAQ[] = [
  {
    question: 'How quickly can I get started?',
    answer:
      'You can go live in under 15 minutes.  Sign up, connect your Agora credentials, configure your product persona, and embed the widget in your site.',
  },
  {
    question: 'Does the AI remember what was said earlier in the call?',
    answer:
      'Yes.  EchoSphere maintains full conversation context for the entire session.  The agent never re-asks a question the customer has already answered.',
  },
  {
    question: 'Can I customise what the agent says?',
    answer:
      'Absolutely.  Every plan includes a custom product persona editor where you can define tone, objection-handling scripts, pricing overrides, and product FAQs.',
  },
  {
    question: 'What languages does EchoSphere support?',
    answer:
      'English is supported out of the box on all plans.  Spanish, French, German, Japanese, and Portuguese are available on Business and Enterprise.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'All audio and transcript data is encrypted in transit (TLS 1.3) and at rest (AES-256).  Enterprise customers can request on-premise or private-cloud deployment.  We are SOC 2 Type II certified.',
  },
  {
    question: 'Can the agent book meetings on my calendar?',
    answer:
      'Yes.  The Business and Enterprise plans include native integrations with Google Calendar and Outlook.  The agent detects buying intent and offers slots in real time.',
  },
  {
    question: 'What CRMs do you integrate with?',
    answer:
      'We natively support Salesforce, HubSpot, Pipedrive, and Zoho.  Custom CRM connectors are available on Enterprise via our REST API.',
  },
];

export const COMPETITOR_COMPARISONS: CompetitorComparison[] = [
  {
    competitor: 'Drift / Salesloft',
    ourAdvantage: [
      'Real-time voice (not just chat)',
      'Sub-500ms latency via Agora SD-RTN',
      'No per-conversation overage fees on Business plan',
      'Open API for custom LLM / voice providers',
    ],
    theirAdvantage: [
      'Larger ecosystem of third-party plugins',
      'More established brand recognition',
    ],
  },
  {
    competitor: 'Intercom',
    ourAdvantage: [
      'Voice-first — not bolted onto a chat product',
      'Significantly lower cost for high-volume voice',
      'Outbound calling capability on Enterprise',
    ],
    theirAdvantage: [
      'Broader customer support feature set',
      'Larger community and marketplace',
    ],
  },
  {
    competitor: 'Custom in-house solution',
    ourAdvantage: [
      'Deploy in minutes, not months',
      'No ML / infra team required',
      'Continuously updated models included',
      'Predictable SaaS pricing vs engineering cost',
    ],
    theirAdvantage: [
      'Full control over every detail',
      'No vendor dependency',
    ],
  },
];

export const SECURITY_INFO = {
  encryption: 'TLS 1.3 in transit, AES-256 at rest',
  dataResidency: 'US (default), EU and APAC available on Enterprise',
  compliance: ['SOC 2 Type II', 'GDPR', 'CCPA'],
  dataRetention: 'Transcripts retained 90 days by default; configurable per plan',
  penetrationTesting: 'Annual third-party pen test; results available under NDA',
};

/**
 * Returns a plain-text product brief suitable for injection into an LLM system prompt.
 * Keep it concise — voice LLMs work best with focused, structured context.
 */
export function getProductBriefForPrompt(): string {
  const planSummary = PLANS.map((p) => {
    const price =
      p.monthlyPrice === 0
        ? 'Custom pricing'
        : `$${p.monthlyPrice}/mo (or $${p.annualPrice}/mo billed annually)`;
    return `  • ${p.name} (${p.userRange}): ${price} — ${p.bestFor}`;
  }).join('\n');

  return `
## EchoSphere Product Overview
EchoSphere is a real-time AI voice sales agent platform.  Key value: engage leads, qualify prospects, and book meetings automatically — 24/7.

## Plans & Pricing
${planSummary}

## Top Features (Business plan)
- Full lead qualification & scoring
- CRM integrations: Salesforce, HubSpot, Pipedrive
- Meeting / demo booking (Google Calendar & Outlook)
- Real-time transcript & analytics
- Custom product personas and objection-handling scripts

## Security
- Encryption: TLS 1.3 in transit, AES-256 at rest
- Compliance: SOC 2 Type II, GDPR, CCPA
- Enterprise: on-premise and private-cloud deployment available

## Competitor Positioning
- vs Drift/Salesloft: EchoSphere is voice-first with lower per-minute cost
- vs Intercom: dedicated voice AI, not a chat add-on
- vs in-house build: go live in minutes, not months, at a fraction of the cost
`.trim();
}

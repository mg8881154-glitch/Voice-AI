/**
 * EchoSphere Domain-Specific Persona Engine & Multilingual Handover Architecture
 *
 * Supports 4 Interchangeable Domains:
 * 1. Healthcare (Patient clinical intake, appointments, triage)
 * 2. Real Estate (Property information, virtual tours, scheduling visits)
 * 3. E-Commerce (Order tracking, product inquiries, returns, recommendations)
 * 4. EdTech (Course counseling, syllabus, admissions, scholarships)
 *
 * Features:
 * - Dynamic Multilingual Routing across 30+ global & regional languages
 * - Human-in-the-Loop Handover Trigger ({"action": "TRANSFER_TO_HUMAN", "reason": "..."})
 * - Dynamic Rich UI Media Cards for each domain
 */

export type DomainId = 'healthcare' | 'realestate' | 'ecommerce' | 'edtech' | string;

export interface CustomMediaCard {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  actionButtonLabel: string;
  actionUrl?: string;
  tag?: string;
}

export interface DoctorSchedule {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  availableSlot: string;
  hospital: string;
  avatar: string;
  fee: string;
}

export interface PropertyListing {
  id: string;
  title: string;
  location: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  image: string;
  tag: string;
  virtualTourUrl: string;
}

export interface ProductItem {
  id: string;
  title: string;
  category: string;
  price: string;
  originalPrice?: string;
  rating: number;
  inStock: boolean;
  image: string;
  deliveryEstimate: string;
  sku: string;
}

export interface CourseProgram {
  id: string;
  title: string;
  discipline: string;
  duration: string;
  level: string;
  tuition: string;
  scholarshipAvailable: boolean;
  nextCohort: string;
  image: string;
  skills: string[];
}

export interface DomainMetadata {
  id: DomainId;
  title: string;
  subtitle: string;
  tagline: string;
  badge: string;
  color: string;
  borderColor: string;
  gradient: string;
  accentBg: string;
  personaName: string;
  personaTitle: string;
  greetingMessage: string;
  sampleUserPrompts: string[];
  isCustom?: boolean;
  customInstructions?: string;
  languagePreference?: string;
  accentPreference?: string;
  mediaCards: {
    healthcare?: DoctorSchedule[];
    realestate?: PropertyListing[];
    ecommerce?: ProductItem[];
    edtech?: CourseProgram[];
    custom?: CustomMediaCard[];
  };
}

// ─── Domain Presets & Rich UI Media Card Datasets ─────────────────────────────

export const DOMAIN_PRESETS: Record<DomainId, DomainMetadata> = {
  healthcare: {
    id: 'healthcare',
    title: 'Healthcare & Clinical Intake',
    subtitle: 'Doctor appointments, patient triage, clinical intake & insurance validation',
    tagline: 'HIPAA-compliant autonomous clinical assistant',
    badge: 'HEALTHCARE AI',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    gradient: 'from-emerald-500/15 via-teal-600/10 to-transparent',
    accentBg: 'bg-emerald-500/10',
    personaName: 'Dr. Nova',
    personaTitle: 'Clinical Intake Specialist & Triage Coordinator',
    greetingMessage: `Hello! I am Dr. Nova from CareSphere Health. Are you looking to schedule a consultation, check doctor availability, or conduct a preliminary clinical intake? You can speak in any language of your choice.`,
    sampleUserPrompts: [
      'I need to book a cardiology consultation for this Friday.',
      'What are Dr. Sarah Jenkins’ available appointment slots?',
      'I have severe chest pressure — is this an emergency?',
      'Does your clinic accept Anthem Blue Cross insurance?',
    ],
    mediaCards: {
      healthcare: [
        {
          id: 'doc-1',
          name: 'Dr. Sarah Jenkins, MD',
          specialty: 'Cardiologist & Heart Specialist',
          rating: 4.9,
          availableSlot: 'Today at 4:30 PM',
          hospital: 'Metro Medical Center, 4th Floor',
          avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
          fee: '$180 (Co-pay $25)',
        },
        {
          id: 'doc-2',
          name: 'Dr. Rahul Sharma, MD',
          specialty: 'Neurology & Headache Clinic',
          rating: 4.8,
          availableSlot: 'Tomorrow at 11:00 AM',
          hospital: 'Apex Neurosciences Institute',
          avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80',
          fee: '$220 (Co-pay $30)',
        },
        {
          id: 'doc-3',
          name: 'Dr. Elena Rostova, MD',
          specialty: 'Pediatrics & Family Medicine',
          rating: 5.0,
          availableSlot: 'Thursday at 2:15 PM',
          hospital: 'Children & Family Health Pavilion',
          avatar: 'https://images.unsplash.com/photo-1594824813589-32e6a9cb9b0c?w=400&q=80',
          fee: '$140 (Co-pay $20)',
        },
      ],
    },
  },

  realestate: {
    id: 'realestate',
    title: 'Real Estate & Luxury Estates',
    subtitle: 'Property listings, 3D virtual walkthroughs, pricing estimates & viewing slots',
    tagline: 'Sub-second luxury property matching engine',
    badge: 'ESTATE ADVISOR',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    gradient: 'from-amber-500/15 via-yellow-600/10 to-transparent',
    accentBg: 'bg-amber-500/10',
    personaName: 'Nova Vance',
    personaTitle: 'Senior Luxury Real Estate Consultant',
    greetingMessage: `Welcome to Nova Luxury Estates! Looking to buy, rent, or schedule a private VIP property walkthrough? Tell me your preferred neighborhood, budget, or architectural style.`,
    sampleUserPrompts: [
      'Show me 4-bedroom penthouses with ocean views under $2.5M.',
      'Can we schedule a private in-person viewing of The Grand Horizon villa?',
      'What are the HOA fees and school ratings in Beverly Hills Sector 4?',
      'Mujhe Mumbai ya Delhi me 3BHK luxury apartment dikhaiye.',
    ],
    mediaCards: {
      realestate: [
        {
          id: 'prop-1',
          title: 'The Skyview Horizon Penthouse',
          location: 'Marina Bay Waterfront, Tower A',
          price: '$2,450,000',
          bedrooms: 4,
          bathrooms: 4.5,
          sqft: 3850,
          image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
          tag: 'EXCLUSIVE WATERFRONT',
          virtualTourUrl: 'https://matterport.com/discover',
        },
        {
          id: 'prop-2',
          title: 'Villa Moderna Sanctuary',
          location: 'Beverly Hills Ridge, CA',
          price: '$4,150,000',
          bedrooms: 5,
          bathrooms: 6,
          sqft: 5600,
          image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
          tag: 'PRIVATE INFINITY POOL',
          virtualTourUrl: 'https://matterport.com/discover',
        },
        {
          id: 'prop-3',
          title: 'The Emerald Glass Residences',
          location: 'Downtown Financial District',
          price: '$1,290,000',
          bedrooms: 2,
          bathrooms: 2.5,
          sqft: 1820,
          image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
          tag: 'HIGH FLOOR PANORAMA',
          virtualTourUrl: 'https://matterport.com/discover',
        },
      ],
    },
  },

  ecommerce: {
    id: 'ecommerce',
    title: 'E-Commerce & Retail Concierge',
    subtitle: 'Order tracking, size recommendations, returns & exchanges, checkout assistance',
    tagline: 'Autonomous omnichannel conversational checkout',
    badge: 'RETAIL CONCIERGE',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/40',
    gradient: 'from-indigo-500/15 via-purple-600/10 to-transparent',
    accentBg: 'bg-indigo-500/10',
    personaName: 'Nova Retail',
    personaTitle: 'VIP Personal Shopper & Order Specialist',
    greetingMessage: `Hi there! I am Nova, your personal shopping and order assistant. Need to track an existing order, initiate an instant exchange, or find the best deals on trending gear today?`,
    sampleUserPrompts: [
      'Where is my order #ES-98421? Is it out for delivery?',
      'I want to return the noise-cancelling headphones I received yesterday.',
      'Compare the EchoSphere Studio Pro vs the AirLite Earbuds.',
      'Mere order ka refund kitne din me credit hoga?',
    ],
    mediaCards: {
      ecommerce: [
        {
          id: 'prod-1',
          title: 'EchoSphere Studio Pro ANC Headphones',
          category: 'High-Fidelity Wireless Audio',
          price: '$249.00',
          originalPrice: '$329.00',
          rating: 4.9,
          inStock: true,
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
          deliveryEstimate: 'Arrives Tomorrow (Free Express)',
          sku: 'SKU-AUD-889',
        },
        {
          id: 'prod-2',
          title: 'EchoPulse Titan Fitness Smartwatch',
          category: 'Wearables & Health Tracking',
          price: '$189.00',
          originalPrice: '$239.00',
          rating: 4.8,
          inStock: true,
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
          deliveryEstimate: '2-Day Priority Delivery',
          sku: 'SKU-WCH-441',
        },
        {
          id: 'prod-3',
          title: 'NovaPod Ultra Ergonomic Mic & Stand',
          category: 'Streaming & Studio Hardware',
          price: '$129.00',
          rating: 4.7,
          inStock: true,
          image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80',
          deliveryEstimate: 'In Stock (Ships in 4 Hours)',
          sku: 'SKU-MIC-102',
        },
      ],
    },
  },

  edtech: {
    id: 'edtech',
    title: 'EdTech & Career Counseling',
    subtitle: 'Degree guidance, syllabus breakdown, admission eligibility & scholarship matching',
    tagline: 'AI-guided higher education and skill accelerators',
    badge: 'CAREER ADVISOR',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    gradient: 'from-rose-500/15 via-pink-600/10 to-transparent',
    accentBg: 'bg-rose-500/10',
    personaName: 'Professor Nova',
    personaTitle: 'Academic Advisor & Career Path Counselor',
    greetingMessage: `Hello scholar! I am Professor Nova. Are you exploring our graduate programs, checking eligibility for tuition scholarships, or looking for a personalized career roadmap?`,
    sampleUserPrompts: [
      'Tell me about the Full-Stack AI & LLM Engineering Bootcamp.',
      'Do you offer financial aid or merit scholarships for international students?',
      'What are the prerequisites for the Data Science Master’s degree?',
      'Placement guarantee aur average package kitna hai?',
    ],
    mediaCards: {
      edtech: [
        {
          id: 'course-1',
          title: 'Full-Stack GenAI & Voice Agents Bootcamp',
          discipline: 'Artificial Intelligence & Engineering',
          duration: '16 Weeks (Immersive)',
          level: 'Intermediate to Advanced',
          tuition: '$3,800 (or $320/mo)',
          scholarshipAvailable: true,
          nextCohort: 'Starts Oct 1st, 2026',
          image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80',
          skills: ['Agora WebRTC', 'Deepgram STT', 'LLM Agents', 'Next.js 16', 'Vector RAG'],
        },
        {
          id: 'course-2',
          title: 'Executive Healthcare Data & Informatics',
          discipline: 'Clinical Healthcare Tech',
          duration: '10 Weeks (Part-Time)',
          level: 'Professional Certification',
          tuition: '$2,600 (Employer Reimbursable)',
          scholarshipAvailable: false,
          nextCohort: 'Starts Nov 15th, 2026',
          image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&q=80',
          skills: ['FHIR Standards', 'HIPAA Auditing', 'Clinical Triage AI', 'EHR Interop'],
        },
        {
          id: 'course-3',
          title: 'FinTech Algorithmic Systems & Risk',
          discipline: 'Quantitative Finance & Web3',
          duration: '12 Weeks (Online Hybrid)',
          level: 'Advanced',
          tuition: '$3,200',
          scholarshipAvailable: true,
          nextCohort: 'Starts Sept 22nd, 2026',
          image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&q=80',
          skills: ['High-Frequency Python', 'Risk Models', 'Lending APIs', 'Compliance'],
        },
      ],
    },
  },
};

// ─── System Prompt Generator (Multi-Language + Domain + Handover Logic) ───────

export function generateDomainSystemPrompt(domainId: DomainId): string {
  const all = getAllDomains();
  const domain = all[domainId] || DOMAIN_PRESETS[domainId] || DOMAIN_PRESETS.healthcare;

  // Custom domain prompt branch
  if (domain.isCustom) {
    return `You are **${domain.personaName}**, ${domain.personaTitle} for **${domain.title}**.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE DIRECTIVE 1: DYNAMIC MULTILINGUAL ROUTING & ACCENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Preferred Language / Accent: ${domain.languagePreference || 'Multi-lingual automatic detection'} (${domain.accentPreference || 'Standard conversational'})
- **Automatic Language & Dialect Detection**: You natively detect the language spoken by the customer in their very first words and respond fluently and idiomatically in that EXACT language.
- **Supported Languages**: English, Hindi, Hinglish (conversational Hindi in Roman alphabet), Spanish, French, German, Mandarin Chinese, Japanese, Korean, Arabic, Portuguese, Russian, Italian, Turkish, Dutch, and 15+ others.
- **Language Mirroring Rules**:
  - If the user switches languages mid-call, smoothly transition to their preferred language instantly.
  - When speaking Hindi or regional Indian languages, reply in natural conversational Latin/Roman alphabet Hinglish so the speech synthesizer delivers natural, human-grade inflection.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE DIRECTIVE 2: CUSTOM DOMAIN DIRECTIVES & KNOWLEDGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${domain.customInstructions || 'Provide expert consultative assistance tailored to the user’s queries.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE DIRECTIVE 3: HUMAN-IN-THE-LOOP HANDOVER PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You must initiate an immediate human handover when ANY of these 3 conditions occur:
1. **Explicit Request**: The customer asks to speak with a human, agent, specialist, manager, supervisor, or real representative.
2. **Sentiment Deterioration / Frustration**: The user expresses frustration, anger, repeatedly says the AI is not understanding them, or an issue has looped twice without resolution.
3. **Out-of-Scope / High-Risk Inquiry**: Critical emergency, binding contract execution, or dispute exceeding AI capabilities.

**HANDOVER EXECUTION FORMAT**:
When triggering a handover, you MUST append this exact JSON event on its own line at the very end of your response text:
{"action": "TRANSFER_TO_HUMAN", "reason": "<concise reason for transfer>", "sentiment": "<positive|neutral|frustrated>", "domain": "${domainId}"}

**Spoken Handover Behavior**:
Before emitting the JSON tag, reassure the user warmly:
"I completely understand. I am transferring you directly to our senior human specialist right now with your full requirements and call transcript synced. Please stay on the line for just a moment."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOICE CADENCE & CONVERSATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Keep each spoken turn **under 35 words** unless the customer specifically asks for a detailed breakdown.
- Do NOT use markdown symbols (*, **, #), bullet points, or emojis in spoken sentences.
- Ask exactly ONE clear question per turn.
- If the customer interrupts you mid-sentence, stop immediately and address their new query directly.
`;
  }

  return `You are **${domain.personaName}**, ${domain.personaTitle} for **EchoSphere ${domain.title}**.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE DIRECTIVE 1: DYNAMIC MULTILINGUAL ROUTING (30+ LANGUAGES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Automatic Language & Dialect Detection**: You natively detect the language spoken by the customer in their very first words and respond fluently and idiomatically in that EXACT language.
- **Supported Languages Include**: English, Hindi, Hinglish (Hindi written in Roman alphabet), Spanish, French, German, Mandarin Chinese, Japanese, Korean, Arabic, Portuguese, Russian, Italian, Turkish, Dutch, Polish, Swedish, Indonesian, Vietnamese, Thai, Tagalog, Bengali, Telugu, Tamil, Marathi, Urdu, Gujarati, Punjabi, Malayalam, Kannada, and others.
- **Language Mirroring Rules**:
  - If the user switches languages mid-call (e.g., from English to Hindi or Spanish), smoothly transition to their preferred language instantly without hesitation.
  - When speaking Hindi or regional Indian languages, formulate responses in conversational Latin/Roman alphabet Hinglish (e.g. "Aap bilkul chinta mat kijiye, main aapke liye best slot check kar rahi hoon...") so the speech synthesizer delivers natural, human-grade inflection.
  - Never ask the user "Which language would you prefer to speak in?". Simply respond in their spoken tongue immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE DIRECTIVE 2: DOMAIN-SPECIFIC EXPERTISE & KNOWLEDGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Active Domain: **${domain.title.toUpperCase()}** (${domain.tagline})

${getDomainGuidelines(domainId)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE DIRECTIVE 3: HUMAN-IN-THE-LOOP HANDOVER PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You must initiate an immediate human handover when ANY of these 3 conditions occur:
1. **Explicit Request**: The customer asks to speak with a human, agent, specialist, manager, supervisor, doctor, or real representative (e.g. "Transfer me to a person", "Mujhe human agent se baat karni hai", "Quiero hablar con una persona").
2. **Sentiment Deterioration / Frustration**: The user expresses frustration, anger, repeatedly says the AI is not understanding them, or an issue has looped twice without resolution.
3. **Out-of-Scope / High-Risk Inquiry**:
   - Healthcare: Customer describes acute life-threatening emergencies (e.g., sudden chest pain, stroke symptoms).
   - Real Estate: Customer requests immediate binding legal escrow or title contract signing.
   - E-Commerce: Disputed payment fraud or high-value chargeback claims.
   - EdTech: Formal grievance against an instructor or legal credential verification.

**HANDOVER EXECUTION FORMAT**:
When triggering a handover, you MUST append this exact JSON event on its own line at the very end of your response text:
{"action": "TRANSFER_TO_HUMAN", "reason": "<concise reason for transfer>", "sentiment": "<positive|neutral|frustrated>", "domain": "${domainId}"}

**Spoken Handover Behavior**:
Before emitting the JSON tag, reassure the user warmly that you are connecting them to a live specialist right now with their full conversation history preserved. Example:
"I completely understand. I am transferring you directly to our senior human specialist right now with your full requirements and call transcript synced. Please stay on the line for just a moment."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOICE CADENCE & CONVERSATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Keep each spoken turn **under 35 words** unless the customer specifically asks for a detailed breakdown.
- Do NOT use markdown symbols (*, **, #), bullet points, or emojis in spoken sentences.
- Ask exactly ONE clear question per turn.
- If the customer interrupts you mid-sentence, stop immediately and address their new query directly.
`;
}

function getDomainGuidelines(domainId: DomainId): string {
  switch (domainId) {
    case 'healthcare':
      return `DOMAIN: HEALTHCARE & CLINICAL INTAKE
- Triage symptoms attentively: Ask duration, severity (scale 1-10), and past medical history.
- Appointments: Offer available doctor slots (Dr. Sarah Jenkins - Cardiology 4:30 PM, Dr. Rahul Sharma - Neurology 11:00 AM, Dr. Elena Rostova - Pediatrics 2:15 PM).
- Insurance: Verify insurance providers (Anthem, BlueCross, Medicare, UnitedHealth).
- MEDICAL SAFETY DISCLAIMER: Never provide definitive medical diagnoses or prescribe prescription medications. For severe symptoms (e.g., chest pain, difficulty breathing), immediately instruct the patient to call 911/emergency services and trigger TRANSFER_TO_HUMAN.`;

    case 'realestate':
      return `DOMAIN: REAL ESTATE & LUXURY ESTATES
- Client Discovery: Ascertain budget ($1M - $10M+), preferred neighborhoods, bedroom/bathroom requirements, and purchase timeline.
- Featured Properties:
  * Skyview Horizon Penthouse: $2,450,000 | 4 Bed / 4.5 Bath | 3,850 sqft | Waterfront Marina Bay.
  * Villa Moderna Sanctuary: $4,150,000 | 5 Bed / 6 Bath | 5,600 sqft | Private Infinity Pool.
  * Emerald Glass Residences: $1,290,000 | 2 Bed / 2.5 Bath | 1,820 sqft | Downtown views.
- Actions: Offer 3D virtual walkthroughs and schedule private in-person viewing slots with our senior agents.`;

    case 'ecommerce':
      return `DOMAIN: E-COMMERCE & RETAIL CONCIERGE
- Order Tracking: Ask for the Order ID (e.g., #ES-98421). Provide instant simulated tracking status (Shipped, Out for Delivery, Estimated Arrival).
- Product Catalog:
  * EchoSphere Studio Pro ANC Headphones ($249 - Free next-day delivery, 40hr battery).
  * EchoPulse Titan Fitness Smartwatch ($189 - 50m water resistant, SpO2 & ECG).
  * NovaPod Ultra Ergonomic Mic ($129 - Studio condenser, plug & play).
- Returns & Exchanges: 30-day hassle-free return policy. If the customer received a damaged item, immediately authorize a return label or trigger human replacement.`;

    case 'edtech':
      return `DOMAIN: EDTECH & CAREER COUNSELING
- Candidate Evaluation: Discover background (software, business, clinical), career goals, and weekly learning availability.
- Programs:
  * Full-Stack GenAI & Voice Agents Bootcamp: 16 Weeks, $3,800, 98% placement rate, scholarship available.
  * Executive Healthcare Data & Informatics: 10 Weeks, $2,600, HIPAA & FHIR accreditation.
  * FinTech Algorithmic Systems & Risk: 12 Weeks, $3,200, Quantitative trading models.
- Actions: Schedule 1-on-1 counselor calls, check scholarship qualification, and email program syllabus.`;

    default:
      return 'DOMAIN: GENERAL CONSULTATIVE ASSISTANCE\n- Listen actively, answer questions accurately, and guide customer to qualified outcome.';
  }
}

// ─── LocalStorage Helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = 'echosphere_active_domain';
const CUSTOM_DOMAINS_KEY = 'echosphere_custom_domains';

export function getCustomDomains(): Record<string, DomainMetadata> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_DOMAINS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCustomDomains(customs: Record<string, DomainMetadata>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_DOMAINS_KEY, JSON.stringify(customs));
  } catch {}
}

export function getAllDomains(): Record<string, DomainMetadata> {
  return {
    ...DOMAIN_PRESETS,
    ...getCustomDomains(),
  };
}

export function getActiveDomain(): DomainId {
  if (typeof window === 'undefined') return 'healthcare';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as DomainId;
    const all = getAllDomains();
    if (saved && all[saved]) return saved;
    return 'healthcare';
  } catch {
    return 'healthcare';
  }
}

export function setActiveDomain(domainId: DomainId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, domainId);
    window.dispatchEvent(new CustomEvent('echosphere:domain_changed', { detail: { domainId } }));
  } catch {
    // Ignore storage errors
  }
}

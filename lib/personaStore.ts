/**
 * EchoSphere AI Voice & Persona Store
 *
 * Configures the AI agent's tone, pacing, personality, and TTS voice ID.
 * Persists in localStorage and adapts Nova's conversational prompt and MiniMax TTS voice.
 */

export type PersonaId = 'professional' | 'friendly' | 'closer';

export interface PersonaConfig {
  id: PersonaId;
  name: string;
  tagline: string;
  badge: string;
  description: string;
  tonePromptModifier: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'female' | 'male';
  accent: string;
  language: string;
  sampleAuditionText: string;
}

export const PERSONAS: Record<PersonaId, PersonaConfig> = {
  professional: {
    id: 'professional',
    name: 'Executive Consultant',
    tagline: 'Analytical, metrics-driven & ROI-focused',
    badge: 'ENTERPRISE',
    description: 'Speaks with executive confidence, focuses on ROI calculations, implementation timelines, and security compliance.',
    tonePromptModifier: `TONE & PERSONA: You are an Executive Sales Consultant. Adopt a polished, consultative, and data-driven tone. Emphasize business ROI, operational efficiency, integration ease, and enterprise-grade security.`,
  },
  friendly: {
    id: 'friendly',
    name: 'Warm & Empathetic Partner',
    tagline: 'Collaborative, patient & relationship-first',
    badge: 'CONSULTATIVE',
    description: 'Warm and conversational, listens deeply to pain points, asks thoughtful follow-ups, and guides without pressure.',
    tonePromptModifier: `TONE & PERSONA: You are a Warm, Empathetic Advisor. Speak with genuine warmth, enthusiasm, and active listening. Validate the customer's frustrations before presenting solutions.`,
  },
  closer: {
    id: 'closer',
    name: 'Persuasive Revenue Closer',
    tagline: 'High-energy, proactive objection crusher',
    badge: 'HIGH-VELOCITY',
    description: 'High-energy and assertive, addresses competitors head-on, creates compelling urgency, and steers smoothly toward closing a demo.',
    tonePromptModifier: `TONE & PERSONA: You are a High-Velocity Revenue Closer. Be proactive, confident, and direct. When objections arise, immediately reframe around cost of delay and steer firmly toward booking a demonstration.`,
  },
};

export const VOICES: VoiceOption[] = [
  {
    id: 'English_captivating_female1',
    name: 'Nova (Captivating Female)',
    gender: 'female',
    accent: 'US Global',
    language: 'English, Hindi, Hinglish',
    sampleAuditionText: "Hi, I'm Nova! I can qualify prospects and book enterprise demos in real time.",
  },
  {
    id: 'English_professional_male1',
    name: 'Alex (Executive Male)',
    gender: 'male',
    accent: 'US Standard',
    language: 'English, Hinglish',
    sampleAuditionText: "Hello, Alex here. Let's analyze your team's current sales qualification workflow.",
  },
  {
    id: 'English_warm_female2',
    name: 'Priya (Articulate Female)',
    gender: 'female',
    accent: 'Indian / Global English',
    language: 'English, Hindi, Hinglish',
    sampleAuditionText: "Namaste! Main Priya hoon. Hum aapke sales cycle ko 3x faster bana sakte hain.",
  },
  {
    id: 'English_confident_male2',
    name: 'Aarav (Tech-Savvy Male)',
    gender: 'male',
    accent: 'Indian / Global English',
    language: 'English, Hindi, Hinglish',
    sampleAuditionText: "Hey there, Aarav here! Let's explore how EchoSphere integrates with your CRM stack.",
  },
  {
    id: 'English_expressive_male1',
    name: 'James (Authoritative Male)',
    gender: 'male',
    accent: 'UK British',
    language: 'English',
    sampleAuditionText: "Good day. EchoSphere delivers enterprise voice automation with verified security.",
  },
];

const PERSONA_STORAGE_KEY = 'echosphere_active_persona';
const VOICE_STORAGE_KEY = 'echosphere_active_voice';

export function getActivePersona(): PersonaConfig {
  if (typeof window === 'undefined') return PERSONAS.professional;
  try {
    const saved = localStorage.getItem(PERSONA_STORAGE_KEY) as PersonaId | null;
    return saved && PERSONAS[saved] ? PERSONAS[saved] : PERSONAS.professional;
  } catch {
    return PERSONAS.professional;
  }
}

export function setActivePersona(id: PersonaId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PERSONA_STORAGE_KEY, id);
}

export function getActiveVoice(): VoiceOption {
  if (typeof window === 'undefined') return VOICES[0];
  try {
    const saved = localStorage.getItem(VOICE_STORAGE_KEY);
    const found = VOICES.find(v => v.id === saved);
    return found ?? VOICES[0];
  } catch {
    return VOICES[0];
  }
}

export function setActiveVoice(voiceId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VOICE_STORAGE_KEY, voiceId);
}

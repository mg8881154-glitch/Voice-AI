/**
 * EchoSphere Dynamic Knowledge Base (RAG) Store
 *
 * Allows users to upload documents (PDF/TXT/Docs/Markdown) or link URLs.
 * Extracts and stores document chunks in localStorage, injecting relevant context
 * directly into Nova AI's prompt during live sales conversations.
 */

export interface RagDocument {
  id: string;
  title: string;
  sourceType: 'file' | 'url' | 'preset' | 'text';
  content: string;
  characterCount: number;
  uploadedAt: string;
  isActive: boolean;
}

const STORAGE_KEY = 'echosphere_rag_documents';

// ─── Default Enterprise Presets ────────────────────────────────────────────────

export const RAG_PRESETS: RagDocument[] = [
  {
    id: 'preset-echosphere-handbook',
    title: 'EchoSphere Product & Pricing Master Handbook',
    sourceType: 'preset',
    content: `ECHOSPHERE SALES & TECHNICAL SPECIFICATIONS:
- Starter Tier: $49/month. Includes 10 concurrent lines, bilingual English/Hindi STT, 1,000 voice minutes, and standard WebRTC audio.
- Business Growth Tier: $199/month ($159/mo billed annually). 100 concurrent lines, sub-500ms VAD turn detection, 10,000 voice minutes, HubSpot & Salesforce CRM direct sync, custom voices.
- Enterprise Tier: Custom pricing (starting at $999/mo). Unlimited lines, private LLM fine-tuning, on-prem/private cloud deployment, SOC-2 Type II certified, dedicated SLA (99.99% uptime), custom digital twin avatars.
- Latency Architecture: Built on Agora SD-RTN™ global real-time network with under 35ms network RTT and 380ms end-to-end conversational turnaround time (STT -> LLM -> TTS).
- Objections & Competitor Positioning: Unlike text-first chatbots (Intercom, Drift), EchoSphere is voice-native with full speech interruptions and tone-matching.`,
    characterCount: 960,
    uploadedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'preset-fintech-protocol',
    title: 'FinTech & Lending Qualification Rules',
    sourceType: 'preset',
    content: `FINTECH LENDING ELIGIBILITY GUIDELINES:
- Minimum business operating history: 12 months.
- Minimum monthly recurring revenue (MRR): $10,000.
- Approved loan purposes: Working capital, equipment financing, SaaS expansion.
- Interest rate range: 6.8% to 14.5% APR based on credit tier.
- KYC requirements: PAN/GST for India, EIN/Articles of Incorporation for US.
- Compliance: ISO 27001 compliant, RBI/FinCEN audit-ready data pipelines.`,
    characterCount: 460,
    uploadedAt: new Date().toISOString(),
    isActive: false,
  },
  {
    id: 'preset-healthcare-telehealth',
    title: 'Healthcare & Telehealth Protocol',
    sourceType: 'preset',
    content: `TELEHEALTH CLINICAL INTAKE GUIDELINES:
- HIPAA and GDPR compliant voice ingestion with automatic PII masking.
- Symptom triage: Automatically escalates emergency symptoms (chest pain, shortness of breath) to live on-call medical staff within 5 seconds.
- Appointment scheduling: Integrates with Epic, Cerner, and AthenaHealth EHR systems.
- Patient privacy: Voice recordings encrypted with AES-256 both in-transit and at-rest in dedicated HIPAA-compliant buckets.`,
    characterCount: 480,
    uploadedAt: new Date().toISOString(),
    isActive: false,
  },
];

export function getStoredDocuments(): RagDocument[] {
  if (typeof window === 'undefined') return RAG_PRESETS;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(RAG_PRESETS));
      return RAG_PRESETS;
    }
    return JSON.parse(data);
  } catch {
    return RAG_PRESETS;
  }
}

export function saveStoredDocuments(docs: RagDocument[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function toggleDocumentActive(id: string): RagDocument[] {
  const docs = getStoredDocuments().map(d => (d.id === id ? { ...d, isActive: !d.isActive } : d));
  saveStoredDocuments(docs);
  return docs;
}

export function addDocument(doc: Omit<RagDocument, 'id' | 'uploadedAt'>): RagDocument {
  const newDoc: RagDocument = {
    ...doc,
    id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    uploadedAt: new Date().toISOString(),
  };
  const docs = [newDoc, ...getStoredDocuments()];
  saveStoredDocuments(docs);
  return newDoc;
}

export function deleteDocument(id: string): RagDocument[] {
  const docs = getStoredDocuments().filter(d => d.id !== id);
  saveStoredDocuments(docs);
  return docs;
}

export function getActiveRagDocuments(): RagDocument[] {
  return getStoredDocuments().filter(d => d.isActive);
}

/**
 * Returns formatted context string of all active documents to inject into Nova's system prompt.
 */
export function getActiveKnowledgePromptSnippet(): string {
  const activeDocs = getActiveRagDocuments();
  if (activeDocs.length === 0) return '';

  const header = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nDYNAMIC KNOWLEDGE BASE (UPLOADED DOCUMENTS & PROTOCOLS)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nUse the following verified company documents to answer customer questions accurately:\n`;
  const body = activeDocs
    .map(d => `--- DOCUMENT: ${d.title} ---\n${d.content.trim()}`)
    .join('\n\n');

  return `${header}\n${body}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
}

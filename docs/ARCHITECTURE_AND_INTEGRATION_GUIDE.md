# EchoSphere Voice AI — Architecture & Feature Integration Guide

This guide provides a comprehensive technical overview, state management flow, and step-by-step implementation guide for integrating the three core features:
1. **Human-in-the-Loop Handover**
2. **Dynamic Multilingual Routing (30+ Languages)**
3. **Domain-Specific Persona Engine (Healthcare, Real Estate, E-Commerce, EdTech)**

---

## 1. System Architecture Overview

EchoSphere Voice AI is built on a sub-second, multi-provider conversational audio pipeline designed for zero-lag conversational turn-taking:

```
                  ┌───────────────────────────────┐
                  │    Browser / Mobile Client    │
                  │   (React / Next.js + WebRTC)  │
                  └──────────────┬────────────────┘
                                 │
                 Opus Audio RTC  │  JSON Transcripts & Events (RTM)
                                 ▼
                  ┌───────────────────────────────┐
                  │    Agora SD-RTN™ Network      │
                  │  (Sub-35ms Global Audio Edge) │
                  └──────────────┬────────────────┘
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│ Deepgram STT │          │   LLM Core   │          │ ElevenLabs / │
│   (Nova-3)   │ ──JSON─► │   (GPT-4o)   │ ──Text─► │  MiniMax TTS │
│ Multi-Lingual│          │Domain Persona│          │  Streaming   │
└──────────────┘          └──────┬───────┘          └──────────────┘
                                 │
                                 │ Handover Intent / Trigger
                                 ▼
                  ┌───────────────────────────────┐
                  │   Human-in-the-Loop Gateway   │
                  │   (SIP / Agora RTM Routing)   │
                  │  * Live Transcripts Synced *  │
                  └───────────────────────────────┘
```

### Components:
- **Client**: React 19, Next.js 16 (App Router), Agora RTC React hooks, Tailwind CSS, Lucide Icons.
- **Audio Transport**: Agora SD-RTN™ providing ultra-low-latency bidirectional Opus audio streaming with chorus audio profile.
- **Speech-to-Text (STT)**: Deepgram Nova-3 (`language: 'multi'`) for zero-shot language identification and real-time streaming transcription with speaker diarization.
- **LLM Reasoning**: OpenAI GPT-4o / Claude 3.5 Sonnet executing dynamic domain system prompts with structured JSON event emissions for agent actions.
- **Text-to-Speech (TTS)**: ElevenLabs / MiniMax (`speech_2_6_turbo`) providing sub-200ms first-byte audio with natural inflections and accent mirroring.
- **Human Handover Gateway**: Agora RTM channels routing live audio and synchronized transcripts to human agent consoles.

---

## 2. Dynamic Multilingual Routing (30+ Languages)

### Detection & Mirroring Architecture:
1. **Zero-Shot Automatic Detection**: The Deepgram STT layer is initialized with `language: 'multi'`. As soon as the user speaks their first words, the model identifies the language/dialect without requiring user configuration.
2. **Language Mirroring**: Nova's system prompt enforces strict language mirroring. If the caller speaks Hindi, Spanish, French, German, Japanese, or Arabic, Nova answers natively in that tongue.
3. **Romanized / Latin Transliteration for TTS**: For Hindi and regional Indian languages, responses are formulated in conversational Latin/Roman alphabet Hinglish (e.g., *"Aap bilkul chinta mat kijiye, main aapke liye best consultation slot book kar rahi hoon"*). This ensures the text-to-speech engine speaks with 100% natural, human-like cadence rather than synthetic robotic accents.

---

## 3. Domain-Specific Persona Engine

EchoSphere supports 4 interchangeable domains defined in `lib/domainEngine.ts`:

| Domain | Persona | Focus Area | Dynamic Rich Media Cards |
| :--- | :--- | :--- | :--- |
| **Healthcare** | Dr. Nova | Clinical intake, symptom triage, appointment booking | Doctor availability schedules, hospital ratings, fee structures |
| **Real Estate** | Nova Vance | Luxury estates, virtual tours, scheduling visits | Property cards with photos, square footage, bed/bath, virtual tour CTA |
| **E-Commerce** | Nova Retail | Order tracking, product specs, returns & exchanges | Product catalog cards, live simulated package tracker, discount tags |
| **EdTech** | Prof. Nova | Course counseling, admissions, scholarship matching | Course curriculum cards, skills badges, duration, counseling booking |

---

## 4. Human-in-the-Loop Handover Protocol

### Handover Trigger Conditions:
1. **Explicit Customer Request**: "Transfer me to a human", "I want to talk to an agent", "Kisi insaan se baat karao".
2. **Sentiment Deterioration**: Real-time sentiment analyzer detects frustration keywords or score drops below 35%.
3. **Out-of-Scope / High-Risk**: Life-threatening medical emergency (Healthcare), legal escrow execution (Real Estate), payment fraud claims (E-Commerce).

### Machine-Readable Output Convention:
When handover is triggered, Nova appends a structured JSON payload:
```json
{"action": "TRANSFER_TO_HUMAN", "reason": "Customer requested human assistance", "sentiment": "frustrated", "domain": "healthcare"}
```

### Handover Lifecycle:
1. **AI Spoken Reassurance**: Nova assures the caller: *"I completely understand. I am transferring you directly to our senior human specialist right now with your full requirements and call transcript synced."*
2. **Event Parsing**: Client-side `HumanEscalationBanner` catches the JSON event or sentiment drop.
3. **State Transition**: State updates from `ai_active` → `transferring` → `human_connected`.
4. **State Persistence**: The live human agent console receives the full conversation history and structured qualification data via Agora RTM.

---

## 5. Step-by-Step Implementation Guide

### Step 1: Install Core Dependencies
```bash
pnpm add agora-rtc-sdk-ng agora-rtc-react agora-rtm agora-agents agora-agent-client-toolkit lucide-react
```

### Step 2: Configure Server-Side Agent Invitation (`app/api/invite-agent/route.ts`)
```typescript
import { AgoraClient, Agent, Area, DeepgramSTT, OpenAI, MiniMaxTTS } from 'agora-agents';
import { generateDomainSystemPrompt, DOMAIN_PRESETS, DomainId } from '@/lib/domainEngine';

export async function POST(req: NextRequest) {
  const { channel_name, requester_id, domain } = await req.json();
  const activeDomain = (domain as DomainId) || 'healthcare';

  const client = new AgoraClient({ area: Area.US, appId: process.env.NEXT_PUBLIC_AGORA_APP_ID!, appCertificate: process.env.NEXT_AGORA_APP_CERTIFICATE! });

  const agent = new Agent({
    client,
    instructions: generateDomainSystemPrompt(activeDomain),
    greeting: DOMAIN_PRESETS[activeDomain].greetingMessage,
    turnDetection: { config: { speech_threshold: 0.45, start_of_speech: { mode: 'vad', vad_config: { interrupt_duration_ms: 120 } } } },
    parameters: { audio_scenario: 'chorus', data_channel: 'rtm', enable_metrics: true },
  })
    .withStt(new DeepgramSTT({ model: 'nova-3', language: 'multi' }))
    .withLlm(new OpenAI({ model: 'gpt-4o-mini' }))
    .withTts(new MiniMaxTTS({ model: 'speech_2_6_turbo' }));

  await agent.start({ channel: channel_name, remoteUids: [Number(requester_id)] });
  return NextResponse.json({ success: true });
}
```

### Step 3: Embed Frontend Components
Include `<DomainPersonaSelector />` on your dashboard and `<HumanEscalationBanner />` within your active call view to provide instant domain switching and real-time handover oversight.

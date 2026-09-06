import { NextRequest, NextResponse } from 'next/server';
import {
  AgoraClient,
  Agent,
  Area,
  DeepgramSTT,
  ExpiresIn,
  MiniMaxTTS,
  OpenAI,
} from 'agora-agents';
import { ClientStartRequest, AgentResponse } from '@/types/conversation';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import { getProductBriefForPrompt } from '@/lib/productKnowledge';
import { generateDomainSystemPrompt, DOMAIN_PRESETS, DomainId } from '@/lib/domainEngine';

// ─── EchoSphere Nova — Autonomous Voice AI Sales Agent System Prompt ─────────
// Product knowledge is injected at boot so Nova always has accurate pricing/
// feature data without needing extra tool calls during the conversation.
const ECHOSPHERE_PROMPT = `You are **Nova**, a senior AI Sales Representative for **EchoSphere** — an enterprise real-time voice AI sales agent platform built for modern revenue teams.

${getProductBriefForPrompt()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROLE & GOAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your job is to conduct a complete customer qualification and consultative sales conversation that naturally ends in a clear next action: a booked enterprise demo, a qualified sales lead, or a warm escalation to a human specialist.

You do NOT follow a rigid script. You listen attentively, adapt dynamically based on what the customer says, handle objections with confidence, and guide the conversation toward a meaningful next action.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANGUAGE & BILINGUAL CAPABILITY (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- You are completely bilingual and fluent in **English**, **Hindi**, and **Hinglish** (conversational Hindi written in Roman/Latin alphabet).
- **LANGUAGE MIRRORING**:
  - If the customer speaks English, reply in clean, fluent, professional English.
  - If the customer speaks Hindi or Hinglish (e.g. "EchoSphere ka pricing kya hai?", "Competitor se kaise better ho?", "Humare 120 users hain"), reply in natural, friendly Hinglish written in English/Latin letters so the TTS speaks it naturally. Example: "Bilkul! 120 users ke liye hamara Enterprise plan best rahega..."
  - If the customer switches languages mid-call, smoothly transition with them.
  - Never be confused by everyday Hindi/Hinglish vocabulary, business terms, or slang.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOICE CALL CADENCE & TURN-TAKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **This is a live phone/voice call**:
  - Keep each turn **crisp and under 35 words** unless the customer explicitly asks for a detailed breakdown.
  - Speak in short, natural, conversational sentences.
  - **NEVER use asterisks (*), markdown formatting, bullet points, emojis, or numbered lists** in spoken responses.
  - Exactly **ONE question per turn** — never overwhelm or interrogate the customer.
  - Never use fake robotic filler phrases like "Certainly!", "That is a great question!", "I would be delighted to assist!".
- **INTERRUPTIONS**: If the customer interrupts you mid-sentence, stop immediately, acknowledge what they just said, and address their new point directly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEMORY & PAST CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Remember every detail the customer shared earlier in the call (team size, current tools, pain points, budget, timeline).
- **Never re-ask** a question the customer has already answered.
- Naturally reference earlier context: e.g., "Earlier you mentioned 50 users, but now with 120 seats..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CUSTOMER QUALIFICATION (Collect Naturally)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Weave these qualification details naturally into conversation (do NOT treat this as a checklist):
1. Team size / number of seats needed
2. Primary use case (outbound sales, inbound qualification, 24/7 lead capture)
3. Current tools & pain points (manual qualification, slow response time, missed after-hours leads)
4. Budget sensitivity & purchase timeline
5. Decision maker / demo readiness

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DYNAMIC OBJECTION HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **"Pricing is too high"**: Reframe around ROI and missed revenue.
  "Most teams recover the cost in the first month just from after-hours leads that otherwise would have bounced. What does a single missed qualified lead cost your business?"
- **"Competitor X (Drift / Intercom) is cheaper"**:
  "That's true on sticker price, but they are text-first chat tools. EchoSphere is voice-native with sub-500 millisecond response times and direct CRM pipeline sync."
- **"Security & Trust concerns"**:
  "We are SOC 2 Type II certified, with TLS 1.3 in transit and AES-256 encryption at rest. Enterprise customers can also deploy on private cloud or on-premise."
- **"Not ready to buy right now / Just looking"**:
  "No problem at all — our 30-minute demonstration has zero commitment. It simply lets you see the real-time latency and custom persona capabilities firsthand."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HANDLING THE SALES SCENARIO (Exact Flow)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **Customer asks about pricing**:
   Quote the accurate tier for their team size (Starter: $49/mo up to 10 seats; Business: $199/mo up to 100 seats, or $159 billed annually; Enterprise: custom for 100+ seats). Mention the annual discount.
2. **Customer interrupts to compare with a competitor**:
   Immediately pause, acknowledge the comparison respectfully, highlight our real-time voice-first architecture and sub-500ms latency.
3. **Customer changes expected user count (e.g., from 50 to 120 users)**:
   Immediately acknowledge the update, pivot to the Enterprise plan, explain unlimited seats, custom LLM, and dedicated customer success manager.
4. **Customer requests an enterprise demonstration**:
   Enthusiastically confirm, outline what the demo covers, and offer to book a convenient 30-minute calendar slot.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HUMAN ESCALATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the customer asks to speak with a human specialist or sales engineer, say:
"Main hamare sales specialist ko aapka full conversation summary and requirement pass kar rahi hoon. Our team will connect with you right away." (Or in English: "I'll connect you directly with one of our enterprise sales specialists with your full requirements attached.")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLOSING OUTCOMES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- When interest is validated → Offer to book a demo slot directly on the calendar.
- When pricing is agreed → Offer to send the proposal and start a pilot.
- Always move the conversation toward a clear, actionable outcome.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGE DISPLAY CAPABILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You can display visuals on the customer's screen during the conversation.
Include this exact tag ANYWHERE in your response text:
[SHOW_IMAGE: your search query in English]

The tag is stripped from speech — the customer only hears your voice, but sees the graphic on screen.
- User asks for pricing / architecture / competitor comparison → [SHOW_IMAGE: enterprise sales dashboard] or [SHOW_IMAGE: business analytics dashboard]
- Rules: Query must be in English (2-5 words). At most ONE tag per turn. Only use when visually relevant.`;

// Opening line — professional, consultative sales opening with bilingual greeting.
const GREETING = `Hi, I'm Nova from EchoSphere! Are you looking to automate your sales calls and lead qualification, or is there a specific requirement I can help you with today? Aap Hindi ya English kisi me bhi baat kar sakte hain!`;

// agentUid identifies the AI in the RTC channel and shares its default with the client.
const agentUid = String(DEFAULT_AGENT_UID);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export async function POST(request: NextRequest) {
  try {
    // --- 1. Parse request ---

    const body = await request.json();
    const { requester_id, channel_name, knowledge_base, voice_id, persona_modifier, domain } = body;

    // Validate required env vars on first request so misconfiguration surfaces
    // with a clear error message rather than a silent failure.
    const appId = requireEnv('NEXT_PUBLIC_AGORA_APP_ID');
    const appCertificate = requireEnv('NEXT_AGORA_APP_CERTIFICATE');

    if (!channel_name || !requester_id) {
      return NextResponse.json(
        { error: 'channel_name and requester_id are required' },
        { status: 400 },
      );
    }

    // Adapt instructions with dynamic domain persona engine, RAG knowledge base & handover rules
    const activeDomainId = (domain as DomainId) || 'healthcare';
    let finalPrompt = domain
      ? generateDomainSystemPrompt(activeDomainId)
      : ECHOSPHERE_PROMPT;

    if (persona_modifier) {
      finalPrompt = `${finalPrompt}\n\n${persona_modifier}`;
    }
    if (knowledge_base) {
      finalPrompt = `${finalPrompt}\n\n${knowledge_base}`;
    }

    const domainGreeting = domain && DOMAIN_PRESETS[activeDomainId]
      ? DOMAIN_PRESETS[activeDomainId].greetingMessage
      : GREETING;

    const chosenVoiceId = voice_id || 'English_captivating_female1';

    // --- 2. Build and start the agent ---

    // AgoraClient authenticates API calls to the Agora Conversational AI service.
    // area: change to Area.EU or Area.AP for European or Asia-Pacific deployments.
    const client = new AgoraClient({
      area: Area.US,
      appId,
      appCertificate,
    });

    // Pipeline: Deepgram (reseller) STT → OpenAI (reseller) LLM → MiniMax (reseller) TTS.
    // Omit vendor API keys for supported models — AgentKit infers reseller presets on start (see Agora Console / billing).
    const agent = new Agent({
      client,
      instructions: finalPrompt,
      greeting: domainGreeting,
      failureMessage: 'Please wait a moment.',
      maxHistory: 50,
      // VAD controls how the agent detects the start and end of a user's turn.
      turnDetection: {
        config: {
          speech_threshold: 0.45,
          start_of_speech: {
            mode: 'vad',
            vad_config: {
              interrupt_duration_ms: 120, // faster interruption detection
              prefix_padding_ms: 200,
            },
          },
          end_of_speech: {
            mode: 'vad',
            vad_config: {
              silence_duration_ms: 420, // slightly tighter end-of-turn
            },
          },
        },
      },
      // RTM is required for transcript events in the browser client.
      // enable_tools is required for MCP tool invocation.
      advancedFeatures: { enable_rtm: true, enable_tools: true },
      // Required for browser RTM events:
      // - data_channel: 'rtm' enables RTM delivery path for state/metrics/errors
      // - enable_error_message emits AGENT_ERROR payloads
      // - enable_metrics emits AGENT_METRICS latency payloads
      parameters: {
        // web client → ultra-low-latency chorus profile
        audio_scenario: 'chorus',
        data_channel: 'rtm',
        enable_error_message: true,
        enable_metrics: true,
      },
    })
      .withStt(
        new DeepgramSTT({
          model: 'nova-3',
          language: 'multi',
        }),
        // BYOK: uncomment the following block and set NEXT_DEEPGRAM_API_KEY
        // new DeepgramSTT({
        //   apiKey: requireEnv('NEXT_DEEPGRAM_API_KEY'),
        //   model: 'nova-3',
        //   language: 'multi',
        // }),
      )
      .withLlm(
        new OpenAI({
          model: 'gpt-4o-mini',
          greetingMessage: domainGreeting,
          failureMessage: 'Please wait a moment.',
          maxHistory: 15,
          params: {
            max_tokens: 1024,
            temperature: 0.7,
            top_p: 0.95,
          },
        }),
        // BYOK: uncomment the following block and set NEXT_LLM_API_KEY and NEXT_LLM_URL
        // new OpenAI({
        //   apiKey: requireEnv('NEXT_LLM_API_KEY'),
        //   url: requireEnv('NEXT_LLM_URL'),
        //   model: 'gpt-4o-mini',
        //   greetingMessage: GREETING,
        //   failureMessage: 'Please wait a moment.',
        //   maxHistory: 15,
        //   maxTokens: 1024,
        //   temperature: 0.7,
        //   topP: 0.95,
        // }),
      )
      .withTts(
        new MiniMaxTTS({
          model: 'speech_2_6_turbo',
          voiceId: chosenVoiceId,
        }),
        // BYOK — ElevenLabs (set NEXT_ELEVENLABS_API_KEY; optional NEXT_ELEVENLABS_VOICE_ID)
        // new (await import('agora-agents')).ElevenLabsTTS({
        //   key: requireEnv('NEXT_ELEVENLABS_API_KEY'),
        //   modelId: 'eleven_flash_v2_5',
        //   voiceId: process.env.NEXT_ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB',
        //   sampleRate: 24000,
        // }),
      );

    // remoteUids restricts the agent to only process audio from this user
    const session = agent.createSession({
      channel: channel_name,
      agentUid,
      remoteUids: [requester_id],
      idleTimeout: 30,
      expiresIn: ExpiresIn.hours(1),
      debug: false, // enable debug to show restful API calls in the console
    });

    const agentId = await session.start();

    return NextResponse.json({
      agent_id: agentId,
      create_ts: Math.floor(Date.now() / 1000),
      state: 'RUNNING',
    } as AgentResponse);
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start conversation',
      },
      { status: 500 },
    );
  }
}

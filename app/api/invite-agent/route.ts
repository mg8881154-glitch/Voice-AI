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

// ─── EchoSphere Nova — Bilingual Assistant (Customer Support & Study Mentor) ─
// Product knowledge is injected at boot so Nova always has accurate pricing/
// feature data without needing extra tool calls during the conversation.
const ECHOSPHERE_PROMPT = `You are **Nova**, an intelligent, friendly, and bilingual AI Assistant for **EchoSphere**.

${getProductBriefForPrompt()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE ROLES & RESPONSIBILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You have two primary expert roles:
1. **Customer Support Specialist**:
   - Provide friendly, empathetic, and rapid assistance for EchoSphere products, plans, features, troubleshooting, and onboarding.
   - Clarify customer issues with patience and provide crisp, actionable step-by-step solutions.
   - Guide customers on pricing, integrations (CRM, Calendar), and enterprise capabilities when asked.

2. **Study & Learning Mentor**:
   - Help students, learners, and curious minds understand any academic, technical, or real-world concept.
   - Break down complex topics (science, math, programming, history, languages) into simple, relatable analogies and easy steps.
   - Solve doubts interactively, test understanding gently, and encourage curiosity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANGUAGE & BILINGUAL RULES (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- You are completely bilingual and fluent in **Hindi**, **Hinglish** (conversational Hindi written in Roman/Latin script), and **English**.
- **LANGUAGE MIRRORING**:
  - If the user speaks in Hindi or Hinglish (e.g. "Mujhe study me help chahiye", "EchoSphere ka pricing kya hai?", "Photosynthesis samjhao"), ALWAYS reply in natural, conversational Hinglish/Hindi using Roman/English alphabet so the voice TTS speaks it fluently. Example: "Haan bilkul! Main aapko simple words me samjhati hoon..."
  - If the user speaks in English, reply in clean, fluent English.
  - If the user switches languages mid-conversation, smoothly switch with them immediately.
  - Never be confused by Hindi slang, everyday Hinglish vocabulary, or mixed sentences.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOICE CALL CADENCE & PERSONALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Warm, polite, encouraging, and clear — like a helpful tutor or support engineer.
- **This is a live VOICE call**:
  - Keep sentences short, natural, and punchy.
  - Keep each turn **under 35 words** unless the user explicitly asks for a detailed explanation.
  - **NEVER use asterisks (*), markdown formatting, emojis, bullet points, or numbered lists** in your spoken responses. Speak naturally as a human would over the phone.
  - Exactly **one question or idea per turn** — never overwhelm the user.
- If interrupted by the user, stop immediately, acknowledge what they just said, and continue from there.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HANDLING SUPPORT SCENARIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Pricing & Plans**:
  - Starter: $49/mo (1-10 seats, 500 mins)
  - Business: $199/mo ($159 billed annually, up to 100 seats, CRM integration)
  - Enterprise: Custom pricing, unlimited seats & minutes, dedicated support.
- **Troubleshooting**: Acknowledge the issue calmly, suggest the first troubleshooting step clearly.
- **Human Escalation**: If the user insists on talking to a human, say: "Main aapko hamari support team se connect karne ke liye note kar leti hoon. Our team will reach out to you shortly."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HANDLING STUDY SCENARIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Explain Simply**: Use real-life everyday examples. For example, explain APIs like a restaurant waiter, or gravity like a magnet.
- **Step-by-step**: Explain the first fundamental concept, then ask: "Kya yeh step samajh aaya, ya aage explain karoon?"
- **Encourage**: Give positive reinforcement when the user asks good questions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGE DISPLAY CAPABILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You can display images on the user's screen during the conversation.

WHEN TO SHOW AN IMAGE:
1. User explicitly asks: "dikhao", "image dikhao", "picture dikhao", "show me", "can you show", "diagram dikhao", "photo dikhao"
2. You are explaining a study concept, diagram, animal, science topic, or product architecture and a visual helps immensely.

HOW TO SHOW AN IMAGE:
Include this exact tag ANYWHERE in your response text:
[SHOW_IMAGE: your search query in English]

The tag will be stripped from your spoken response — the customer will only HEAR your words, but will SEE the image on screen.

EXAMPLES:
- User says "solar system ka diagram dikhao" → "[SHOW_IMAGE: solar system planets diagram] Yeh raha solar system ka visual diagram aapki screen par."
- User says "photosynthesis samjhao photo ke sath" → "[SHOW_IMAGE: photosynthesis plant diagram] Photosynthesis wo process hai jisse paudhe sunlight se apna food banate hain."
- User says "business plan dikhao" → "[SHOW_IMAGE: business analytics dashboard] Yeh hamara business dashboard view hai."
- User says "show me Eiffel tower" → "[SHOW_IMAGE: eiffel tower paris] Here is the Eiffel Tower on your screen!"

RULES FOR THE TAG:
- The search query inside [SHOW_IMAGE: ...] MUST ALWAYS BE IN ENGLISH (2-5 descriptive words).
- Only include ONE [SHOW_IMAGE:] tag per turn.
- Do NOT include the tag if no visual is requested or relevant.`;

// Opening line — bilingual, welcoming, covers customer support and study assistance.
const GREETING = `Namaste! I'm Nova from EchoSphere. Main aapki customer support, study help, ya kisi bhi sawaal me madad kar sakti hoon. How can I help you today?`;

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

    const body: ClientStartRequest = await request.json();
    const { requester_id, channel_name } = body;

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
      instructions: ECHOSPHERE_PROMPT,
      greeting: GREETING,
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
          greetingMessage: GREETING,
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
          voiceId: 'English_captivating_female1',
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

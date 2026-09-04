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

// ─── EchoSphere Nova — PS21 Sales Agent System Prompt ────────────────────────
// Product knowledge is injected at boot so Nova always has accurate pricing/
// feature data without needing extra tool calls during the conversation.
const ECHOSPHERE_PROMPT = `You are **Nova**, a senior AI sales representative for **EchoSphere** — a real-time voice AI sales agent platform built for modern revenue teams.

${getProductBriefForPrompt()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROLE & GOAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your job is to run a complete qualification and sales conversation that ends in a clear next action: a booked demo, a qualified lead, or a warm hand-off to a human specialist.

You do NOT follow a fixed script.  You listen, adapt, and guide the conversation naturally toward a meaningful outcome for this specific customer.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSONALITY & VOICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Warm, direct, and confident — like a trusted colleague, not a call-centre agent.
- Never use filler affirmations: "absolutely", "great question", "certainly", "of course".
- This is a VOICE call.  Speak in short, natural sentences.  No bullet points or numbered lists.
- Match the customer's energy: if they're rushed, be crisp; if they're exploratory, be conversational.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE CONVERSATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **One question per turn** — never stack questions.
2. **Never re-ask** anything the customer already answered.
3. **Reference earlier context** naturally — e.g. "Earlier you mentioned 50 users…"
4. **If interrupted**, stop immediately, acknowledge briefly, and address what they said.
5. **Keep replies under 35 words** unless the customer explicitly asks for detail.
6. **Adapt your plan** whenever the customer changes requirements, budget, or user count.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEAD QUALIFICATION (collect naturally — never interrogate)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Weave these into the natural flow of the conversation.  Do not run through them as a checklist:
• Customer name and company
• Number of users / seats
• Primary use case (outbound sales, inbound support, lead gen, etc.)
• Current solution and pain point
• Budget range or sensitivity
• Purchase timeline

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HANDLING THE PS21 DEMO SCENARIO (the exact flow you must handle well)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Step 1 — Customer asks about pricing**
Quote the right plan for their team size.  Always mention the annual discount.
"For 50 users, the Business plan is $199 a month — or $159 billed annually."

**Step 2 — Customer interrupts to compare a competitor**
Stop.  Acknowledge their point.  Give ONE concrete, factual advantage without attacking the competitor.
"That's fair — [Competitor] is text-first.  EchoSphere is voice-native, so your agents respond in under 500 milliseconds instead of waiting for someone to type."

**Step 3 — Customer changes the user count mid-conversation**
Acknowledge immediately and re-quote without hesitation.  Reference what they said earlier.
"Got it — you mentioned 50 earlier, now you're thinking 120.  That moves you to our Enterprise plan, which has unlimited seats and a dedicated success manager.  Want me to outline what that looks like?"

**Step 4 — Customer asks for an enterprise demonstration**
Confirm buying intent, describe what the demo covers, and offer to schedule it right now.
"A personalised Enterprise demo usually covers the custom LLM setup, CRM integration, and live call analytics.  I can lock in a 30-minute slot with our enterprise team — does this week work?"

Throughout all four steps the agent must remember every detail and never ask a question that was already answered.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJECTION HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Price too high**
Reframe around ROI, not features.
"Most customers recover the cost in the first month from after-hours leads alone.  What does a missed lead typically cost your team?"

**Competitor is cheaper**
Agree on price, differentiate on value.
"They are cheaper.  The difference shows up in latency, accuracy, and the CRM integrations you'd otherwise have to build yourself."

**Security / trust concerns**
Lead with certification, then offer specifics.
"We're SOC 2 Type II certified, AES-256 encrypted at rest, TLS 1.3 in transit.  Enterprise customers can also deploy on-premise."

**Not ready to buy yet**
Anchor on the demo, not the contract.
"That's fine — the demo has no commitment attached.  It just gives you the numbers to make a proper internal case."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HUMAN ESCALATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the customer asks to speak to a human, or if their question genuinely needs specialist knowledge:
"I'll connect you with one of our enterprise specialists right now.  They'll have everything we've discussed."
Then stop speaking and wait.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLOSING MOVES (use when intent is clear)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Strong intent detected → offer a specific demo slot
- Mild interest → offer to send a written summary and follow up
- Not a fit right now → offer to stay in touch and note their timeline

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Never invent features, pricing, or capabilities not listed in the product brief above.
- Never mention Agora, the underlying voice infrastructure, or internal implementation details.
- If you genuinely don't know something, say so and offer to have a specialist follow up.
- Never end a turn with more than one question.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGE DISPLAY CAPABILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You can display images on the customer's screen during the conversation.

WHEN TO SHOW AN IMAGE:
1. Customer explicitly asks: "show me", "can you show", "display", "image of", "picture of", "dikhao"
2. You are explaining a product plan or feature and a visual would help
3. Customer asks about a competitor comparison
4. You are describing pricing and want to reinforce it visually

HOW TO SHOW AN IMAGE:
Include this exact tag ANYWHERE in your response text — beginning, middle, or end:
[SHOW_IMAGE: your search query here]

The tag will be stripped from your spoken response — the customer will only HEAR your words, but will SEE the image on screen.

EXAMPLES:
- Customer says "show me a dog" → your response: "[SHOW_IMAGE: cute dog] Sure! Here's a dog on your screen."
- Customer says "explain the business plan" → "[SHOW_IMAGE: business team collaboration] The Business plan supports up to 100 seats at $199 a month."
- Customer says "enterprise dikhao" → "[SHOW_IMAGE: enterprise office building] Our Enterprise plan offers unlimited seats with a dedicated success manager."
- Customer says "competitor comparison" → "[SHOW_IMAGE: business competition chart] Here is how we compare..."

RULES FOR THE TAG:
- Use a descriptive, specific search query (2-5 words work best)
- Only include ONE [SHOW_IMAGE:] tag per response
- The query inside should be in English regardless of what language the customer uses
- Do NOT include the tag if no visual is relevant`;

// Opening line — concise, open-ended, sets a consultative tone.
const GREETING = `Hi, I'm Nova from EchoSphere. What brings you in today — are you looking to automate your sales calls, or is there something more specific I can help with?`;

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
          language: 'en',
        }),
        // BYOK: uncomment the following block and set NEXT_DEEPGRAM_API_KEY
        // new DeepgramSTT({
        //   apiKey: requireEnv('NEXT_DEEPGRAM_API_KEY'),
        //   model: 'nova-3',
        //   language: 'en',
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

/**
 * POST /api/dial-out
 *
 * Initiates an outbound PSTN call through Agora's dial-out REST API.
 * The Agora App Certificate must NEVER leave the server — that is why this
 * route exists instead of calling Agora directly from the browser.
 *
 * When real Agora PSTN credentials are configured, set:
 *   NEXT_PUBLIC_AGORA_APP_ID      — already required by the base project
 *   NEXT_AGORA_APP_CERTIFICATE    — already required by the base project
 *   NEXT_AGORA_CUSTOMER_ID        — Agora RESTful API key (from Agora Console)
 *   NEXT_AGORA_CUSTOMER_SECRET    — Agora RESTful API secret
 *
 * Until those are configured the route returns a realistic mock response so
 * the UI and call-flow can be fully tested without live credentials.
 *
 * Agora PSTN dial-out docs:
 * https://docs.agora.io/en/conversational-ai/develop/enable-pstn
 */

import { NextRequest, NextResponse } from 'next/server';
import type { DialOutRequest, DialOutResponse, CallStatus } from '@/lib/phoneCallService';

// ─── Agora REST API helpers ───────────────────────────────────────────────────

function getBasicAuthHeader(): string {
  const customerId = process.env.NEXT_AGORA_CUSTOMER_ID;
  const customerSecret = process.env.NEXT_AGORA_CUSTOMER_SECRET;

  if (!customerId || !customerSecret) return '';

  const encoded = Buffer.from(`${customerId}:${customerSecret}`).toString('base64');
  return `Basic ${encoded}`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: DialOutRequest = await request.json();
    const { phoneNumber, channelName, agentUid, displayName } = body;

    if (!phoneNumber || !channelName || !agentUid) {
      return NextResponse.json(
        { error: 'phoneNumber, channelName, and agentUid are required' },
        { status: 400 },
      );
    }

    // Validate E.164 format
    if (!/^\+[1-9]\d{6,14}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'phoneNumber must be in E.164 format, e.g. +919876543210' },
        { status: 400 },
      );
    }

    const _appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const _authHeader = getBasicAuthHeader();

    // ── Live Agora PSTN path ──────────────────────────────────────────────────
    // Uncomment this block once NEXT_AGORA_CUSTOMER_ID and
    // NEXT_AGORA_CUSTOMER_SECRET are set in your environment.
    //
    // if (appId && authHeader) {
    //   const agoraRes = await fetch(
    //     `https://api.agora.io/v1/projects/${appId}/pstn/dial`,
    //     {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //         Authorization: authHeader,
    //       },
    //       body: JSON.stringify({
    //         channel: channelName,
    //         uid: agentUid,
    //         from: process.env.NEXT_AGORA_PSTN_FROM_NUMBER ?? '',
    //         to: phoneNumber,
    //       }),
    //     },
    //   );
    //
    //   if (!agoraRes.ok) {
    //     const err = await agoraRes.json().catch(() => ({}));
    //     return NextResponse.json(
    //       { error: `Agora PSTN error: ${JSON.stringify(err)}` },
    //       { status: agoraRes.status },
    //     );
    //   }
    //
    //   const data = await agoraRes.json();
    //   return NextResponse.json({
    //     callId: data.call_id ?? data.id ?? `call_${Date.now()}`,
    //     status: 'dialing' as CallStatus,
    //     message: `Calling ${displayName ?? phoneNumber}`,
    //   } satisfies DialOutResponse);
    // }

    // ── Mock path (no live credentials needed for prototype demo) ─────────────
    console.info(
      `[dial-out MOCK] Calling ${phoneNumber} → channel ${channelName} | agent UID ${agentUid}`,
    );

    // Simulate a short network delay
    await new Promise((r) => setTimeout(r, 600));

    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    return NextResponse.json({
      callId,
      status: 'dialing' as CallStatus,
      message: `Calling ${displayName ?? phoneNumber}… (demo mode)`,
    } satisfies DialOutResponse);

  } catch (error) {
    console.error('[dial-out] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to initiate call',
      },
      { status: 500 },
    );
  }
}

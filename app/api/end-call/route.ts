/**
 * POST /api/end-call
 *
 * Terminates an active PSTN call through Agora's REST API.
 * Requires the same credentials as /api/dial-out.
 *
 * Body: { callId: string, channelName: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import type { EndCallRequest } from '@/lib/phoneCallService';

function getBasicAuthHeader(): string {
  const customerId = process.env.NEXT_AGORA_CUSTOMER_ID;
  const customerSecret = process.env.NEXT_AGORA_CUSTOMER_SECRET;
  if (!customerId || !customerSecret) return '';
  return `Basic ${Buffer.from(`${customerId}:${customerSecret}`).toString('base64')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: EndCallRequest = await request.json();
    const { callId, channelName } = body;

    if (!callId || !channelName) {
      return NextResponse.json(
        { error: 'callId and channelName are required' },
        { status: 400 },
      );
    }

    const _appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const _authHeader = getBasicAuthHeader();

    // ── Live Agora PSTN path ──────────────────────────────────────────────────
    // Uncomment once credentials are configured.
    //
    // if (appId && authHeader) {
    //   const agoraRes = await fetch(
    //     `https://api.agora.io/v1/projects/${appId}/pstn/calls/${callId}`,
    //     {
    //       method: 'DELETE',
    //       headers: { Authorization: authHeader },
    //     },
    //   );
    //   if (!agoraRes.ok) {
    //     const err = await agoraRes.json().catch(() => ({}));
    //     return NextResponse.json(
    //       { error: `Agora end-call error: ${JSON.stringify(err)}` },
    //       { status: agoraRes.status },
    //     );
    //   }
    //   return NextResponse.json({ success: true });
    // }

    // ── Mock path ─────────────────────────────────────────────────────────────
    console.info(`[end-call MOCK] Hanging up callId=${callId} channel=${channelName}`);
    await new Promise((r) => setTimeout(r, 300));

    return NextResponse.json({ success: true, message: 'Call ended (demo mode)' });

  } catch (error) {
    console.error('[end-call] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to end call' },
      { status: 500 },
    );
  }
}

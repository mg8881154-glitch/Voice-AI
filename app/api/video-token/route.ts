/**
 * GET /api/video-token?channel=&uid=&role=publisher|subscriber
 * Issues an RTC token for 1-on-1 video calls.
 * role=publisher  → sales rep / host  (can publish video+audio)
 * role=subscriber → client / viewer   (can receive only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channel  = searchParams.get('channel') ?? `sales-${Date.now()}`;
    const uid      = parseInt(searchParams.get('uid') ?? '0', 10);
    const roleStr  = searchParams.get('role') ?? 'publisher';

    const appId   = requireEnv('NEXT_PUBLIC_AGORA_APP_ID');
    const cert    = requireEnv('NEXT_AGORA_APP_CERTIFICATE');
    const expiry  = Math.floor(Date.now() / 1000) + 3600;
    const role    = roleStr === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

    const token = RtcTokenBuilder.buildTokenWithUid(appId, cert, channel, uid, role, expiry, expiry);
    return NextResponse.json({ token, channel, uid, role: roleStr, appId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Token generation failed' },
      { status: 500 },
    );
  }
}

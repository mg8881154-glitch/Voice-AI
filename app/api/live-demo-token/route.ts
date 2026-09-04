/**
 * GET /api/live-demo-token?channel=&uid=&role=host|audience
 * Issues RTC token for live product demo streams.
 * host     → PUBLISHER  (sales rep broadcasts video + screen)
 * audience → SUBSCRIBER (clients watch)
 */
import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channel  = searchParams.get('channel') ?? `demo-${Date.now()}`;
    const uid      = parseInt(searchParams.get('uid') ?? '0', 10);
    const roleStr  = searchParams.get('role') ?? 'host';

    const appId  = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
    const cert   = process.env.NEXT_AGORA_APP_CERTIFICATE!;
    if (!appId || !cert) throw new Error('Missing Agora credentials');

    const expiry = Math.floor(Date.now() / 1000) + 7200; // 2h for demos
    const role   = roleStr === 'audience' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
    const token  = RtcTokenBuilder.buildTokenWithUid(appId, cert, channel, uid, role, expiry, expiry);

    return NextResponse.json({ token, channel, uid, role: roleStr, appId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Token failed' },
      { status: 500 },
    );
  }
}

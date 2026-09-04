/**
 * GET /api/rtm-token?uid=
 *
 * Issues an RTM-capable token for the given string UID.
 * Uses RtcTokenBuilder.buildTokenWithRtm so the same token works for
 * both RTC and RTM (same contract as /api/generate-agora-token).
 *
 * RTM v2 requires this token to be passed to rtm.login({ token }).
 * Without it you get a 401 / "token required" error when App Certificate
 * is enabled on the Agora project.
 */
import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function GET(req: NextRequest) {
  const appId  = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const cert   = process.env.NEXT_AGORA_APP_CERTIFICATE;

  if (!appId || !cert) {
    return NextResponse.json({ error: 'Agora credentials not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  // RTM UIDs are strings; we hash to a numeric UID for the token
  const rawUid   = searchParams.get('uid') ?? `es-${Date.now()}`;
  // Convert string UID to a stable numeric UID via simple hash
  const numericUid = Math.abs(
    rawUid.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0),
  ) % 2_000_000 + 1;

  const expiry = Math.floor(Date.now() / 1000) + 3600;

  // buildTokenWithRtm grants both RTC and RTM privileges
  const token = RtcTokenBuilder.buildTokenWithRtm(
    appId,
    cert,
    'rtm-chat',    // channel name is ignored for RTM-only tokens but required by builder
    numericUid.toString(),
    RtcRole.PUBLISHER,
    expiry,
    expiry,
  );

  return NextResponse.json({ token, uid: rawUid, numericUid });
}

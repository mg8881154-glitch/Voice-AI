/**
 * POST /api/recording/start
 * Starts Agora Cloud Recording for a channel.
 * Saves to Amazon S3 (configure via env vars).
 *
 * Required env vars for live recording:
 *   NEXT_AGORA_CUSTOMER_ID       — Agora REST API key
 *   NEXT_AGORA_CUSTOMER_SECRET   — Agora REST API secret
 *   NEXT_AWS_S3_BUCKET           — S3 bucket name
 *   NEXT_AWS_S3_ACCESS_KEY       — AWS access key
 *   NEXT_AWS_S3_SECRET_KEY       — AWS secret key
 *   NEXT_AWS_S3_REGION           — AWS region (e.g. us-east-1)
 */

import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

interface StartRecordingBody {
  channelName: string;
  uid: string;
}

export interface RecordingSession {
  resourceId: string;
  sid: string;
  channelName: string;
  startedAt: string;
  mode: 'mix' | 'individual';
}

function getAuthHeader(): string {
  const id  = process.env.NEXT_AGORA_CUSTOMER_ID;
  const sec = process.env.NEXT_AGORA_CUSTOMER_SECRET;
  if (!id || !sec) return '';
  return `Basic ${Buffer.from(`${id}:${sec}`).toString('base64')}`;
}

function buildRecordingToken(channel: string, uid: number): string {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
  const cert  = process.env.NEXT_AGORA_APP_CERTIFICATE!;
  const exp   = Math.floor(Date.now() / 1000) + 7200;
  return RtcTokenBuilder.buildTokenWithUid(appId, cert, channel, uid, RtcRole.SUBSCRIBER, exp, exp);
}

export async function POST(req: NextRequest) {
  try {
    const body: StartRecordingBody = await req.json();
    const { channelName, uid } = body;

    if (!channelName || !uid) {
      return NextResponse.json({ error: 'channelName and uid are required' }, { status: 400 });
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
    const auth  = getAuthHeader();

    // ── Live Agora Cloud Recording path ──────────────────────────────────────
    if (auth) {
      // Step 1: Acquire resource
      const acquireRes = await fetch(
        `https://api.agora.io/v1/apps/${appId}/cloud_recording/acquire`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: auth },
          body: JSON.stringify({ cname: channelName, uid, clientRequest: { resourceExpiredHour: 24 } }),
        },
      );
      if (!acquireRes.ok) throw new Error(`Acquire failed: ${acquireRes.status}`);
      const { resourceId } = await acquireRes.json() as { resourceId: string };

      // Step 2: Start recording
      const token = buildRecordingToken(channelName, parseInt(uid, 10));
      const startRes = await fetch(
        `https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: auth },
          body: JSON.stringify({
            cname: channelName,
            uid,
            clientRequest: {
              token,
              recordingConfig: {
                maxIdleTime: 120,
                streamTypes: 3, // audio + video
                channelType: 0,
                videoStreamType: 0,
                transcodingConfig: { height: 720, width: 1280, bitrate: 2000, fps: 30 },
              },
              storageConfig: {
                vendor: 1, // Amazon S3
                region: 0,
                bucket: process.env.NEXT_AWS_S3_BUCKET ?? 'echosphere-recordings',
                accessKey: process.env.NEXT_AWS_S3_ACCESS_KEY ?? '',
                secretKey: process.env.NEXT_AWS_S3_SECRET_KEY ?? '',
                fileNamePrefix: ['recordings', channelName],
              },
            },
          }),
        },
      );
      if (!startRes.ok) throw new Error(`Start failed: ${startRes.status}`);
      const { sid } = await startRes.json() as { sid: string };

      return NextResponse.json({
        resourceId, sid, channelName,
        startedAt: new Date().toISOString(),
        mode: 'mix',
      } satisfies RecordingSession);
    }

    // ── Mock path (no credentials) ───────────────────────────────────────────
    console.info(`[recording/start MOCK] channel=${channelName} uid=${uid}`);
    await new Promise(r => setTimeout(r, 500));

    return NextResponse.json({
      resourceId: `mock_resource_${Date.now()}`,
      sid: `mock_sid_${Date.now()}`,
      channelName,
      startedAt: new Date().toISOString(),
      mode: 'mix',
    } satisfies RecordingSession);

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to start recording' },
      { status: 500 },
    );
  }
}

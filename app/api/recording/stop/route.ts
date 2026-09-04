/**
 * POST /api/recording/stop
 * Stops an active Agora Cloud Recording session.
 * Body: { resourceId, sid, channelName, uid }
 */

import { NextRequest, NextResponse } from 'next/server';

interface StopRecordingBody {
  resourceId: string;
  sid: string;
  channelName: string;
  uid: string;
}

export interface RecordingStopResult {
  resourceId: string;
  sid: string;
  serverResponse?: { fileList?: { fileName: string; trackType: string }[] };
  stoppedAt: string;
}

function getAuthHeader(): string {
  const id  = process.env.NEXT_AGORA_CUSTOMER_ID;
  const sec = process.env.NEXT_AGORA_CUSTOMER_SECRET;
  if (!id || !sec) return '';
  return `Basic ${Buffer.from(`${id}:${sec}`).toString('base64')}`;
}

export async function POST(req: NextRequest) {
  try {
    const body: StopRecordingBody = await req.json();
    const { resourceId, sid, channelName, uid } = body;

    if (!resourceId || !sid || !channelName || !uid) {
      return NextResponse.json({ error: 'resourceId, sid, channelName, uid are required' }, { status: 400 });
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
    const auth  = getAuthHeader();

    if (auth) {
      const res = await fetch(
        `https://api.agora.io/v1/apps/${appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: auth },
          body: JSON.stringify({ cname: channelName, uid, clientRequest: {} }),
        },
      );
      if (!res.ok) throw new Error(`Stop failed: ${res.status}`);
      const data = await res.json() as { serverResponse?: RecordingStopResult['serverResponse'] };
      return NextResponse.json({ resourceId, sid, serverResponse: data.serverResponse, stoppedAt: new Date().toISOString() } satisfies RecordingStopResult);
    }

    // Mock
    console.info(`[recording/stop MOCK] sid=${sid}`);
    await new Promise(r => setTimeout(r, 400));
    return NextResponse.json({
      resourceId, sid,
      serverResponse: { fileList: [{ fileName: `${channelName}_${sid}.mp4`, trackType: 'audio_and_video' }] },
      stoppedAt: new Date().toISOString(),
    } satisfies RecordingStopResult);

  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to stop recording' }, { status: 500 });
  }
}

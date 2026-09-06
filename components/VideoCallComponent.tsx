'use client';
/**
 * Feature 1 — 1-on-1 Video & Audio Sales Call
 *
 * Implements:
 *  • Join a named channel as publisher (sales rep) or subscriber (client)
 *  • Local + remote video tracks attached to HTML containers
 *  • Toggle audio / video individually
 *  • Leave / disconnect with full cleanup
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Phone, Monitor, Copy, Check, Users, Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScreenAnnotationToolbar } from './ScreenAnnotationToolbar';
import { cn } from '@/lib/utils';

type CallState = 'idle' | 'joining' | 'connected' | 'ended';
type Role = 'publisher' | 'subscriber';

interface VideoTokenResponse {
  token: string;
  channel: string;
  uid: number;
  appId: string;
}

export function VideoCallComponent() {
  const [callState, setCallState]     = useState<CallState>('idle');
  const [role, setRole]               = useState<Role>('publisher');
  const [channelInput, setChannelInput] = useState('');
  const [activeChannel, setActiveChannel] = useState('');
  const [audioMuted, setAudioMuted]   = useState(false);
  const [videoMuted, setVideoMuted]   = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);
  const [duration, setDuration]       = useState(0);
  const [annotationActive, setAnnotationActive] = useState(false);

  const localVideoRef  = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const clientRef      = useRef<import('agora-rtc-sdk-ng').IAgoraRTCClient | null>(null);
  const localTracksRef = useRef<{
    audio: import('agora-rtc-sdk-ng').IMicrophoneAudioTrack | null;
    video: import('agora-rtc-sdk-ng').ICameraVideoTrack | null;
  }>({ audio: null, video: null });
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);

  // Duration timer
  useEffect(() => {
    if (callState === 'connected') {
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  const joinCall = useCallback(async () => {
    setError(null);
    setCallState('joining');

    try {
      const channel = channelInput.trim() || `sales-${Date.now()}`;
      setActiveChannel(channel);

      // Fetch token from server
      const res = await fetch(`/api/video-token?channel=${encodeURIComponent(channel)}&role=${role}`);
      const data: VideoTokenResponse = await res.json();
      if (!res.ok) throw new Error((data as {error?:string}).error ?? 'Token failed');

      // Dynamically import Agora RTC (browser only)
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      // Handle remote user events
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video' && remoteVideoRef.current) {
          user.videoTrack?.play(remoteVideoRef.current);
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
        setRemoteJoined(true);
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') setRemoteJoined(false);
      });

      client.on('user-left', () => setRemoteJoined(false));

      // Join channel
      await client.join(data.appId, channel, data.token, data.uid);

      if (role === 'publisher') {
        // Create and publish local tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localTracksRef.current = { audio: audioTrack, video: videoTrack };

        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }
        await client.publish([audioTrack, videoTrack]);
      }

      setCallState('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join call');
      setCallState('idle');
    }
  }, [channelInput, role]);

  const leaveCall = useCallback(async () => {
    const { audio, video } = localTracksRef.current;
    audio?.stop(); audio?.close();
    video?.stop(); video?.close();
    localTracksRef.current = { audio: null, video: null };
    await clientRef.current?.leave();
    clientRef.current = null;
    setCallState('ended');
    setRemoteJoined(false);
    setTimeout(() => setCallState('idle'), 2000);
  }, []);

  const toggleAudio = useCallback(async () => {
    const track = localTracksRef.current.audio;
    if (!track) return;
    await track.setMuted(!audioMuted);
    setAudioMuted(v => !v);
  }, [audioMuted]);

  const toggleVideo = useCallback(async () => {
    const track = localTracksRef.current.video;
    if (!track) return;
    await track.setMuted(!videoMuted);
    setVideoMuted(v => !v);
  }, [videoMuted]);

  const copyChannel = () => {
    navigator.clipboard.writeText(activeChannel);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Idle / Join screen ────────────────────────────────────────────────────
  if (callState === 'idle' || callState === 'ended') {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">1-on-1 Video Sales Call</h2>
          <p className="text-sm text-muted-foreground">Start or join a video call with a client</p>
        </div>

        {/* Role selector */}
        <div className="flex gap-2">
          {(['publisher', 'subscriber'] as Role[]).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                'flex-1 rounded-xl border py-2.5 text-sm font-semibold capitalize transition-colors',
                role === r
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40',
              )}
            >
              {r === 'publisher' ? '📹 Sales Rep (Host)' : '👤 Client (Viewer)'}
            </button>
          ))}
        </div>

        {/* Channel input */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Channel Name (leave blank to auto-generate)
          </label>
          <input
            value={channelInput}
            onChange={e => setChannelInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && joinCall()}
            placeholder="e.g. sales-meeting-001"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button
          onClick={joinCall}
          className="h-11 w-full gap-2 text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(258 90% 66%) 100%)', border: 'none', color: 'white' }}
        >
          <Phone className="h-4 w-4" />
          Join Call
        </Button>

        {callState === 'ended' && (
          <p className="text-center text-sm text-muted-foreground">Call ended</p>
        )}
      </div>
    );
  }

  // ── In-call screen ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Live Video Call</p>
          <p className="text-xs text-muted-foreground">
            {activeChannel} · {formatDuration(duration)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyChannel}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <span className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            remoteJoined ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400',
          )}>
            <Users className="h-3 w-3" />
            {remoteJoined ? 'Client Connected' : 'Waiting for client…'}
          </span>
        </div>
      </div>

      {/* Video grid */}
      <div className="flex flex-1 gap-3 p-4 min-h-0">
        {/* Remote video (large) */}
        <div
          ref={remoteVideoRef}
          className="flex-1 rounded-2xl bg-card/50 border border-border/60 overflow-hidden relative flex items-center justify-center"
        >
          {/* Live Annotation Drawing Canvas Overlay */}
          <ScreenAnnotationToolbar
            isActive={annotationActive}
            onToggleActive={setAnnotationActive}
          />

          {!remoteJoined && (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/30">
                <Users className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Waiting for the other party…</p>
              <p className="text-xs text-muted-foreground/60">Share the channel name: <span className="font-mono text-primary">{activeChannel}</span></p>
            </div>
          )}
          <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-2 py-1 text-xs text-white z-10">
            {remoteJoined ? 'Client' : 'Remote'}
          </div>
        </div>

        {/* Local video (small, publisher only) */}
        {role === 'publisher' && (
          <div
            ref={localVideoRef}
            className="w-48 shrink-0 rounded-2xl bg-card/50 border border-border/60 overflow-hidden relative"
          >
            {videoMuted && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/80">
                <VideoOff className="h-8 w-8 text-muted-foreground/40" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 rounded-lg bg-black/50 px-2 py-0.5 text-xs text-white">
              You
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 border-t border-border/60 px-4 py-4">
        <button
          onClick={toggleAudio}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full border transition-colors',
            audioMuted
              ? 'border-destructive/40 bg-destructive/15 text-destructive'
              : 'border-border bg-muted/30 text-foreground hover:bg-muted',
          )}
          aria-label={audioMuted ? 'Unmute' : 'Mute'}
        >
          {audioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {role === 'publisher' && (
          <button
            onClick={toggleVideo}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full border transition-colors',
              videoMuted
                ? 'border-destructive/40 bg-destructive/15 text-destructive'
                : 'border-border bg-muted/30 text-foreground hover:bg-muted',
            )}
            aria-label={videoMuted ? 'Show video' : 'Hide video'}
          >
            {videoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </button>
        )}

        {/* Live Annotation Drawing Toggle */}
        <button
          onClick={() => setAnnotationActive(v => !v)}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full border transition-all',
            annotationActive
              ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'border-border bg-muted/30 text-foreground hover:bg-muted'
          )}
          aria-label={annotationActive ? 'Disable Annotation' : 'Enable Annotation'}
          title="Annotate on screen (Pen, Laser, Highlighter)"
        >
          <Pencil className="h-5 w-5" />
        </button>

        <button
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/30 text-foreground hover:bg-muted transition-colors"
          aria-label="Screen share (coming soon)"
          title="Screen share"
        >
          <Monitor className="h-5 w-5" />
        </button>

        <button
          onClick={leaveCall}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-white hover:bg-destructive/90 transition-colors"
          aria-label="End call"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

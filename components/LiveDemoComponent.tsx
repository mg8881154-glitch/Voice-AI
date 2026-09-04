'use client';
/**
 * Feature 2 — Interactive Live Product Demo
 *
 * Host (sales rep):  publish camera + audio, optionally share screen
 * Audience (client): watch live stream in real time
 * Both sides:        live chat via Agora RTM
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Monitor,
  MonitorOff, Users, MessageSquare, Send,
  Radio, Eye, Copy, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type DemoRole = 'host' | 'audience';
type DemoState = 'idle' | 'joining' | 'live' | 'ended';

interface ChatMessage { id: string; sender: string; text: string; time: string; }

interface DemoTokenResponse { token: string; channel: string; uid: number; appId: string; }

export function LiveDemoComponent() {
  const [demoState, setDemoState]     = useState<DemoState>('idle');
  const [role, setRole]               = useState<DemoRole>('host');
  const [channelInput, setChannelInput] = useState('');
  const [activeChannel, setActiveChannel] = useState('');
  const [audioMuted, setAudioMuted]   = useState(false);
  const [videoMuted, setVideoMuted]   = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatOpen, setChatOpen]       = useState(false);
  const [chatInput, setChatInput]     = useState('');
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [error, setError]             = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);

  const localVideoRef  = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const clientRef      = useRef<import('agora-rtc-sdk-ng').IAgoraRTCClient | null>(null);
  const localTracksRef = useRef<{
    audio: import('agora-rtc-sdk-ng').IMicrophoneAudioTrack | null;
    video: import('agora-rtc-sdk-ng').ICameraVideoTrack | null;
    screen: import('agora-rtc-sdk-ng').ILocalVideoTrack | null;
  }>({ audio: null, video: null, screen: null });
  const rtmClientRef   = useRef<import('agora-rtm').RTMClient | null>(null);
  const rtmChannelRef  = useRef<string>('');
  const chatEndRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((sender: string, text: string) => {
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      sender, text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  }, []);

  const startDemo = useCallback(async () => {
    setError(null);
    setDemoState('joining');

    try {
      const channel = channelInput.trim() || `demo-${Date.now()}`;
      setActiveChannel(channel);

      const res  = await fetch(`/api/live-demo-token?channel=${encodeURIComponent(channel)}&role=${role}`);
      const data: DemoTokenResponse = await res.json();
      if (!res.ok) throw new Error((data as {error?:string}).error ?? 'Token failed');

      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      const mode = role === 'host' ? 'live' : 'live';
      const client = AgoraRTC.createClient({ mode, codec: 'vp8' });
      clientRef.current = client;

      await client.setClientRole(role === 'host' ? 'host' : 'audience');

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video' && remoteVideoRef.current) {
          user.videoTrack?.play(remoteVideoRef.current);
        }
        if (mediaType === 'audio') user.audioTrack?.play();
        setViewerCount(v => v + 1);
      });

      client.on('user-joined', () => setViewerCount(v => v + 1));
      client.on('user-left', ()   => setViewerCount(v => Math.max(0, v - 1)));

      await client.join(data.appId, channel, data.token, data.uid);

      if (role === 'host') {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localTracksRef.current.audio = audioTrack;
        localTracksRef.current.video = videoTrack;
        if (localVideoRef.current) videoTrack.play(localVideoRef.current);
        await client.publish([audioTrack, videoTrack]);
      }

      // RTM for chat
      try {
        const { default: AgoraRTM } = await import('agora-rtm');
        const rtm = new AgoraRTM.RTM(data.appId, String(data.uid));
        await rtm.login({ token: undefined });
        await rtm.subscribe(channel);
        rtmClientRef.current = rtm;
        rtmChannelRef.current = channel;
        rtm.addEventListener('message', (event: { message: string | Uint8Array; publisher: string }) => {
          const rawMsg = event.message;
          const msgStr = typeof rawMsg === 'string' ? rawMsg : new TextDecoder().decode(rawMsg as Uint8Array);
          try {
            const parsed = JSON.parse(msgStr);
            addMessage(parsed.sender ?? event.publisher, parsed.text ?? msgStr);
          } catch {
            addMessage(event.publisher, msgStr);
          }
        });
        addMessage('System', `${role === 'host' ? 'Demo started' : 'You joined the demo'}`);
      } catch { /* chat optional */ }

      setDemoState('live');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start demo');
      setDemoState('idle');
    }
  }, [channelInput, role, addMessage]);

  const toggleScreenShare = useCallback(async () => {
    if (!clientRef.current) return;
    const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

    if (!screenSharing) {
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({}, 'disable');
        const track = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
        localTracksRef.current.screen = track;
        if (localTracksRef.current.video) await clientRef.current.unpublish([localTracksRef.current.video]);
        await clientRef.current.publish([track]);
        if (localVideoRef.current) track.play(localVideoRef.current);
        setScreenSharing(true);
      } catch { /* user cancelled */ }
    } else {
      const screen = localTracksRef.current.screen;
      if (screen) { screen.stop(); screen.close(); }
      localTracksRef.current.screen = null;
      if (localTracksRef.current.video) {
        await clientRef.current.publish([localTracksRef.current.video]);
        if (localVideoRef.current) localTracksRef.current.video.play(localVideoRef.current);
      }
      setScreenSharing(false);
    }
  }, [screenSharing]);

  const endDemo = useCallback(async () => {
    const { audio, video, screen } = localTracksRef.current;
    [audio, video, screen].forEach(t => { t?.stop(); t?.close(); });
    localTracksRef.current = { audio: null, video: null, screen: null };
    await clientRef.current?.leave();
    await rtmClientRef.current?.logout().catch(() => {});
    clientRef.current = null; rtmClientRef.current = null;
    setDemoState('ended');
    setTimeout(() => setDemoState('idle'), 2000);
  }, []);

  const sendChat = useCallback(async () => {
    if (!chatInput.trim() || !rtmClientRef.current) return;
    const payload = JSON.stringify({ sender: role === 'host' ? 'Host' : 'Viewer', text: chatInput.trim() });
    await rtmClientRef.current.publish(rtmChannelRef.current, payload).catch(() => {});
    addMessage(role === 'host' ? 'You (Host)' : 'You', chatInput.trim());
    setChatInput('');
  }, [chatInput, role, addMessage]);

  const copyLink = () => { navigator.clipboard.writeText(activeChannel); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // ── Idle screen ──────────────────────────────────────────────────────────
  if (demoState === 'idle' || demoState === 'ended') {
    return (
      <div className="flex flex-col gap-5 p-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Live Product Demo</h2>
          <p className="text-sm text-muted-foreground">Host a live demo or join as a viewer</p>
        </div>
        <div className="flex gap-2">
          {(['host','audience'] as DemoRole[]).map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={cn('flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors',
                role === r ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
              )}>
              {r === 'host' ? '🎙️ Host (Sales Rep)' : '👥 Audience (Client)'}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">Demo Channel</label>
          <input value={channelInput} onChange={e => setChannelInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && startDemo()}
            placeholder="e.g. product-demo-2024"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary transition-colors" />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button onClick={startDemo}
          className="h-11 w-full gap-2 text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(258 90% 66%) 100%)', border: 'none', color: 'white' }}>
          <Radio className="h-4 w-4" />
          {role === 'host' ? 'Start Demo' : 'Join Demo'}
        </Button>
        {demoState === 'ended' && <p className="text-center text-sm text-muted-foreground">Demo ended</p>}
      </div>
    );
  }

  // ── Live screen ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-foreground">LIVE</span>
          <span className="text-xs text-muted-foreground">· {activeChannel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5" /> {viewerCount}
          </span>
          <button onClick={copyLink} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Share'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Video area */}
        <div className="flex flex-1 flex-col p-3 gap-3 min-h-0">
          <div ref={role === 'host' ? localVideoRef : remoteVideoRef}
            className="flex-1 rounded-2xl bg-card/40 border border-border/60 overflow-hidden relative min-h-0 flex items-center justify-center">
            {role === 'audience' && viewerCount === 0 && (
              <div className="flex flex-col items-center gap-2 text-center">
                <Radio className="h-10 w-10 text-muted-foreground/30 animate-pulse" />
                <p className="text-sm text-muted-foreground">Waiting for host to start stream…</p>
              </div>
            )}
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-2 py-1 text-xs text-white">
              {role === 'host' ? (screenSharing ? 'Screen Share' : 'Your Camera') : 'Host Stream'}
            </div>
          </div>
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div className="w-72 flex flex-col border-l border-border/60 bg-background/40">
            <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Live Chat</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {messages.map(m => (
                <div key={m.id}>
                  <p className="text-[11px] font-semibold text-primary">{m.sender} <span className="text-muted-foreground font-normal">{m.time}</span></p>
                  <p className="text-xs text-foreground">{m.text}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2 border-t border-border/60 p-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Type a message…"
                className="flex-1 h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-primary" />
              <button onClick={sendChat} className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
        <div className="flex gap-2">
          {role === 'host' && (<>
            <button onClick={async () => { await localTracksRef.current.audio?.setMuted(!audioMuted); setAudioMuted(v=>!v); }}
              className={cn('flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
                audioMuted ? 'border-destructive/40 bg-destructive/15 text-destructive' : 'border-border bg-muted/30 text-foreground hover:bg-muted')}>
              {audioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button onClick={async () => { await localTracksRef.current.video?.setMuted(!videoMuted); setVideoMuted(v=>!v); }}
              className={cn('flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
                videoMuted ? 'border-destructive/40 bg-destructive/15 text-destructive' : 'border-border bg-muted/30 text-foreground hover:bg-muted')}>
              {videoMuted ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </button>
            <button onClick={toggleScreenShare}
              className={cn('flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
                screenSharing ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-400' : 'border-border bg-muted/30 text-foreground hover:bg-muted')}>
              {screenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
            </button>
          </>)}
          <button onClick={() => setChatOpen(v=>!v)}
            className={cn('flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
              chatOpen ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-muted/30 text-foreground hover:bg-muted')}>
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
        <button onClick={endDemo}
          className="flex h-10 items-center gap-2 rounded-full bg-destructive px-4 text-sm font-semibold text-white hover:bg-destructive/90 transition-colors">
          <Users className="h-4 w-4" />
          {role === 'host' ? 'End Demo' : 'Leave'}
        </button>
      </div>
    </div>
  );
}

'use client';
/**
 * Feature 5 — Live Chat & Presence Detection
 * Agora RTM v2 channel messaging with presence tracking and typing indicators.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, Users, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import {
  loadChatHistory, saveChatMessage, buildChatPayload,
  buildTypingPayload, buildPresencePayload, parseRtmMessage,
  PRESENCE_COLORS, PRESENCE_LABELS,
  type ChatMessage, type PresenceStatus,
} from '@/lib/chatService';
import { cn } from '@/lib/utils';

type ChatPanelProps = {
  userName?: string;
  defaultChannel?: string;
  className?: string;
};

type ConnState = 'disconnected' | 'connecting' | 'connected' | 'error';

export function ChatPanel({ userName = 'Sales Rep', defaultChannel = '', className }: ChatPanelProps) {
  const [connState, setConnState]         = useState<ConnState>('disconnected');
  const [channelInput, setChannelInput]   = useState(defaultChannel);
  const [activeChannel, setActiveChannel] = useState('');
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [inputText, setInputText]         = useState('');
  const [onlineUsers, setOnlineUsers]     = useState<Map<string, string>>(new Map());
  const [remoteTyping, setRemoteTyping]   = useState<string | null>(null);
  const [myStatus, setMyStatus]           = useState<PresenceStatus>('online');
  const [error, setError]                 = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rtmRef         = useRef<any>(null);
  const uidRef         = useRef<string>('');
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef      = useRef<HTMLDivElement>(null);
  const channelRef     = useRef<string>('');

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, remoteTyping]);

  const handleMessage = useCallback((msgStr: string, publisherId: string) => {
    const payload = parseRtmMessage(msgStr);
    if (!payload) return;

    if (payload.type === 'chat' && payload.text) {
      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random()}`,
        channelOrPeer: channelRef.current,
        senderUid: publisherId,
        senderName: payload.senderName ?? publisherId,
        text: payload.text,
        timestamp: Date.now(),
        read: false,
      };
      setMessages(prev => [...prev, msg]);
      saveChatMessage(msg);
      setOnlineUsers(prev => new Map(prev).set(publisherId, payload.senderName ?? publisherId));
    }
    if (payload.type === 'typing') {
      setRemoteTyping(payload.senderName ?? publisherId);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setRemoteTyping(null), 3000);
    }
    if (payload.type === 'presence' && payload.status) {
      setOnlineUsers(prev => {
        const next = new Map(prev);
        if (payload.status === 'offline') next.delete(publisherId);
        else next.set(publisherId, payload.senderName ?? publisherId);
        return next;
      });
    }
  }, []);

  const connect = useCallback(async () => {
    const channel = channelInput.trim() || 'echosphere-chat';
    setError(null);
    setConnState('connecting');

    try {
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
      const uid   = `es-${Date.now()}`;
      uidRef.current     = uid;
      channelRef.current = channel;

      // ── Step 1: Fetch RTM token from server ───────────────────────────────
      // RTM v2 requires a token when App Certificate is enabled.
      // We fetch it from /api/rtm-token which calls buildTokenWithRtm.
      const tokenRes = await fetch(`/api/rtm-token?uid=${encodeURIComponent(uid)}`);
      if (!tokenRes.ok) throw new Error('Failed to fetch RTM token');
      const { token } = await tokenRes.json() as { token: string };

      const { default: AgoraRTM } = await import('agora-rtm');

      // ── Step 2: Create RTM client ─────────────────────────────────────────
      const rtm = new AgoraRTM.RTM(appId, uid);

      // Listen for messages BEFORE subscribing
      rtm.addEventListener('message', (event: { message: string | Uint8Array; publisher: string }) => {
        const raw    = event.message;
        const msgStr = typeof raw === 'string' ? raw : new TextDecoder().decode(raw as Uint8Array);
        handleMessage(msgStr, event.publisher);
      });

      // ── Step 3: Login WITH token ─────────────────────────────────────────
      await rtm.login({ token });

      // ── Step 4: Subscribe to channel ─────────────────────────────────────
      await rtm.subscribe(channel);

      rtmRef.current = rtm;
      setActiveChannel(channel);
      setMessages(loadChatHistory(channel));

      // Broadcast online presence
      await rtm.publish(channel, buildPresencePayload('online')).catch(() => {});
      setConnState('connected');
    } catch (err) {
      console.error('[ChatPanel] connect error:', err);
      setError(
        err instanceof Error ? err.message : 'Connection failed. Check browser console for details.',
      );
      setConnState('error');
    }
  }, [channelInput, handleMessage]);

  const disconnect = useCallback(async () => {
    if (rtmRef.current) {
      await rtmRef.current.publish(channelRef.current, buildPresencePayload('offline')).catch(() => {});
      await rtmRef.current.unsubscribe(channelRef.current).catch(() => {});
      await rtmRef.current.logout().catch(() => {});
      rtmRef.current = null;
    }
    setConnState('disconnected');
    setOnlineUsers(new Map());
    setRemoteTyping(null);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !rtmRef.current) return;
    setInputText('');

    // Optimistic local append
    const msg: ChatMessage = {
      id: `local-${Date.now()}`,
      channelOrPeer: channelRef.current,
      senderUid: uidRef.current,
      senderName: 'You',
      text,
      timestamp: Date.now(),
      read: true,
    };
    setMessages(prev => [...prev, msg]);
    saveChatMessage(msg);

    await rtmRef.current.publish(channelRef.current, buildChatPayload(userName, text)).catch((e: Error) => {
      console.error('[ChatPanel] send error:', e);
    });
  }, [inputText, userName]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
    // Typing indicator
    if (rtmRef.current && channelRef.current) {
      rtmRef.current.publish(channelRef.current, buildTypingPayload()).catch(() => {});
    }
  };

  const changeStatus = useCallback(async (status: PresenceStatus) => {
    setMyStatus(status);
    if (rtmRef.current && channelRef.current) {
      await rtmRef.current.publish(channelRef.current, buildPresencePayload(status)).catch(() => {});
    }
  }, []);

  useEffect(() => () => { disconnect(); }, [disconnect]);

  const isConnected = connState === 'connected';

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-2xl border border-border bg-card/30', className)}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-card/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Live Chat</h3>
          {isConnected && <span className="text-xs text-muted-foreground">· {activeChannel}</span>}
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" /> {onlineUsers.size}
              </span>
              {(['online', 'away', 'offline'] as PresenceStatus[]).map(s => (
                <button key={s} onClick={() => changeStatus(s)}
                  title={PRESENCE_LABELS[s]}
                  className={cn('h-2.5 w-2.5 rounded-full transition-all',
                    myStatus === s ? 'ring-2 ring-white/40 ring-offset-1 ring-offset-background' : 'opacity-50',
                    PRESENCE_COLORS[s],
                  )}
                />
              ))}
            </>
          )}
          <button
            onClick={isConnected ? disconnect : connect}
            disabled={connState === 'connecting'}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50',
              isConnected
                ? 'bg-destructive/15 text-destructive hover:bg-destructive/25'
                : 'bg-primary/15 text-primary hover:bg-primary/25',
            )}
          >
            {isConnected ? <><WifiOff className="h-3 w-3" />Leave</> :
             connState === 'connecting' ? 'Connecting…' :
             <><Wifi className="h-3 w-3" />Connect</>}
          </button>
        </div>
      </div>

      {/* ── Channel input (when disconnected) ─────────────────────────────── */}
      {!isConnected && (
        <div className="shrink-0 border-b border-border/60 px-4 py-3 space-y-2">
          <input
            value={channelInput}
            onChange={e => setChannelInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && connect()}
            placeholder="Channel name (e.g. sales-general)"
            className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary transition-colors"
          />
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
        style={{ minHeight: 0, maxHeight: '420px' }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/25" />
            <p className="text-xs text-muted-foreground/60">
              {isConnected ? 'No messages yet — say hello!' : 'Connect to start chatting'}
            </p>
          </div>
        )}

        {messages.map(msg => {
          const isOwn = msg.senderUid === uidRef.current || msg.senderName === 'You';
          return (
            <div key={msg.id} className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
              <div className={cn(
                'shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                isOwn ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400',
              )}>
                {msg.senderName.charAt(0).toUpperCase()}
              </div>
              <div className="max-w-[78%]">
                <p className={cn('text-[10px] font-semibold mb-0.5',
                  isOwn ? 'text-right text-indigo-400' : 'text-emerald-400')}>
                  {msg.senderName}
                </p>
                <div className={cn('rounded-xl px-3 py-2 text-xs leading-relaxed',
                  isOwn
                    ? 'rounded-tr-sm bg-indigo-500/15 text-slate-100'
                    : 'rounded-tl-sm bg-card/60 border border-border/60 text-slate-200',
                )}>
                  {msg.text}
                </div>
                <p className={cn('mt-0.5 text-[10px] text-muted-foreground/40', isOwn ? 'text-right' : '')}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}

        {remoteTyping && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 rounded-xl rounded-tl-sm bg-card/60 border border-border/60 px-3 py-2">
              {[0, 1, 2].map(i => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">{remoteTyping} is typing</span>
          </div>
        )}
      </div>

      {/* ── Input bar ─────────────────────────────────────────────────────── */}
      <div className={cn('shrink-0 border-t border-border/60 p-3', !isConnected && 'opacity-40 pointer-events-none')}>
        <div className="flex gap-2">
          <input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? 'Type a message…' : 'Connect first'}
            className="flex-1 h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || !isConnected}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-30 transition-colors active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Footer info ───────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border/60 px-3 py-1.5">
        <p className="text-[10px] text-muted-foreground/40 text-center">
          Powered by Agora RTM · End-to-end encrypted
        </p>
      </div>
    </div>
  );
}

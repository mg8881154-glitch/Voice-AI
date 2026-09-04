'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MessageSquare, Mic } from 'lucide-react';
import { stripShowImageTag } from '@/lib/useImageTrigger';

type TranscriptMessage = {
  turn_id?: string | number;
  uid: number;
  text?: string;
  createdAt?: number;
};

type QuickstartTranscriptPanelProps = {
  messageList: TranscriptMessage[];
  currentInProgressMessage: TranscriptMessage | null;
  agentUID: string;
};

function formatMessageTime(createdAt?: number) {
  if (!createdAt) return null;
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(createdAt));
}

export function QuickstartTranscriptPanel({
  messageList,
  currentInProgressMessage,
  agentUID,
}: QuickstartTranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = useMemo(
    () =>
      currentInProgressMessage
        ? [...messageList, currentInProgressMessage]
        : messageList,
    [currentInProgressMessage, messageList],
  );

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages]);

  return (
    <section
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/20 backdrop-blur-sm"
      aria-label="Transcription panel"
    >
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-4">
        <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
        <div>
          <h2 className="text-xs font-semibold text-foreground leading-none">Transcript</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Live voice turns</p>
        </div>
        {/* Live indicator */}
        {currentInProgressMessage && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-medium text-emerald-400">Live</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-muted/30">
              <Mic className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground/60 max-w-[160px] leading-relaxed">
              Start speaking — your conversation will appear here
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isAgent = String(message.uid) === agentUID;
            // Strip [SHOW_IMAGE: ...] tags — those trigger the image card,
            // they should not appear as raw text in the chat bubble.
            const text = stripShowImageTag(message.text?.trim() ?? '');
            const time = formatMessageTime(message.createdAt);
            const isStreaming = message === currentInProgressMessage;

            return (
              <article
                key={`${message.turn_id ?? message.uid}-${index}`}
                className={`flex flex-col gap-1 ${isAgent ? 'items-start' : 'items-end'}`}
              >
                {/* Speaker + time */}
                <div className={`flex items-center gap-1.5 px-1 ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Avatar dot */}
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold
                      ${isAgent
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                      }`}
                  >
                    {isAgent ? 'N' : 'Y'}
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {isAgent ? 'Nova' : 'You'}
                  </span>
                  {time && (
                    <span className="text-[10px] text-muted-foreground/50">{time}</span>
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-relaxed
                    ${isAgent
                      ? 'rounded-tl-sm border border-indigo-500/20 bg-indigo-500/8 text-slate-200'
                      : 'rounded-tr-sm border border-emerald-500/20 bg-emerald-500/8 text-slate-200'
                    }
                    ${isStreaming ? 'opacity-80' : ''}
                  `}
                >
                  {text || (
                    // Typing indicator for in-progress turns
                    <span className="flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="inline-block h-1 w-1 animate-bounce rounded-full bg-current opacity-60"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

'use client';

import { type AgentState } from 'agora-agent-client-toolkit';
import { cn } from '@/lib/utils';

type AgentStatusBadgeProps = {
  agentState: AgentState | null;
  isAgentConnected: boolean;
  connectionState: string;
  className?: string;
};

type StatusConfig = {
  label: string;
  dotClass: string;
  textClass: string;
  ping: boolean;
};

function getStatus(
  agentState: AgentState | null,
  isAgentConnected: boolean,
  connectionState: string,
): StatusConfig {
  if (connectionState === 'DISCONNECTED' || connectionState === 'DISCONNECTING') {
    return { label: 'Disconnected', dotClass: 'bg-red-500', textClass: 'text-red-400', ping: false };
  }
  if (connectionState === 'CONNECTING' || connectionState === 'RECONNECTING') {
    return { label: 'Connecting…', dotClass: 'bg-amber-400', textClass: 'text-amber-400', ping: true };
  }
  if (!isAgentConnected) {
    return { label: 'Waiting for agent…', dotClass: 'bg-amber-400', textClass: 'text-amber-400', ping: true };
  }
  switch (agentState) {
    case 'listening':
      return { label: 'Listening', dotClass: 'bg-emerald-400', textClass: 'text-emerald-400', ping: true };
    case 'thinking':
      return { label: 'Thinking…', dotClass: 'bg-indigo-400', textClass: 'text-indigo-300', ping: true };
    case 'speaking':
      return { label: 'Speaking', dotClass: 'bg-violet-400', textClass: 'text-violet-300', ping: true };
    case 'idle':
    case 'silent':
    default:
      return { label: 'Ready', dotClass: 'bg-emerald-500/60', textClass: 'text-muted-foreground', ping: false };
  }
}

export function AgentStatusBadge({
  agentState,
  isAgentConnected,
  connectionState,
  className,
}: AgentStatusBadgeProps) {
  const { label, dotClass, textClass, ping } = getStatus(agentState, isAgentConnected, connectionState);

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 backdrop-blur-sm',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={`Agent status: ${label}`}
    >
      {/* Animated dot */}
      <span className="relative flex h-2 w-2">
        {ping && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              dotClass,
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', dotClass)} />
      </span>

      {/* Label */}
      <span className={cn('text-xs font-semibold tracking-wide', textClass)}>
        Nova · {label}
      </span>
    </div>
  );
}

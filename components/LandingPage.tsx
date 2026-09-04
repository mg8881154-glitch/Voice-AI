'use client';

import { useState, useRef, Suspense, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { RTMClient } from 'agora-rtm';
import type {
  AgoraTokenData,
  ClientStartRequest,
  AgentResponse,
  AgoraRenewalTokens,
} from '../types/conversation';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSkeleton } from './LoadingSkeleton';
import { LeadProvider, useLeadStore } from '@/lib/LeadContext';
import { pushLeadToCrm, resetCrmSession } from '@/lib/crmService';
import { EchoSpherePreCallCard } from './EchoSpherePreCallCard';

// Dynamically import the ConversationComponent with ssr disabled
const ConversationComponent = dynamic(() => import('./ConversationComponent'), {
  ssr: false,
});

// Dynamically import AgoraRTCProvider (browser-only).
const AgoraProvider = dynamic(
  async () => {
    const { AgoraRTCProvider, default: AgoraRTC } = await import('agora-rtc-react');
    return {
      default: function AgoraProviders({ children }: { children: React.ReactNode }) {
        const clientRef = useRef<ReturnType<typeof AgoraRTC.createClient> | null>(null);
        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        }
        return (
          <AgoraRTCProvider client={clientRef.current}>{children}</AgoraRTCProvider>
        );
      },
    };
  },
  { ssr: false },
);

// ─── Inner session component — has access to LeadContext ─────────────────────
// LandingPage is the LeadProvider, so it can't call useLeadStore itself.
// This inner component sits inside the provider and handles the CRM push.

type SessionProps = {
  onStart: () => Promise<void>;
  onEnd: () => Promise<void>;
  onTokenWillExpire: (uid: string) => Promise<AgoraRenewalTokens>;
  isLoading: boolean;
  error: string | null;
  agoraData: AgoraTokenData | null;
  rtmClient: RTMClient | null;
  agentJoinError: boolean;
  showConversation: boolean;
};

function Session({
  onStart,
  onEnd,
  onTokenWillExpire,
  isLoading,
  error,
  agoraData,
  rtmClient,
  agentJoinError,
  showConversation,
}: SessionProps) {
  const { lead } = useLeadStore();

  // Push lead to CRM whenever the conversation ends
  const handleEnd = useCallback(async () => {
    // Fire-and-forget — don't block the UI teardown
    pushLeadToCrm(lead, agoraData?.channel).catch((err) =>
      console.error('[CRM] Failed to push lead:', err),
    );
    resetCrmSession();
    await onEnd();
  }, [lead, agoraData, onEnd]);

  return (
    <div className="relative flex h-dvh min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div
        className={`flex min-h-0 flex-1 flex-col ${
          showConversation ? 'items-stretch justify-start' : 'items-center justify-center'
        }`}
      >
        <div
          className={`z-10 flex min-h-0 flex-1 flex-col ${
            showConversation
              ? 'h-full w-full max-w-none items-stretch gap-0 px-0 text-left'
              : 'w-full max-w-none items-center justify-center px-4 text-center'
          }`}
        >
          {!showConversation ? (
            <EchoSpherePreCallCard
              isLoading={isLoading}
              error={error}
              onStartConversation={onStart}
            />
          ) : agoraData && rtmClient ? (
            <>
              {agentJoinError && (
                <div className="p-3 bg-destructive/10 rounded-md text-destructive text-sm max-w-sm mx-auto mt-4">
                  Failed to connect with AI agent. The conversation may not work as expected.
                </div>
              )}
              <Suspense fallback={<LoadingSkeleton />}>
                <ErrorBoundary>
                  <AgoraProvider>
                    <ConversationComponent
                      agoraData={agoraData}
                      rtmClient={rtmClient}
                      onTokenWillExpire={onTokenWillExpire}
                      onEndConversation={handleEnd}
                    />
                  </AgoraProvider>
                </ErrorBoundary>
              </Suspense>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Failed to load conversation data.</p>
          )}
        </div>
      </div>

      {!showConversation && (
        <footer className="fixed bottom-0 right-0 z-40 py-3 pr-4">
          <p className="text-[10px] text-muted-foreground/40">Powered by Agora Conversational AI</p>
        </footer>
      )}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const [showConversation, setShowConversation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agoraData, setAgoraData] = useState<AgoraTokenData | null>(null);
  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null);
  const [agentJoinError, setAgentJoinError] = useState(false);

  // Preload heavy modules on mount
  useEffect(() => {
    import('agora-rtc-react').catch(() => {});
    import('agora-rtm').catch(() => {});
  }, []);

  const handleStartConversation = async () => {
    setIsLoading(true);
    setError(null);
    setAgentJoinError(false);

    try {
      const agoraResponse = await fetch('/api/generate-agora-token');
      const responseData = await agoraResponse.json();

      if (!agoraResponse.ok) {
        throw new Error(`Failed to generate Agora token: ${JSON.stringify(responseData)}`);
      }

      const [agentData, rtm] = await Promise.all([
        fetch('/api/invite-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requester_id: responseData.uid,
            channel_name: responseData.channel,
          } as ClientStartRequest),
        })
          .then(async (res) => {
            if (!res.ok) { setAgentJoinError(true); return null; }
            return res.json() as Promise<AgentResponse>;
          })
          .catch((err) => {
            console.error('Failed to start conversation with agent:', err);
            setAgentJoinError(true);
            return null;
          }),

        (async () => {
          const { default: AgoraRTM } = await import('agora-rtm');
          const rtm: RTMClient = new AgoraRTM.RTM(
            process.env.NEXT_PUBLIC_AGORA_APP_ID!,
            responseData.uid,
          );
          await rtm.login({ token: responseData.token });
          await rtm.subscribe(responseData.channel);
          return rtm;
        })(),
      ]);

      setRtmClient(rtm);
      setAgoraData({ ...responseData, agentId: agentData?.agent_id });
      setShowConversation(true);
    } catch (err) {
      setError('Failed to start conversation. Please try again.');
      console.error('Error starting conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenWillExpire = useCallback(
    async (uid: string): Promise<AgoraRenewalTokens> => {
      try {
        const channel = agoraData?.channel;
        if (!channel) throw new Error('Missing channel for token renewal');

        const [rtcResponse, rtmResponse] = await Promise.all([
          fetch(`/api/generate-agora-token?channel=${channel}&uid=${uid}`),
          fetch(`/api/generate-agora-token?channel=${channel}&uid=${agoraData!.uid}`),
        ]);
        const [rtcData, rtmData] = await Promise.all([
          rtcResponse.json(),
          rtmResponse.json(),
        ]);

        if (!rtcResponse.ok || !rtmResponse.ok) throw new Error('Failed to generate renewal tokens');
        return { rtcToken: rtcData.token, rtmToken: rtmData.token };
      } catch (error) {
        console.error('Error renewing token:', error);
        throw error;
      }
    },
    [agoraData],
  );

  const handleEndConversation = async () => {
    if (agoraData?.agentId) {
      try {
        const response = await fetch('/api/stop-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: agoraData.agentId }),
        });
        if (!response.ok) console.error('Failed to stop agent:', await response.text());
      } catch (err) {
        console.error('Error stopping agent:', err);
      }
    }
    rtmClient?.logout().catch((err) => console.error('RTM logout error:', err));
    setRtmClient(null);
    setShowConversation(false);
  };

  return (
    // LeadProvider wraps everything — all child components share the same lead state.
    <LeadProvider>
      <Session
        onStart={handleStartConversation}
        onEnd={handleEndConversation}
        onTokenWillExpire={handleTokenWillExpire}
        isLoading={isLoading}
        error={error}
        agoraData={agoraData}
        rtmClient={rtmClient}
        agentJoinError={agentJoinError}
        showConversation={showConversation}
      />
    </LeadProvider>
  );
}

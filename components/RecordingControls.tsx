'use client';
/**
 * Feature 6 — Sales Call Recording
 * Controls for starting/stopping Agora Cloud Recording.
 * Shows recording duration, status, and file list after stop.
 */

import { useState, useEffect, useRef } from 'react';
import { Circle, Square, Download, HardDrive, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { RecordingSession } from '@/app/api/recording/start/route';
import type { RecordingStopResult } from '@/app/api/recording/stop/route';
import { cn } from '@/lib/utils';

type RecordingState = 'idle' | 'starting' | 'recording' | 'stopping' | 'stopped' | 'error';

type RecordingControlsProps = {
  channelName: string;
  uid?: string;
  className?: string;
};

export function RecordingControls({ channelName, uid = '1', className }: RecordingControlsProps) {
  const [recState, setRecState]     = useState<RecordingState>('idle');
  const [session, setSession]       = useState<RecordingSession | null>(null);
  const [stopResult, setStopResult] = useState<RecordingStopResult | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [duration, setDuration]     = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (recState === 'recording') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recState]);

  const formatDur = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const startRecording = async () => {
    if (!channelName) return;
    setError(null);
    setRecState('starting');
    try {
      const res = await fetch('/api/recording/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName, uid }),
      });
      const data = await res.json() as RecordingSession & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Start failed');
      setSession(data);
      setDuration(0);
      setRecState('recording');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setRecState('error');
    }
  };

  const stopRecording = async () => {
    if (!session) return;
    setRecState('stopping');
    try {
      const res = await fetch('/api/recording/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: session.resourceId,
          sid: session.sid,
          channelName: session.channelName,
          uid,
        }),
      });
      const data = await res.json() as RecordingStopResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Stop failed');
      setStopResult(data);
      setRecState('stopped');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      setRecState('error');
    }
  };

  return (
    <div className={cn('flex flex-col rounded-2xl border border-border bg-card/30 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-4 py-3">
        <HardDrive className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Call Recording</h3>
        {recState === 'recording' && (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-red-400">
            <Circle className="h-2.5 w-2.5 fill-red-400 animate-pulse" />
            REC {formatDur(duration)}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Channel info */}
        <div className="rounded-xl border border-border bg-background/50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Recording Channel</p>
          <p className="text-sm font-medium text-foreground font-mono">{channelName || '—'}</p>
        </div>

        {/* Status */}
        {recState === 'idle' && (
          <p className="text-xs text-muted-foreground text-center">
            Recording will be saved to S3 when credentials are configured.
          </p>
        )}
        {recState === 'starting' && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-foreground">Starting recording…</p>
          </div>
        )}
        {recState === 'stopping' && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
            <p className="text-sm text-foreground">Stopping and uploading…</p>
          </div>
        )}
        {recState === 'recording' && session && (
          <div className="space-y-1.5">
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
              <p className="text-xs font-semibold text-red-400">Recording in progress</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Session ID: <span className="font-mono">{session.sid.slice(0, 16)}…</span>
              </p>
            </div>
          </div>
        )}
        {recState === 'stopped' && stopResult && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-400">Recording saved</p>
                <p className="text-[10px] text-muted-foreground">Duration: {formatDur(duration)}</p>
              </div>
            </div>
            {stopResult.serverResponse?.fileList?.map(f => (
              <div key={f.fileName} className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-foreground truncate max-w-[180px]">{f.fileName}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{f.trackType.replace(/_/g,' ')}</p>
                </div>
                <button className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-primary transition-colors" aria-label="Download">
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {(recState === 'error') && error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Action button */}
        {(recState === 'idle' || recState === 'error' || recState === 'stopped') && (
          <button
            onClick={startRecording}
            disabled={!channelName}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 transition-colors active:scale-[0.98]"
          >
            <Circle className="h-4 w-4 fill-white" />
            Start Recording
          </button>
        )}
        {recState === 'recording' && (
          <button
            onClick={stopRecording}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive bg-destructive/10 py-3 text-sm font-semibold text-destructive hover:bg-destructive/20 transition-colors active:scale-[0.98]"
          >
            <Square className="h-4 w-4 fill-current" />
            Stop Recording
          </button>
        )}

        <p className="text-center text-[10px] text-muted-foreground/50">
          Set NEXT_AGORA_CUSTOMER_ID + NEXT_AWS_S3_BUCKET for live S3 upload
        </p>
      </div>
    </div>
  );
}

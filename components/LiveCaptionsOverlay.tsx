'use client';
/**
 * Feature 4 — Real-Time Call Transcription
 *
 * Renders a live captions overlay and a full scrollable transcript log.
 * Works as a standalone panel or overlay on top of any call view.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Mic, MicOff, Download, Trash2, Radio } from 'lucide-react';
import {
  activeTranscriptionAdapter,
  formatTranscriptTime,
  type TranscriptLine,
} from '@/lib/transcriptionService';
import { cn } from '@/lib/utils';

type LiveCaptionsOverlayProps = {
  /** Show as floating overlay (true) or panel (false) */
  overlay?: boolean;
  className?: string;
};

export function LiveCaptionsOverlay({ overlay = false, className }: LiveCaptionsOverlayProps) {
  const [isListening, setIsListening]     = useState(false);
  const [lines, setLines]                 = useState<TranscriptLine[]>([]);
  const [currentPartial, setCurrentPartial] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new lines
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines, currentPartial]);

  const handleLine = useCallback((line: TranscriptLine) => {
    if (line.isFinal) {
      setLines(prev => {
        // Replace last partial with final, or append
        const last = prev[prev.length - 1];
        if (last && !last.isFinal && last.speaker === line.speaker) {
          return [...prev.slice(0, -1), line];
        }
        return [...prev, line];
      });
      setCurrentPartial('');
    } else {
      setCurrentPartial(line.text);
    }
  }, []);

  const startTranscription = useCallback(() => {
    activeTranscriptionAdapter.start(handleLine);
    setIsListening(true);
  }, [handleLine]);

  const stopTranscription = useCallback(() => {
    activeTranscriptionAdapter.stop();
    setIsListening(false);
    setCurrentPartial('');
  }, []);

  const clearTranscript = () => { setLines([]); setCurrentPartial(''); };

  const downloadTranscript = () => {
    const text = lines
      .map(l => `[${formatTranscriptTime(l.timestamp)}] ${l.speaker === 'local' ? 'You' : 'Remote'}: ${l.text}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `transcript-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const containerCls = overlay
    ? 'fixed bottom-4 left-4 z-40 w-80 rounded-2xl border border-border/60 bg-black/80 backdrop-blur-md shadow-2xl'
    : 'flex flex-col rounded-2xl border border-border bg-card/30 h-full';

  return (
    <div className={cn(containerCls, className)}>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Live Transcription</h3>
          {isListening && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-red-400">
              <Radio className="h-3 w-3 animate-pulse" /> LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={downloadTranscript} disabled={lines.length === 0}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            aria-label="Download transcript">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={clearTranscript} disabled={lines.length === 0}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
            aria-label="Clear transcript">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={isListening ? stopTranscription : startTranscription}
            className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
              isListening
                ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                : 'bg-primary/15 text-primary hover:bg-primary/25',
            )}>
            {isListening ? <><MicOff className="h-3 w-3" />Stop</> : <><Mic className="h-3 w-3" />Start</>}
          </button>
        </div>
      </div>

      {/* Transcript lines */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 max-h-80">
        {lines.length === 0 && !currentPartial && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Mic className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground/60">
              {isListening ? 'Listening… start speaking' : 'Click Start to begin transcription'}
            </p>
          </div>
        )}

        {lines.map(line => (
          <div key={line.id} className={cn('flex gap-2', line.speaker === 'local' ? 'flex-row-reverse' : 'flex-row')}>
            <div className={cn('shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
              line.speaker === 'local'
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-emerald-500/20 text-emerald-400',
            )}>
              {line.speaker === 'local' ? 'Y' : 'R'}
            </div>
            <div className={cn('max-w-[80%] rounded-xl px-2.5 py-1.5 text-xs',
              line.speaker === 'local'
                ? 'bg-indigo-500/10 text-slate-200 rounded-tr-sm'
                : 'bg-emerald-500/10 text-slate-200 rounded-tl-sm',
            )}>
              <p className="leading-relaxed">{line.text}</p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">{formatTranscriptTime(line.timestamp)}</p>
            </div>
          </div>
        ))}

        {/* Current partial */}
        {currentPartial && (
          <div className="flex flex-row-reverse gap-2">
            <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">Y</div>
            <div className="max-w-[80%] rounded-xl rounded-tr-sm bg-indigo-500/10 px-2.5 py-1.5 text-xs text-slate-300/60 italic">
              {currentPartial}…
            </div>
          </div>
        )}
      </div>

      {/* Browser support notice */}
      <div className="shrink-0 border-t border-border/60 px-3 py-2">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          Powered by Web Speech API · Chrome/Edge recommended
        </p>
      </div>
    </div>
  );
}

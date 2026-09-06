'use client';

import { TrendingUp, AlertTriangle, Sparkles, Lightbulb } from 'lucide-react';
import { SentimentAnalysis } from '@/lib/useSentimentAnalyzer';
import { cn } from '@/lib/utils';

interface LiveSentimentWidgetProps {
  sentiment: SentimentAnalysis;
  className?: string;
}

export function LiveSentimentWidget({ sentiment, className }: LiveSentimentWidgetProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-2xl border border-white/10 glass-panel p-3 shadow-lg transition-all',
        className
      )}
    >
      {/* Top Header: Emoji + Tone + Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{sentiment.emoji}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white leading-none">{sentiment.label}</span>
              <span className={cn('h-1.5 w-1.5 rounded-full animate-ping', sentiment.color)} />
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Real-Time NLP Tone Tracking</p>
          </div>
        </div>

        {/* Meter Pill */}
        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2.5 py-1 rounded-full">
          <span className="text-[10px] font-bold text-slate-400">Score</span>
          <span className={cn('text-xs font-mono font-extrabold', sentiment.textColor)}>
            {sentiment.score}%
          </span>
        </div>
      </div>

      {/* Visual Sentiment Spectrum Bar */}
      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
        <div
          className={cn('h-full transition-all duration-500 rounded-full', sentiment.color)}
          style={{ width: `${sentiment.score}%` }}
        />
      </div>

      {/* Live AI Coaching Suggestion */}
      <div className="flex items-start gap-2 rounded-xl bg-white/5 border border-white/5 px-2.5 py-1.5 text-[11px]">
        <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-slate-300 leading-snug">
          <strong className="text-white">AI Coach:</strong> {sentiment.coachingTip}
        </p>
      </div>
    </div>
  );
}

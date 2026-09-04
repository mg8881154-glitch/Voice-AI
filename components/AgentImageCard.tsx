'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ImageOff, Loader2 } from 'lucide-react';
import type { DisplayImage } from '@/lib/useImageTrigger';
import { cn } from '@/lib/utils';

type AgentImageCardProps = {
  image: DisplayImage;
  onDismiss: () => void;
  className?: string;
};

export function AgentImageCard({ image, onDismiss, className }: AgentImageCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Derive display values from whichever image type is active
  const isLoading = image.kind === 'loading';

  const imageUrl =
    image.kind === 'dynamic'
      ? image.result.imageUrl
      : image.kind === 'static'
      ? image.trigger.imageUrl
      : null;

  const thumbUrl =
    image.kind === 'dynamic'
      ? image.result.thumbUrl
      : image.kind === 'static'
      ? image.trigger.thumbUrl
      : null;

  const title =
    image.kind === 'dynamic'
      ? (image.result.title || image.query)
      : image.kind === 'static'
      ? image.trigger.title
      : image.query;

  const description =
    image.kind === 'dynamic'
      ? image.result.description
      : image.kind === 'static'
      ? image.trigger.description
      : 'Searching…';

  const credit =
    image.kind === 'dynamic' ? image.result.credit : null;

  const creditUrl =
    image.kind === 'dynamic' ? image.result.creditUrl : null;

  return (
    <div
      className={cn(
        'animate-fade-up relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl',
        className,
      )}
      style={{
        background:
          'linear-gradient(160deg, rgba(25,25,45,0.97) 0%, rgba(15,15,30,0.99) 100%)',
        backdropFilter: 'blur(16px)',
      }}
      role="img"
      aria-label={title}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {!isLoading && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
            )}
            <span
              className={cn(
                'relative inline-flex h-2 w-2 rounded-full',
                isLoading ? 'bg-amber-400 animate-pulse' : 'bg-indigo-400',
              )}
            />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-300/80">
            {isLoading ? 'Searching image…' : 'Nova is showing you'}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-lg p-1 text-white/30 hover:bg-white/10 hover:text-white/80 transition-colors"
          aria-label="Dismiss image"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Image area ──────────────────────────────────────────────────────── */}
      <div
        className="relative mx-3 overflow-hidden rounded-xl bg-white/5"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/5">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <span className="text-xs font-medium text-indigo-300/70">
              Finding &quot;{image.query}&quot;…
            </span>
          </div>
        )}

        {/* Blur placeholder while full image loads */}
        {!isLoading && !imgLoaded && !imgError && thumbUrl && (
          <Image
            src={thumbUrl}
            alt=""
            fill
            sizes="80px"
            aria-hidden={true}
            className="object-cover blur-xl scale-110"
            unoptimized
          />
        )}

        {/* Error state */}
        {!isLoading && imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/5">
            <ImageOff className="h-8 w-8 text-white/20" />
            <span className="text-xs text-white/30">Image unavailable</span>
          </div>
        )}

        {/* Full image */}
        {!isLoading && imageUrl && !imgError && (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 384px"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={cn(
              'object-cover transition-opacity duration-500',
              imgLoaded ? 'opacity-100' : 'opacity-0',
            )}
            unoptimized
          />
        )}

        {/* Gradient overlay */}
        {!isLoading && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        )}
      </div>

      {/* ── Text content ────────────────────────────────────────────────────── */}
      <div className="px-4 pb-3 pt-2.5">
        <h3 className="text-sm font-bold capitalize text-white leading-tight">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-white/55">
            {description}
          </p>
        )}
        {credit && creditUrl && (
          <a
            href={creditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block text-[10px] text-white/30 hover:text-white/50 transition-colors"
          >
            Photo by {credit} · Unsplash
          </a>
        )}
      </div>

      {/* ── Auto-dismiss progress bar ────────────────────────────────────────── */}
      {!isLoading && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full overflow-hidden bg-white/10">
          <div
            className="h-full rounded-full bg-indigo-400/60"
            style={{ animation: 'shrink-bar 12s linear forwards' }}
          />
        </div>
      )}

      <style>{`
        @keyframes shrink-bar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Video,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  BookOpen,
  Sparkles,
  Settings2,
  X,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getActiveRagDocuments } from '@/lib/ragStore';
import { getActivePersona, getActiveVoice } from '@/lib/personaStore';
import { cn } from '@/lib/utils';

interface PreSessionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionType?: 'voice' | 'video' | 'demo';
  channelName?: string;
}

export function PreSessionPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  sessionType = 'voice',
  channelName = 'echosphere-sales',
}: PreSessionPreviewModalProps) {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [micActive, setMicActive] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [activePersona, setActivePersona] = useState(getActivePersona());
  const [activeVoice, setActiveVoice] = useState(getActiveVoice());
  const [activeDocsCount, setActiveDocsCount] = useState<number>(0);

  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize checks when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Refresh store values
    setActivePersona(getActivePersona());
    setActiveVoice(getActiveVoice());
    setActiveDocsCount(getActiveRagDocuments().length);

    // Audio test
    let isCancelled = false;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        audioStreamRef.current = stream;
        setMicActive(true);
        setMicError(null);

        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
          if (isCancelled) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };

        animFrameRef.current = requestAnimationFrame(updateLevel);
      } catch (err) {
        if (!isCancelled) {
          setMicActive(false);
          setMicError('Microphone permission required or device unavailable');
        }
      }
    }

    initAudio();

    // Camera test if video call
    if (sessionType === 'video') {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((vStream) => {
          if (!isCancelled && videoRef.current) {
            videoRef.current.srcObject = vStream;
            setCameraActive(true);
          }
        })
        .catch(() => {
          if (!isCancelled) setCameraActive(false);
        });
    }

    return () => {
      isCancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const vStream = videoRef.current.srcObject as MediaStream;
        vStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, sessionType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-xl z-10 animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Pre-Flight System Check
              </h3>
              <p className="text-xs text-slate-400">
                Verifying audio hardware, active AI persona, and RAG knowledge base
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Audio Input Check */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-xs font-semibold text-white">
                <Mic className="h-4 w-4 text-indigo-400" />
                Microphone Hardware Check
              </span>
              {micActive ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Ready
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Checking…
                </span>
              )}
            </div>

            {/* Live Audio Meter */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Input Level:</span>
                <span>{audioLevel}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-black/60 overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-violet-500 transition-all duration-75"
                  style={{ width: `${Math.max(5, audioLevel)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 italic">
                Speak to test voice activity detection (VAD).
              </p>
            </div>
            {micError && (
              <p className="text-xs text-rose-400 mt-2">{micError}</p>
            )}
          </div>

          {/* Video Preview if sessionType == 'video' */}
          {sessionType === 'video' && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Video className="h-4 w-4 text-blue-400" />
                  Camera Preview
                </span>
                <span className="text-[11px] font-bold text-emerald-400">
                  {cameraActive ? 'Online' : 'Loading…'}
                </span>
              </div>
              <div className="relative h-36 w-full rounded-xl overflow-hidden bg-black/70 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          {/* AI Persona & Voice Config */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
                <span>Active Voice</span>
              </div>
              <p className="text-sm font-bold text-white truncate">
                {activeVoice.name}
              </p>
              <p className="text-[10px] text-slate-400">{activeVoice.accent} • {activeVoice.gender}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Settings2 className="h-3.5 w-3.5 text-violet-400" />
                <span>Sales Persona</span>
              </div>
              <p className="text-sm font-bold text-white truncate">
                {activePersona.name}
              </p>
              <p className="text-[10px] text-slate-400">{activePersona.tagline}</p>
            </div>
          </div>

          {/* RAG Knowledge Base Status */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Dynamic RAG Grounding</p>
                <p className="text-[11px] text-slate-400">
                  {activeDocsCount > 0
                    ? `${activeDocsCount} active document${activeDocsCount > 1 ? 's' : ''} loaded in context`
                    : 'Standard enterprise knowledge base'}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              SYNCHRONIZED
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="flex-1 rounded-xl text-xs font-bold gap-2 text-white shadow-xl shadow-indigo-500/25"
            style={{
              background:
                'linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(258 90% 66%) 100%)',
            }}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Launch Session
          </Button>
        </div>
      </div>
    </div>
  );
}

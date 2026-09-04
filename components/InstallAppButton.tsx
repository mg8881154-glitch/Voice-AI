'use client';

import { useState, useEffect } from 'react';
import { Download, Monitor, Smartphone, CheckCircle, Info, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker for PWA compliance
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('[PWA] Service Worker registered:', reg.scope))
        .catch((err) => console.warn('[PWA] Service Worker registration failed:', err));
    } else if ('serviceWorker' in navigator) {
      // In dev mode, register as well to enable installability testing
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {});
    }

    // 2. Check if already running in standalone mode (installed app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 3. Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('[PWA] App successfully installed!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // If browser hasn't fired beforeinstallprompt yet (or iOS / specific browser), show quick guide
      setShowGuide(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
        <CheckCircle className="h-3.5 w-3.5" />
        EchoSphere App Installed
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="group relative flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-2.5 px-4 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-white transition-all shadow-sm active:scale-[0.99]"
        title="Install EchoSphere on Android or Windows"
      >
        <Download className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
        <span>Install App</span>
        <span className="flex items-center gap-1 text-[10px] text-indigo-400/80 bg-indigo-500/20 px-1.5 py-0.5 rounded">
          <Smartphone className="h-3 w-3" /> Android &middot; <Monitor className="h-3 w-3" /> Windows
        </span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#16162a] p-5 shadow-2xl text-left">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-3">
              <Info className="h-4 w-4" />
              How to Install EchoSphere App
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="rounded-lg border border-white/8 bg-white/5 p-2.5">
                <p className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                  Android (Chrome / Edge)
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Tap <strong>⋮</strong> (browser menu) at top right &rarr; Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                </p>
              </div>

              <div className="rounded-lg border border-white/8 bg-white/5 p-2.5">
                <p className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <Monitor className="h-3.5 w-3.5 text-indigo-400" />
                  Windows (Chrome / Edge)
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Look at the top URL address bar &rarr; Click the <strong>Install app</strong> icon (⊕) or menu <strong>&quot;Apps &rarr; Install EchoSphere&quot;</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-center text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

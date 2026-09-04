/**
 * Real-Time Transcription Service
 *
 * Uses the browser's built-in Web Speech API.
 * Works in Chrome, Edge. Falls back to mock in Firefox/Safari.
 */

export type TranscriptLine = {
  id: string;
  speaker: 'local' | 'remote';
  text: string;
  isFinal: boolean;
  timestamp: number;
};

export type TranscriptCallback = (line: TranscriptLine) => void;

export interface TranscriptionAdapter {
  name: string;
  supported: boolean;
  start(onLine: TranscriptCallback): void;
  stop(): void;
}

// ─── Web Speech API ───────────────────────────────────────────────────────────

function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let recognitionInstance: any = null;

export const webSpeechAdapter: TranscriptionAdapter = {
  name: 'Web Speech API',
  get supported() { return isSpeechRecognitionSupported(); },

  start(onLine: TranscriptCallback) {
    if (!isSpeechRecognitionSupported()) {
      console.warn('[Transcription] Web Speech API not supported — use Chrome or Edge');
      // Emit a notice line so the UI isn't blank
      onLine({
        id: 'unsupported',
        speaker: 'local',
        text: '⚠️ Web Speech API is not supported in this browser. Please use Chrome or Edge.',
        isFinal: true,
        timestamp: Date.now(),
      });
      return;
    }

    const w = window as unknown as Record<string, new () => unknown>;
    const SpeechRecognition = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start(): void;
      stop(): void;
      onresult: ((e: { results: SpeechRecognitionResultList; resultIndex: number }) => void) | null;
      onerror: ((e: { error: string }) => void) | null;
      onend: (() => void) | null;
    };

    const recognition = new SpeechRecognition();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = 'en-US';

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        onLine({
          id: `${Date.now()}-${i}`,
          speaker: 'local',
          text: result[0].transcript,
          isFinal: result.isFinal,
          timestamp: Date.now(),
        });
      }
    };

    recognition.onerror = (e) => {
      console.warn('[Transcription] SpeechRecognition error:', e.error);
    };

    // Auto-restart if it stops (some browsers stop after silence)
    recognition.onend = () => {
      if (recognitionInstance === recognition) {
        try { recognition.start(); } catch { /* already stopping */ }
      }
    };

    recognition.start();
    recognitionInstance = recognition;
  },

  stop() {
    if (recognitionInstance) {
      recognitionInstance.onend = null; // prevent auto-restart
      recognitionInstance.stop();
      recognitionInstance = null;
    }
  },
};

// ─── Mock adapter (for Firefox / Safari / testing) ────────────────────────────

const MOCK_PHRASES = [
  'Hi, I am interested in your product.',
  'Can you tell me more about the pricing?',
  'What makes you different from competitors?',
  'We have around 50 employees.',
  'I need this for our sales team.',
  'What is the enterprise pricing?',
  'Can we get a demo scheduled?',
];

let mockIndex = 0;
let mockTimer: ReturnType<typeof setTimeout> | null = null;

export const mockTranscriptionAdapter: TranscriptionAdapter = {
  name: 'Mock (demo mode)',
  supported: true,

  start(onLine) {
    const fire = () => {
      onLine({
        id: `mock-${Date.now()}`,
        speaker: mockIndex % 3 === 0 ? 'remote' : 'local',
        text: MOCK_PHRASES[mockIndex % MOCK_PHRASES.length],
        isFinal: true,
        timestamp: Date.now(),
      });
      mockIndex++;
      mockTimer = setTimeout(fire, 3500);
    };
    mockTimer = setTimeout(fire, 1000);
  },

  stop() {
    if (mockTimer) { clearTimeout(mockTimer); mockTimer = null; }
  },
};

// ─── Active adapter — auto-selects based on browser support ──────────────────

export function getActiveAdapter(): TranscriptionAdapter {
  return isSpeechRecognitionSupported() ? webSpeechAdapter : mockTranscriptionAdapter;
}

export const activeTranscriptionAdapter: TranscriptionAdapter = {
  name: 'Auto',
  supported: true,
  start(onLine) { getActiveAdapter().start(onLine); },
  stop()        { getActiveAdapter().stop(); },
};

// ─── Format timestamp ─────────────────────────────────────────────────────────

export function formatTranscriptTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(ts));
}

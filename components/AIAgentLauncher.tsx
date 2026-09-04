'use client';
/**
 * Feature 3 — AI Voice Sales Agent launcher
 *
 * Wraps the existing LandingPage (which contains the full AI agent flow)
 * so it can be embedded inside the FeatureDashboard.
 */

import dynamic from 'next/dynamic';
import { LoadingSkeleton } from './LoadingSkeleton';

const LandingPage = dynamic(() => import('./LandingPage'), {
  ssr: false,
  loading: () => <LoadingSkeleton />,
});

export default function AIAgentLauncher() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LandingPage />
    </div>
  );
}

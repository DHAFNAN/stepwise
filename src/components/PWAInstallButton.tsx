import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Sheet } from './Sheet';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer whitespace-nowrap"
      >
        <Download className="w-4 h-4" />
        Install App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-full bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-hairline)] text-sm font-medium hover:bg-[var(--border-strong)]/40 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Install on iOS
        </button>

        <Sheet open={showIOSGuide} onClose={() => setShowIOSGuide(false)} title="Install Stepwise on iOS">
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>1. Tap the <strong>Share</strong> icon in Safari’s toolbar.</p>
            <p>2. Scroll down and tap <strong>Add to Home Screen</strong>.</p>
            <p>Stepwise works 100% offline once added.</p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-2 w-full min-h-[44px] rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold cursor-pointer"
            >
              Got it
            </button>
          </div>
        </Sheet>
      </>
    );
  }

  return null;
};

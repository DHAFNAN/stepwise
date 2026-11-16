import React from 'react';
import { ArrowLeft, HelpCircle, X } from 'lucide-react';

type WizardShellProps = {
  step: number;
  totalSteps: number;
  title: string;
  canGoNext: boolean;
  nextLabel?: string;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
  onOpenHowItWorks: () => void;
  preview: React.ReactNode;
  children: React.ReactNode;
};

export const WizardShell: React.FC<WizardShellProps> = ({
  step,
  totalSteps,
  title,
  canGoNext,
  nextLabel = 'Next',
  onBack,
  onNext,
  onClose,
  onOpenHowItWorks,
  preview,
  children,
}) => {
  const progressPct = Math.round((step / totalSteps) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-20 bg-[var(--bg-canvas)]/92 backdrop-blur-md border-b border-[var(--border-hairline)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={step === 1 ? 'Close habit builder' : 'Go to previous step'}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center">
            <p className="text-xs font-medium text-[var(--text-secondary)] tabular-nums">
              Step {step} of {totalSteps} · {title}
            </p>
            <div className="mt-1.5 h-1.5 w-full max-w-[200px] mx-auto rounded-full bg-[var(--bg-subtle)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenHowItWorks}
              aria-label="How it works"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Exit habit builder"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 pt-5 pb-28 space-y-6">
        {preview}
        <div>{children}</div>
      </main>

      <footer className="sticky bottom-0 z-20 bg-[var(--bg-canvas)]/95 backdrop-blur-md border-t border-[var(--border-hairline)] safe-pb">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[48px] px-6 rounded-full bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold text-sm hover:bg-[var(--border-strong)]/40 transition-colors cursor-pointer"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <button
            type="button"
            disabled={!canGoNext}
            onClick={onNext}
            className="min-h-[48px] flex-1 max-w-xs px-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold text-sm hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
          >
            {nextLabel}
          </button>
        </div>
      </footer>
    </div>
  );
};

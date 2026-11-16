import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Sheet } from '../../components/Sheet';
import { HOW_IT_WORKS_EXAMPLES } from '../../lib/suggestions';

type HowItWorksSheetProps = {
  open: boolean;
  onClose: () => void;
};

export const HowItWorksSheet: React.FC<HowItWorksSheetProps> = ({ open, onClose }) => {
  const [exampleIdx, setExampleIdx] = useState(0);
  const example = HOW_IT_WORKS_EXAMPLES[exampleIdx];

  return (
    <Sheet open={open} onClose={onClose} title="How to design a tiny habit">
      <div className="space-y-5">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Clear habits pair a small, concrete action with an existing cue and the kind of person you
          want to become.
        </p>

        <div className="rounded-[20px] bg-[var(--bg-subtle)] p-5 border border-[var(--border-hairline)]">
          <p className="font-display text-lg leading-loose text-[var(--text-primary)]">
            I will{' '}
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[11px] font-sans font-bold mr-1 align-middle">
              1
            </span>
            <span className="underline decoration-2 decoration-[var(--color-primary)] underline-offset-4 font-semibold">
              {example.action}
            </span>{' '}
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-warning)] text-[#1F2A2E] text-[11px] font-sans font-bold mx-1 align-middle">
              2
            </span>
            <span className="underline decoration-2 decoration-[var(--color-warning)] underline-offset-4 font-semibold">
              {example.whenWhere}
            </span>{' '}
            so that I can become{' '}
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-accent)] text-white text-[11px] font-sans font-bold mx-1 align-middle">
              3
            </span>
            <span className="underline decoration-2 decoration-[var(--color-accent)] underline-offset-4 font-semibold">
              {example.identity}
            </span>
            .
          </p>

          <div className="mt-4 pt-3 border-t border-[var(--border-hairline)] flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
            <span>1. Tiny action</span>
            <span>2. Reliable cue</span>
            <span>3. Identity vote</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExampleIdx((i) => (i + 1) % HOW_IT_WORKS_EXAMPLES.length)}
          className="w-full min-h-[44px] px-4 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-sm font-semibold text-[var(--text-primary)] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Different example
        </button>
      </div>
    </Sheet>
  );
};

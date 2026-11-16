import React from 'react';

type EasyStepProps = {
  makeItObvious: string;
  makeItAttractive: string;
  onChangeObvious: (val: string) => void;
  onChangeAttractive: (val: string) => void;
  onSkip: () => void;
};

export const EasyStep: React.FC<EasyStepProps> = ({
  makeItObvious,
  makeItAttractive,
  onChangeObvious,
  onChangeAttractive,
  onSkip,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] text-balance">
            Make it easy and inviting
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            Optional nudges to set up your space and look forward to the habit.
          </p>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="min-h-[40px] px-4 rounded-full text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          Skip step
        </button>
      </div>

      <div>
        <label htmlFor="wizard-obvious" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          How can you make it obvious?
        </label>
        <input
          id="wizard-obvious"
          type="text"
          value={makeItObvious}
          onChange={(e) => onChangeObvious(e.target.value)}
          placeholder="e.g. Put my book right on my pillow"
          maxLength={140}
          className="w-full min-h-[52px] px-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <div>
        <label htmlFor="wizard-attractive" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          What’s a small reward or pairing that makes it enjoyable?
        </label>
        <input
          id="wizard-attractive"
          type="text"
          value={makeItAttractive}
          onChange={(e) => onChangeAttractive(e.target.value)}
          placeholder="e.g. Pair with a warm cup of herbal tea"
          maxLength={140}
          className="w-full min-h-[52px] px-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>
    </div>
  );
};

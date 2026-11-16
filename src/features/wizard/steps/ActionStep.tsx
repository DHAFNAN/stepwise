import React from 'react';
import { ArrowDownRight } from 'lucide-react';
import { Chip } from '../../../components/Chip';
import { DEFAULT_ACTION_SUGGESTIONS, suggestTwoMinuteVersion } from '../../../lib/suggestions';
import type { WizardDraft } from '../../../types/habit';

type ActionStepProps = {
  name: string;
  size: WizardDraft['size'];
  twoMinuteVersion: string;
  onChangeName: (value: string) => void;
  onChangeSize: (size: WizardDraft['size']) => void;
  onChangeTwoMinute: (value: string) => void;
};

const SIZE_OPTIONS: { id: WizardDraft['size']; label: string; sub: string }[] = [
  { id: 'tiny', label: 'Tiny', sub: '< 2 min' },
  { id: 'small', label: 'Small', sub: '5 min' },
  { id: 'medium', label: 'Medium', sub: '15 min' },
  { id: 'big', label: 'Big', sub: '30+ min' },
];

export const ActionStep: React.FC<ActionStepProps> = ({
  name,
  size,
  twoMinuteVersion,
  onChangeName,
  onChangeSize,
  onChangeTwoMinute,
}) => {
  const showNudge = size === 'medium' || size === 'big';
  const shrunkSuggestion = suggestTwoMinuteVersion(name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] text-balance">
          What’s the action you want to do?
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          Start with a small action you can do even on a busy or low-energy day.
        </p>
      </div>

      <div>
        <label htmlFor="wizard-action" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          I will…
        </label>
        <input
          id="wizard-action"
          type="text"
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="e.g. Read 2 pages, Pray, Stretch"
          maxLength={80}
          className="w-full min-h-[52px] px-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-2.5">Tiny action ideas</p>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_ACTION_SUGGESTIONS.map((item) => (
            <Chip
              key={item}
              selected={name.trim().toLowerCase() === item.toLowerCase()}
              onClick={() => onChangeName(item)}
            >
              {item}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Size helper</p>
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)]">
          {SIZE_OPTIONS.map((opt) => {
            const active = size === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChangeSize(opt.id)}
                className={`min-h-[48px] py-2 px-2 rounded-xl text-center transition-colors cursor-pointer ${
                  active
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="block text-xs sm:text-sm">{opt.label}</span>
                <span className="block text-[11px] opacity-75">{opt.sub}</span>
              </button>
            );
          })}
        </div>

        {showNudge && (
          <div className="mt-3 rounded-2xl bg-[var(--color-warning)]/14 border border-[var(--color-warning)]/30 p-4 space-y-2.5">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Start smaller. What’s the 2-minute version?
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Shrinking the habit helps you show up on tough days and keep momentum alive.
            </p>
            {name.trim() && (
              <div className="flex flex-wrap gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => onChangeName(shrunkSuggestion)}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  <ArrowDownRight className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  Shrink action to “{shrunkSuggestion}”
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTwoMinute(shrunkSuggestion)}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-xs font-semibold hover:bg-[var(--color-primary-hover)] cursor-pointer"
                >
                  Use as 2-min fallback
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="wizard-two-minute" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          2-minute fallback version <span className="text-[var(--text-muted)] font-normal">(optional)</span>
        </label>
        <input
          id="wizard-two-minute"
          type="text"
          value={twoMinuteVersion}
          onChange={(e) => onChangeTwoMinute(e.target.value)}
          placeholder={name.trim() ? `e.g. ${shrunkSuggestion}` : 'e.g. Read 1 paragraph'}
          maxLength={80}
          className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>
    </div>
  );
};

import React from 'react';
import { Chip } from '../../../components/Chip';
import { WHEN_WHERE_SUGGESTIONS } from '../../../lib/suggestions';

type CueStepProps = {
  whenWhereText: string;
  place: string;
  onChangeWhenWhere: (value: string) => void;
  onChangePlace: (value: string) => void;
};

export const CueStep: React.FC<CueStepProps> = ({
  whenWhereText,
  place,
  onChangeWhenWhere,
  onChangePlace,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] text-balance">
          When and where will you do it?
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          Write a natural time, routine, or location phrase. Reminders can be configured separately
          in the next step or anytime later.
        </p>
      </div>

      <div>
        <label htmlFor="wizard-when-where" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          When / where
        </label>
        <input
          id="wizard-when-where"
          type="text"
          value={whenWhereText}
          onChange={(e) => onChangeWhenWhere(e.target.value)}
          placeholder="e.g. on time, after morning coffee, at my desk"
          maxLength={80}
          className="w-full min-h-[52px] px-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-2.5">Quick phrases</p>
        <div className="flex flex-wrap gap-2">
          {WHEN_WHERE_SUGGESTIONS.map((phrase) => (
            <Chip
              key={phrase}
              selected={whenWhereText.trim().toLowerCase() === phrase.toLowerCase()}
              onClick={() => onChangeWhenWhere(phrase)}
            >
              {phrase}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="wizard-place-optional" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          Specific place note <span className="text-[var(--text-muted)] font-normal">(optional)</span>
        </label>
        <input
          id="wizard-place-optional"
          type="text"
          value={place}
          onChange={(e) => onChangePlace(e.target.value)}
          placeholder="e.g. Kitchen table, living room mat"
          maxLength={60}
          className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>
    </div>
  );
};

import React from 'react';
import { Chip } from '../../../components/Chip';
import { IDENTITY_SUGGESTIONS } from '../../../lib/suggestions';

type IdentityStepProps = {
  identity: string;
  onChange: (value: string) => void;
};

export const IdentityStep: React.FC<IdentityStepProps> = ({ identity, onChange }) => {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] text-balance">
          What type of person do you want to become?
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          Every check-in is a quiet vote for this identity.
        </p>
      </div>

      <div>
        <label htmlFor="wizard-identity" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          So that I can become…
        </label>
        <input
          id="wizard-identity"
          type="text"
          value={identity}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. a reader, a calmer person"
          maxLength={60}
          className="w-full min-h-[52px] px-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        {identity.trim().length === 0 && (
          <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
            Enter a phrase or tap one below to continue.
          </p>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-2.5">Ideas</p>
        <div className="flex flex-wrap gap-2">
          {IDENTITY_SUGGESTIONS.map((item) => (
            <Chip
              key={item}
              selected={identity.trim().toLowerCase() === item.toLowerCase()}
              onClick={() => onChange(item)}
            >
              {item}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
};

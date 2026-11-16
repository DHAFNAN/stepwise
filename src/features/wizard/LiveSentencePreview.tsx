import React from 'react';
import { formatWhenWherePhrase } from '../../lib/cueFormat';

type LiveSentencePreviewProps = {
  action: string;
  whenWhereText: string;
  place: string;
  identity: string;
};

export const LiveSentencePreview: React.FC<LiveSentencePreviewProps> = ({
  action,
  whenWhereText,
  place,
  identity,
}) => {
  const whenWhere = formatWhenWherePhrase(whenWhereText, place);

  return (
    <section
      aria-label="Live habit commitment preview"
      className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)]"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">
        Your habit sentence
      </p>
      <p className="font-display text-lg sm:text-xl leading-relaxed text-[var(--text-primary)]">
        I will{' '}
        <span
          className={`underline decoration-2 underline-offset-4 ${
            action.trim()
              ? 'decoration-[var(--color-primary)] font-semibold'
              : 'decoration-[var(--border-strong)] text-[var(--text-muted)]'
          }`}
        >
          {action.trim() || '[action]'}
        </span>
        ,{' '}
        <span
          className={`underline decoration-2 underline-offset-4 ${
            whenWhere
              ? 'decoration-[var(--color-warning)] font-semibold'
              : 'decoration-[var(--border-strong)] text-[var(--text-muted)]'
          }`}
        >
          {whenWhere || '[when/where]'}
        </span>{' '}
        so that I can become{' '}
        <span
          className={`underline decoration-2 underline-offset-4 ${
            identity.trim()
              ? 'decoration-[var(--color-accent)] font-semibold'
              : 'decoration-[var(--border-strong)] text-[var(--text-muted)]'
          }`}
        >
          {identity.trim() || '[type of person]'}
        </span>
        .
      </p>
    </section>
  );
};

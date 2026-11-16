import React from 'react';

type StatTileProps = {
  label: string;
  value: string | number;
  sublabel?: string;
};

export const StatTile: React.FC<StatTileProps> = ({ label, value, sublabel }) => {
  return (
    <div
      className="bg-[var(--bg-surface)] rounded-[22px] p-4 border border-[var(--border-hairline)]"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <p className="text-xs font-medium text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 font-display text-2xl sm:text-[28px] font-semibold tabular-nums text-[var(--text-primary)] leading-tight">
        {value}
      </p>
      {sublabel && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{sublabel}</p>}
    </div>
  );
};

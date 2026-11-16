import React from 'react';

type ChipProps = {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export const Chip: React.FC<ChipProps> = ({
  selected = false,
  onClick,
  children,
  className = '',
  disabled = false,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-45 ${
        selected
          ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm'
          : 'bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--border-strong)]/40 border border-[var(--border-hairline)]'
      } ${className}`}
    >
      {children}
    </button>
  );
};

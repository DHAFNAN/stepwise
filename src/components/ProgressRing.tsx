import React from 'react';

type ProgressRingProps = {
  done: number;
  total: number;
  size?: number;
};

export const ProgressRing: React.FC<ProgressRingProps> = ({ done, total, size = 48 }) => {
  const strokeWidth = 4.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.min(1, done / total) : 0;
  const offset = circumference * (1 - ratio);

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-label={`${done} of ${total} habits completed`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ratio === 1 && total > 0 ? 'var(--color-success)' : 'var(--color-primary)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 260ms ease-out, stroke 200ms ease-out' }}
        />
      </svg>
      <span className="absolute text-xs font-bold tabular-nums text-[var(--text-primary)]">
        {done}/{total}
      </span>
    </div>
  );
};

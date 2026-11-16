import React from 'react';
import { motion } from 'motion/react';
import { Check, Minus, SkipForward } from 'lucide-react';
import type { CheckInStatus } from '../types/habit';

type CheckButtonProps = {
  status?: CheckInStatus;
  accentColor: string;
  habitName: string;
  disabled?: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
};

export const CheckButton: React.FC<CheckButtonProps> = ({
  status,
  accentColor,
  habitName,
  disabled = false,
  onToggle,
  onLongPress,
}) => {
  const timerRef = React.useRef<number | null>(null);
  const longPressedRef = React.useRef(false);

  const startPress = () => {
    if (disabled || !onLongPress) return;
    longPressedRef.current = false;
    timerRef.current = window.setTimeout(() => {
      longPressedRef.current = true;
      onLongPress();
    }, 480);
  };

  const cancelPress = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    if (!disabled) {
      onToggle();
    }
  };

  const isDone = status === 'done';
  const isMinimum = status === 'minimum';
  const isSkipped = status === 'skipped';
  const isPartial = status === 'partial';

  const ariaLabel = isDone
    ? `Undo completion for ${habitName}`
    : isMinimum
      ? `Undo 2-minute completion for ${habitName}`
      : isSkipped
        ? `Mark ${habitName} done instead of skipped`
        : `Mark ${habitName} done`;

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      animate={isDone || isMinimum ? { scale: [1, 1.12, 1] } : { scale: 1 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      aria-label={ariaLabel}
      aria-pressed={isDone || isMinimum}
      className="relative flex items-center justify-center min-w-[48px] min-h-[48px] w-12 h-12 rounded-full shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] disabled:opacity-40 cursor-pointer"
      style={{
        backgroundColor: isDone
          ? accentColor
          : isMinimum
            ? 'transparent'
            : 'var(--bg-subtle)',
        border: isDone
          ? `2px solid ${accentColor}`
          : isMinimum || isPartial
            ? `2px solid ${accentColor}`
            : isSkipped
              ? '2px dashed var(--border-strong)'
              : '2px solid var(--border-strong)',
        color: isDone ? '#FFFFFF' : isMinimum || isPartial ? accentColor : 'var(--text-secondary)',
      }}
    >
      {isDone && <Check className="w-6 h-6 stroke-[2.6]" />}
      {isMinimum && (
        <span className="flex flex-col items-center justify-center leading-none">
          <Minus className="w-4 h-4 stroke-[2.8]" />
          <span className="text-[9px] font-bold tracking-tight">2m</span>
        </span>
      )}
      {isSkipped && <SkipForward className="w-4 h-4" />}
      {isPartial && <Check className="w-5 h-5 opacity-55" />}
      {!status && <Check className="w-5 h-5 opacity-25" />}
    </motion.button>
  );
};

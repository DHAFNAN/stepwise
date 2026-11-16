import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Flame,
  GripVertical,
  Minus,
  MoreHorizontal,
  Plus,
  Zap,
} from 'lucide-react';
import { getHabitColor } from '../lib/colors';
import { formatCueSummary, formatGoalSummary } from '../lib/cueFormat';
import { getHabitIconComponent } from '../lib/icons';
import type { StreakSummary } from '../lib/stats';
import type { CheckIn, Habit } from '../types/habit';
import { CheckButton } from './CheckButton';

type HabitCardProps = {
  habit: Habit;
  checkIn?: CheckIn;
  summary: StreakSummary;
  compact: boolean;
  isDark: boolean;
  reorderMode?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  isSelectedDetail?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggleDone: () => void;
  onAdjustProgress?: (delta: number) => void;
  onOpenMenu: () => void;
  onOpenDetail: () => void;
};

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  checkIn,
  summary,
  compact,
  isDark,
  reorderMode = false,
  canMoveUp = false,
  canMoveDown = false,
  isSelectedDetail = false,
  onMoveUp,
  onMoveDown,
  onToggleDone,
  onAdjustProgress,
  onOpenMenu,
  onOpenDetail,
}) => {
  const colorToken = getHabitColor(habit.color);
  const Icon = getHabitIconComponent(habit.icon);
  const accentHex = isDark ? colorToken.darkHex : colorToken.hex;
  const iconBg = isDark ? colorToken.tintDark : colorToken.tintLight;
  const iconFg = isDark ? colorToken.textDark : colorToken.textLight;

  const isCompleted = checkIn?.status === 'done' || checkIn?.status === 'minimum';
  const isSkipped = checkIn?.status === 'skipped';
  const cueLine = formatCueSummary(habit.cue, habit.place, habit.whenWhereText);

  const goal = Math.max(1, habit.dailyGoal ?? 1);
  const unit = habit.goalUnit?.trim() || 'times';
  const showGoalTag =
    goal > 1 || unit !== 'times' || habit.goalScope === 'per-session';
  const currentCount =
    checkIn?.status === 'done'
      ? (checkIn.progressCount ?? goal)
      : checkIn?.status === 'partial'
        ? (checkIn.progressCount ?? 0)
        : 0;
  const showStepper = !reorderMode && goal > 1 && Boolean(onAdjustProgress);
  const progressPct = Math.min(100, Math.round((currentCount / goal) * 100));

  return (
    <article
      className={`group relative bg-[var(--bg-surface)] rounded-[24px] border transition-all duration-200 ${
        isSelectedDetail
          ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
          : 'border-[var(--border-hairline)]'
      } ${isCompleted || isSkipped ? 'opacity-82' : 'opacity-100'}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className={`flex items-center gap-3.5 ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
        {reorderMode ? (
          <div className="flex items-center gap-1 shrink-0" aria-label={`Reorder ${habit.name}`}>
            <GripVertical className="w-5 h-5 text-[var(--text-muted)]" aria-hidden="true" />
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                disabled={!canMoveUp}
                onClick={onMoveUp}
                aria-label={`Move ${habit.name} up`}
                className="min-w-[36px] min-h-[28px] flex items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={!canMoveDown}
                onClick={onMoveDown}
                aria-label={`Move ${habit.name} down`}
                className="min-w-[36px] min-h-[28px] flex items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`flex items-center justify-center shrink-0 rounded-2xl ${
              compact ? 'w-10 h-10' : 'w-12 h-12'
            }`}
            style={{ backgroundColor: iconBg, color: iconFg }}
            aria-hidden="true"
          >
            <Icon className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
          </div>
        )}

        <button
          type="button"
          onClick={onOpenDetail}
          className="flex-1 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-xl py-0.5 cursor-pointer"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h3
              className={`font-display font-semibold text-[var(--text-primary)] ${
                compact ? 'text-base truncate' : 'text-[19px] leading-snug break-words'
              } ${isCompleted ? 'line-through decoration-[var(--text-muted)]/60' : ''}`}
            >
              {habit.name}
            </h3>
          </div>

          {!compact && (
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              I want to become <span className="font-medium text-[var(--text-primary)]">{habit.identity}</span>
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-secondary)]">
            <span className={compact ? 'truncate max-w-[160px]' : ''}>{cueLine}</span>
            {showGoalTag && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {formatGoalSummary(habit)}
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-[var(--text-primary)]">
              {summary.currentStreak > 0 ? (
                <Flame className="w-3.5 h-3.5 text-[var(--color-warning)]" aria-hidden="true" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
              )}
              {summary.currentStreak} day streak
            </span>
            {checkIn?.status === 'minimum' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[var(--color-primary)]">2-min version</span>
              </>
            )}
            {checkIn?.status === 'skipped' && (
              <>
                <span aria-hidden="true">·</span>
                <span>Skipped</span>
              </>
            )}
            {!isCompleted && !isSkipped && summary.neverMissTwice && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[var(--color-warning)]">Never miss twice</span>
              </>
            )}
          </div>
        </button>

        {!reorderMode && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMenu();
              }}
              aria-label={`More options for ${habit.name}`}
              className="min-w-[40px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <CheckButton
              status={checkIn?.status}
              accentColor={accentHex}
              habitName={habit.name}
              onToggle={onToggleDone}
              onLongPress={onOpenMenu}
            />
          </div>
        )}
      </div>

      {showStepper && (
        <div className={`${compact ? 'px-4 pb-3' : 'px-5 pb-4'} pt-0.5`}>
          <div className="relative flex items-center justify-between rounded-full bg-[var(--bg-subtle)] border border-[var(--border-hairline)] overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 transition-all duration-300 pointer-events-none opacity-16"
              style={{ width: `${progressPct}%`, backgroundColor: accentHex }}
            />
            <button
              type="button"
              disabled={currentCount <= 0}
              onClick={(e) => {
                e.stopPropagation();
                onAdjustProgress?.(-1);
              }}
              aria-label={`Decrease progress for ${habit.name}`}
              className="relative z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/70 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="relative z-10 text-xs sm:text-sm font-semibold tabular-nums text-[var(--text-primary)] px-2">
              {currentCount} / {goal} {unit}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdjustProgress?.(1);
              }}
              aria-label={`Increase progress for ${habit.name}`}
              className="relative z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/70 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

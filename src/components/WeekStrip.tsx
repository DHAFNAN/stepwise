import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MAX_BACKFILL_DAYS } from '../lib/constants';
import { addDays, diffDays, getShortWeekdayLabel, getWeekDates } from '../lib/dates';
import type { WeekStart } from '../types/habit';

type WeekStripProps = {
  selectedDate: string;
  todayKey: string;
  weekStartsOn: WeekStart;
  onSelectDate: (dateKey: string) => void;
  completedByDate?: Record<string, { done: number; total: number }>;
};

export const WeekStrip: React.FC<WeekStripProps> = ({
  selectedDate,
  todayKey,
  weekStartsOn,
  onSelectDate,
  completedByDate = {},
}) => {
  const weekDates = getWeekDates(selectedDate, weekStartsOn);
  const minAllowedDate = addDays(todayKey, -MAX_BACKFILL_DAYS);
  const canGoPrevWeek = weekDates[0] > minAllowedDate;
  const canGoNextWeek = weekDates[6] < todayKey;

  const shiftWeek = (deltaWeeks: number) => {
    let target = addDays(selectedDate, deltaWeeks * 7);
    if (target > todayKey) target = todayKey;
    if (target < minAllowedDate) target = minAllowedDate;
    onSelectDate(target);
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        disabled={!canGoPrevWeek}
        onClick={() => shiftWeek(-1)}
        aria-label="Previous week"
        className="min-w-[36px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-25 cursor-pointer disabled:cursor-default transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="grid grid-cols-7 gap-1 flex-1" role="tablist" aria-label="Select day">
        {weekDates.map((dateKey) => {
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayKey;
          const isFuture = dateKey > todayKey;
          const isTooOld = diffDays(dateKey, todayKey) > MAX_BACKFILL_DAYS;
          const disabled = isFuture || isTooOld;
          const dayNum = Number(dateKey.split('-')[2]);
          const dayLabel = getShortWeekdayLabel(dateKey);
          const stats = completedByDate[dateKey];
          const allDone = stats && stats.total > 0 && stats.done >= stats.total;

          return (
            <button
              key={dateKey}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-label={`${dayLabel} ${dayNum}${isToday ? ', Today' : ''}`}
              disabled={disabled}
              onClick={() => onSelectDate(dateKey)}
              className={`flex flex-col items-center justify-center min-h-[56px] py-1.5 px-1 rounded-2xl transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isSelected
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm'
                  : 'hover:bg-[var(--bg-subtle)] text-[var(--text-primary)]'
              }`}
            >
              <span
                className={`text-[11px] font-medium leading-tight ${
                  isSelected ? 'text-white/85' : 'text-[var(--text-secondary)]'
                }`}
              >
                {isToday ? 'Today' : dayLabel}
              </span>
              <span className="mt-0.5 text-sm font-bold tabular-nums leading-tight">
                {dayNum}
              </span>
              <span
                aria-hidden="true"
                className={`mt-1 w-1.5 h-1.5 rounded-full ${
                  allDone
                    ? isSelected
                      ? 'bg-white'
                      : 'bg-[var(--color-success)]'
                    : stats && stats.done > 0
                      ? isSelected
                        ? 'bg-white/60'
                        : 'bg-[var(--color-primary)]/50'
                      : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!canGoNextWeek}
        onClick={() => shiftWeek(1)}
        aria-label="Next week"
        className="min-w-[36px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-25 cursor-pointer disabled:cursor-default transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

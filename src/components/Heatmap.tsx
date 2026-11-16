import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthYear, getMonthGridDays, getShortWeekdayName } from '../lib/dates';
import type { CheckIn, WeekStart } from '../types/habit';

type HeatmapProps = {
  year: number;
  monthIndex0: number;
  weekStartsOn: WeekStart;
  todayKey: string;
  accentColor: string;
  checkIns: CheckIn[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (dateKey: string) => void;
};

export const Heatmap: React.FC<HeatmapProps> = ({
  year,
  monthIndex0,
  weekStartsOn,
  todayKey,
  accentColor,
  checkIns,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}) => {
  const cells = getMonthGridDays(year, monthIndex0, weekStartsOn);
  const byDate = new Map(checkIns.map((c) => [c.date, c]));
  const weekdayHeaders = Array.from({ length: 7 }, (_, i) =>
    getShortWeekdayName((weekStartsOn + i) % 7)
  );

  const [todayY, todayM] = todayKey.split('-').map(Number);
  const isCurrentOrFutureMonth = year > todayY || (year === todayY && monthIndex0 + 1 >= todayM);

  return (
    <div
      className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)]"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
          {formatMonthYear(year, monthIndex0)}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Previous month"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={isCurrentOrFutureMonth}
            onClick={onNextMonth}
            aria-label="Next month"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5">
        {weekdayHeaders.map((label) => (
          <span key={label} className="text-[11px] font-medium text-[var(--text-muted)]">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell) => {
          if (!cell.inMonth) {
            return <div key={cell.dateKey} className="aspect-square" />;
          }

          const entry = byDate.get(cell.dateKey);
          const isFuture = cell.dateKey > todayKey;
          const isToday = cell.dateKey === todayKey;
          const dayNum = Number(cell.dateKey.split('-')[2]);

          const isDone = entry?.status === 'done';
          const isMin = entry?.status === 'minimum';
          const isSkipped = entry?.status === 'skipped';

          return (
            <button
              key={cell.dateKey}
              type="button"
              disabled={isFuture}
              onClick={() => onSelectDay(cell.dateKey)}
              aria-label={`${cell.dateKey}: ${entry ? entry.status : 'not logged'}`}
              className={`relative aspect-square min-h-[38px] rounded-xl flex items-center justify-center text-xs font-semibold tabular-nums transition-transform active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isToday ? 'ring-2 ring-[var(--text-primary)]/40 ring-offset-1 ring-offset-[var(--bg-surface)]' : ''
              }`}
              style={{
                background: isDone
                  ? accentColor
                  : isMin
                    ? `linear-gradient(135deg, ${accentColor} 50%, var(--bg-subtle) 50%)`
                    : 'var(--bg-subtle)',
                border: isSkipped ? `2px dashed ${accentColor}` : '1px solid var(--border-hairline)',
                color: isDone ? '#FFFFFF' : 'var(--text-primary)',
              }}
            >
              <span className={isMin ? 'px-1 rounded bg-[var(--bg-surface)]/85 text-[11px]' : ''}>
                {dayNum}
              </span>
              {entry?.note && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-current opacity-80"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: accentColor }} />
          Done
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ background: `linear-gradient(135deg, ${accentColor} 50%, var(--bg-subtle) 50%)` }}
          />
          2-min version
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ border: `1.5px dashed ${accentColor}` }}
          />
          Skipped
        </span>
      </div>
    </div>
  );
};

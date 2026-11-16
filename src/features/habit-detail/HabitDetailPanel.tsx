import React, { Suspense, lazy, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  Award,
  Bell,
  BellOff,
  CalendarClock,
  Check,
  Clock,
  Edit3,
  MoreHorizontal,
  RotateCcw,
  SkipForward,
  Trash2,
} from 'lucide-react';
import { Heatmap } from '../../components/Heatmap';
import { Sheet } from '../../components/Sheet';
import { StatTile } from '../../components/StatTile';
import { getHabitColor } from '../../lib/colors';
import { MILESTONE_THRESHOLDS } from '../../lib/constants';
import {
  formatCueSummary,
  formatFrequencyLabel,
  formatGoalSummary,
  formatReminderTimingLabel,
} from '../../lib/cueFormat';
import { formatDisplayDate, formatTime12h } from '../../lib/dates';
import { getHabitIconComponent } from '../../lib/icons';
import { getStreakSummary, getWeeklyCompletionBuckets } from '../../lib/stats';
import { useHabitStore } from '../../store/habitStore';
import type { CheckInStatus, Habit } from '../../types/habit';
import { HabitReminderScheduleSheet } from './HabitReminderScheduleSheet';

const WeeklyBarChart = lazy(() => import('./WeeklyBarChart'));

type HabitDetailPanelProps = {
  habit: Habit;
  isDark: boolean;
  embedded?: boolean;
};

export const HabitDetailPanel: React.FC<HabitDetailPanelProps> = ({
  habit,
  isDark,
  embedded = false,
}) => {
  const navigate = useNavigate();
  const todayKey = useHabitStore((s) => s.todayKey);
  const checkIns = useHabitStore((s) => s.checkIns);
  const settings = useHabitStore((s) => s.settings);
  const setCheckIn = useHabitStore((s) => s.setCheckIn);
  const clearCheckIn = useHabitStore((s) => s.clearCheckIn);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);
  const restoreHabit = useHabitStore((s) => s.restoreHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);

  const [todayYear, todayMonth] = todayKey.split('-').map(Number);
  const [viewMonth, setViewMonth] = useState({ year: todayYear, month0: todayMonth - 1 });
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [dayNote, setDayNote] = useState('');

  const habitCheckIns = useMemo(
    () => checkIns.filter((c) => c.habitId === habit.id),
    [checkIns, habit.id]
  );

  const summary = useMemo(
    () => getStreakSummary(habit, checkIns, todayKey),
    [habit, checkIns, todayKey]
  );

  const weeklyBuckets = useMemo(
    () => getWeeklyCompletionBuckets(habit.id, checkIns, 8, todayKey),
    [habit.id, checkIns, todayKey]
  );

  const colorToken = getHabitColor(habit.color);
  const Icon = getHabitIconComponent(habit.icon);
  const accentHex = isDark ? colorToken.darkHex : colorToken.hex;
  const iconBg = isDark ? colorToken.tintDark : colorToken.tintLight;
  const iconFg = isDark ? colorToken.textDark : colorToken.textLight;

  const editingCheckIn = editingDay ? habitCheckIns.find((c) => c.date === editingDay) : undefined;

  const handleShiftMonth = (delta: number) => {
    setViewMonth((prev) => {
      const next = new Date(prev.year, prev.month0 + delta, 15);
      return { year: next.getFullYear(), month0: next.getMonth() };
    });
  };

  const handleSetDayStatus = (status: CheckInStatus | 'clear') => {
    if (!editingDay) return;
    if (status === 'clear') {
      clearCheckIn(habit.id, editingDay);
    } else {
      setCheckIn(habit.id, editingDay, status, dayNote.trim() || undefined);
    }
    setEditingDay(null);
  };

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <section
        className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)]"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: iconBg, color: iconFg }}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] break-words">
                {habit.name}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                I want to become <span className="font-medium text-[var(--text-primary)]">{habit.identity}</span>
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {formatFrequencyLabel(habit)} · {formatGoalSummary(habit)} ·{' '}
                {formatCueSummary(habit.cue, habit.place, habit.whenWhereText)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmDelete(false);
              setMenuOpen(true);
            }}
            aria-label={`Habit actions for ${habit.name}`}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer shrink-0"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Gentle check-in banner when streak is 0 after >= 2 missed scheduled days */}
      {summary.needsGentleNudge && !nudgeDismissed && !habit.archivedAt && (
        <section
          aria-label="Gentle adjustment suggestion"
          className="bg-[var(--color-warning)]/12 border border-[var(--color-warning)]/30 rounded-[24px] p-5 space-y-3"
        >
          <p className="font-display text-base font-semibold text-[var(--text-primary)]">
            Missing twice is a pattern forming. Want to make it smaller?
          </p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Shrinking the habit down to two minutes makes it easier to restart without pressure.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(`/edit/${habit.id}?step=1`)}
              className="min-h-[42px] px-4 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-xs font-semibold hover:bg-[var(--color-primary-hover)] cursor-pointer"
            >
              Make it smaller
            </button>
            <button
              type="button"
              onClick={() => setNudgeDismissed(true)}
              className="min-h-[42px] px-4 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] text-xs font-semibold border border-[var(--border-hairline)] cursor-pointer"
            >
              Not now
            </button>
          </div>
        </section>
      )}

      {/* Stat Tiles */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Repetitions" value={summary.repetitions} />
        <StatTile
          label="Current streak"
          value={`${summary.currentStreak}d`}
          sublabel={summary.neverMissTwice ? 'Never miss twice' : undefined}
        />
        <StatTile label="Longest streak" value={`${summary.longestStreak}d`} />
        <StatTile label="30-day rate" value={`${summary.completionRate30d}%`} />
      </div>

      {/* Calendar Heatmap */}
      <Heatmap
        year={viewMonth.year}
        monthIndex0={viewMonth.month0}
        weekStartsOn={settings.weekStartsOn}
        todayKey={todayKey}
        accentColor={accentHex}
        checkIns={habitCheckIns}
        onPrevMonth={() => handleShiftMonth(-1)}
        onNextMonth={() => handleShiftMonth(1)}
        onSelectDay={(dateKey) => {
          const existing = habitCheckIns.find((c) => c.date === dateKey);
          setDayNote(existing?.note ?? '');
          setEditingDay(dateKey);
        }}
      />

      {/* Weekly Bar Chart (Lazy-loaded) */}
      <section
        className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)]"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <h3 className="font-display text-base font-semibold text-[var(--text-primary)] mb-3">
          Last 8 weeks
        </h3>
        <Suspense
          fallback={
            <div className="h-44 flex items-center justify-center text-xs text-[var(--text-muted)]">
              Loading chart…
            </div>
          }
        >
          <WeeklyBarChart data={weeklyBuckets} accentColor={accentHex} />
        </Suspense>
      </section>

      {/* Schedule & Reminders Card */}
      <section
        className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)] space-y-3.5"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
            <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
              Schedule &amp; Reminders
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setScheduleSheetOpen(true)}
            className="min-h-[38px] px-4 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
          >
            Adjust
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-[var(--text-secondary)]">Repeat</dt>
            <dd className="font-medium text-[var(--text-primary)]">{formatFrequencyLabel(habit)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--text-secondary)]">Goal</dt>
            <dd className="font-medium text-[var(--text-primary)]">{formatGoalSummary(habit)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-[var(--text-secondary)] mb-1">Habit times</dt>
            <dd>
              {habit.habitTimes && habit.habitTimes.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {habit.habitTimes.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-xs font-semibold tabular-nums text-[var(--text-primary)]"
                    >
                      {formatTime12h(t)}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">No specific times set</span>
              )}
            </dd>
          </div>
          <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-[var(--border-hairline)]">
            {habit.reminderEnabled ? (
              <Bell className="w-4 h-4 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
            ) : (
              <BellOff className="w-4 h-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
            )}
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {habit.reminderEnabled
                ? `Reminders on · ${formatReminderTimingLabel(habit.reminderTiming, habit.reminderTime)}`
                : 'Reminders off'}
            </span>
          </div>
        </dl>
      </section>

      {/* Milestones */}
      <section
        className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)]"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <h3 className="font-display text-base font-semibold text-[var(--text-primary)] mb-3">
          Milestones
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {MILESTONE_THRESHOLDS.map((target) => {
            const unlocked = summary.repetitions >= target;
            return (
              <div
                key={target}
                className={`rounded-2xl py-2.5 px-1 text-center border transition-all ${
                  unlocked
                    ? 'border-transparent text-white shadow-sm'
                    : 'bg-[var(--bg-subtle)] border-[var(--border-hairline)] text-[var(--text-muted)] opacity-65'
                }`}
                style={unlocked ? { backgroundColor: accentHex } : undefined}
              >
                <Award className="w-4 h-4 mx-auto mb-1" aria-hidden="true" />
                <span className="block text-xs font-bold tabular-nums">{target}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Notes Card */}
      <section
        className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)] space-y-3"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
          Habit design notes
        </h3>
        <dl className="space-y-2.5 text-sm">
          <div>
            <dt className="text-xs text-[var(--text-secondary)]">When &amp; where</dt>
            <dd className="text-[var(--text-primary)] font-medium">
              {formatCueSummary(habit.cue, habit.place, habit.whenWhereText)}
            </dd>
          </div>
          {habit.twoMinuteVersion && (
            <div>
              <dt className="text-xs text-[var(--text-secondary)]">2-minute version</dt>
              <dd className="text-[var(--text-primary)]">{habit.twoMinuteVersion}</dd>
            </div>
          )}
          {habit.makeItObvious && (
            <div>
              <dt className="text-xs text-[var(--text-secondary)]">Make it obvious</dt>
              <dd className="text-[var(--text-primary)]">{habit.makeItObvious}</dd>
            </div>
          )}
          {habit.makeItAttractive && (
            <div>
              <dt className="text-xs text-[var(--text-secondary)]">Make it enjoyable</dt>
              <dd className="text-[var(--text-primary)]">{habit.makeItAttractive}</dd>
            </div>
          )}
        </dl>
        {embedded && (
          <button
            type="button"
            onClick={() => navigate(`/habit/${habit.id}`)}
            className="text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
          >
            Open full detail view
          </button>
        )}
      </section>

      {/* Day Status Editor Sheet */}
      <Sheet
        open={Boolean(editingDay)}
        onClose={() => setEditingDay(null)}
        title={editingDay ? formatDisplayDate(editingDay) : 'Edit day'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="detail-day-note" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Note for this day (optional)
            </label>
            <input
              id="detail-day-note"
              type="text"
              value={dayNote}
              onChange={(e) => setDayNote(e.target.value)}
              placeholder="Add a short reflection…"
              maxLength={120}
              className="w-full min-h-[46px] px-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleSetDayStatus('done')}
              className="w-full min-h-[46px] px-4 rounded-2xl bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold text-sm flex items-center gap-2.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Mark done
            </button>
            <button
              type="button"
              onClick={() => handleSetDayStatus('minimum')}
              className="w-full min-h-[46px] px-4 rounded-2xl bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold text-sm flex items-center gap-2.5 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-[var(--color-primary)]" />
              Mark 2-minute version
            </button>
            <button
              type="button"
              onClick={() => handleSetDayStatus('skipped')}
              className="w-full min-h-[46px] px-4 rounded-2xl bg-[var(--bg-subtle)] text-[var(--text-primary)] font-semibold text-sm flex items-center gap-2.5 cursor-pointer"
            >
              <SkipForward className="w-4 h-4 text-[var(--text-secondary)]" />
              Mark skipped
            </button>
            {editingCheckIn && (
              <button
                type="button"
                onClick={() => handleSetDayStatus('clear')}
                className="w-full min-h-[46px] px-4 rounded-2xl bg-[var(--bg-subtle)] text-[var(--color-accent)] font-semibold text-sm flex items-center gap-2.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Clear check-in
              </button>
            )}
          </div>
        </div>
      </Sheet>

      {/* Habit Actions Sheet (Edit, Retire/Restore, Delete) */}
      <Sheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={confirmDelete ? `Delete "${habit.name}"?` : 'Manage habit'}
      >
        {!confirmDelete ? (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setScheduleSheetOpen(true);
              }}
              className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-left flex items-center gap-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer"
            >
              <CalendarClock className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Schedule &amp; reminders</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigate(`/edit/${habit.id}`);
              }}
              className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-left flex items-center gap-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-[var(--text-secondary)]" />
              <span>Edit habit</span>
            </button>

            {habit.archivedAt ? (
              <button
                type="button"
                onClick={() => {
                  restoreHabit(habit.id);
                  setMenuOpen(false);
                }}
                className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-left flex items-center gap-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Restore to Today</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  archiveHabit(habit.id);
                  setMenuOpen(false);
                  if (!embedded) navigate('/today');
                }}
                className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-left flex items-center gap-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer"
              >
                <Archive className="w-4 h-4 text-[var(--text-secondary)]" />
                <span>Pause / Retire habit</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-subtle)] hover:bg-[var(--color-accent)]/12 text-left flex items-center gap-3 text-sm font-semibold text-[var(--color-accent)] cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete habit</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              This removes "{habit.name}" and its check-in history from this device.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 min-h-[46px] rounded-full bg-[var(--bg-subtle)] text-sm font-semibold text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteHabit(habit.id);
                  setMenuOpen(false);
                  if (!embedded) navigate('/today');
                }}
                className="flex-1 min-h-[46px] rounded-full bg-[var(--color-accent)] text-white text-sm font-semibold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Sheet>

      <HabitReminderScheduleSheet
        habit={habit}
        open={scheduleSheetOpen}
        onClose={() => setScheduleSheetOpen(false)}
      />
    </div>
  );
};

import React, { Suspense, lazy, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArchiveRestore, ArrowRight, ChevronDown, ChevronRight, Flame } from 'lucide-react';
import { PebbleBlob } from '../../components/PebbleBlob';
import { StatTile } from '../../components/StatTile';
import { getHabitColor } from '../../lib/colors';
import { MILESTONE_THRESHOLDS } from '../../lib/constants';
import { addDays, diffDays, fromDateKey, toLocalDateKey } from '../../lib/dates';
import { getHabitIconComponent } from '../../lib/icons';
import {
  getBestWeekday,
  getRepetitions,
  getStreakSummary,
  isHabitScheduledOnDate,
} from '../../lib/stats';
import { useHabitStore } from '../../store/habitStore';
import type { HabitSeriesMeta } from './ProgressStackedChart';

const ProgressStackedChart = lazy(() => import('./ProgressStackedChart'));

type RangeFilter = 'week' | 'month' | 'all';
type ProgressTab = 'progress' | 'milestones';

type ProgressPageProps = {
  isDark: boolean;
};

export const ProgressPage: React.FC<ProgressPageProps> = ({ isDark }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProgressTab>('progress');
  const [range, setRange] = useState<RangeFilter>('week');
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});

  const habits = useHabitStore((s) => s.habits);
  const checkIns = useHabitStore((s) => s.checkIns);
  const todayKey = useHabitStore((s) => s.todayKey);
  const restoreHabit = useHabitStore((s) => s.restoreHabit);
  const showToast = useHabitStore((s) => s.showToast);

  const activeHabits = useMemo(
    () =>
      habits
        .filter((h) => !h.archivedAt)
        .slice()
        .sort((a, b) => a.order - b.order),
    [habits]
  );
  const retiredHabits = useMemo(() => habits.filter((h) => Boolean(h.archivedAt)), [habits]);

  const rangeStartKey = useMemo(() => {
    if (range === 'week') return addDays(todayKey, -6);
    if (range === 'month') return addDays(todayKey, -29);
    let earliest = addDays(todayKey, -29);
    for (const h of habits) {
      const k = toLocalDateKey(new Date(h.createdAt));
      if (k < earliest) earliest = k;
    }
    for (const c of checkIns) {
      if (c.date < earliest) earliest = c.date;
    }
    return earliest;
  }, [range, todayKey, habits, checkIns]);

  const filteredDoneCheckIns = useMemo(
    () =>
      checkIns.filter(
        (c) =>
          (c.status === 'done' || c.status === 'minimum') &&
          c.date >= rangeStartKey &&
          c.date <= todayKey
      ),
    [checkIns, rangeStartKey, todayKey]
  );

  const overallCompletionRate = useMemo(() => {
    if (activeHabits.length === 0) return 0;
    const span = Math.min(365, Math.max(0, diffDays(rangeStartKey, todayKey)));
    let scheduledTotal = 0;
    let doneTotal = 0;

    for (const h of activeHabits) {
      const createdKey = toLocalDateKey(new Date(h.createdAt));
      const start = createdKey > rangeStartKey ? createdKey : rangeStartKey;
      const habitSpan = diffDays(start, todayKey);
      if (habitSpan < 0) continue;
      for (let i = 0; i <= Math.min(span, habitSpan); i++) {
        const key = addDays(start, i);
        if (!isHabitScheduledOnDate(h, key)) continue;
        const entry = checkIns.find((c) => c.habitId === h.id && c.date === key);
        if (key === todayKey && !entry && scheduledTotal > 0) continue;
        scheduledTotal += 1;
        if (entry && (entry.status === 'done' || entry.status === 'minimum')) {
          doneTotal += 1;
        }
      }
    }
    if (scheduledTotal === 0) return 0;
    return Math.round((doneTotal / scheduledTotal) * 100);
  }, [activeHabits, checkIns, rangeStartKey, todayKey]);

  const bestDay = useMemo(() => getBestWeekday(filteredDoneCheckIns), [filteredDoneCheckIns]);

  const chartSeries: HabitSeriesMeta[] = useMemo(
    () =>
      habits.map((h) => {
        const token = getHabitColor(h.color);
        return {
          id: h.id,
          name: h.name,
          color: isDark ? token.darkHex : token.hex,
        };
      }),
    [habits, isDark]
  );

  const chartData = useMemo(() => {
    if (habits.length === 0) return [];
    const span = Math.min(range === 'all' ? 60 : 30, Math.max(0, diffDays(rangeStartKey, todayKey)));
    const start = addDays(todayKey, -span);
    const rows: Record<string, string | number>[] = [];

    for (let i = 0; i <= span; i++) {
      const dateKey = addDays(start, i);
      const dt = fromDateKey(dateKey);
      const label =
        range === 'week'
          ? dt.toLocaleDateString(undefined, { weekday: 'short' })
          : `${dt.getMonth() + 1}/${dt.getDate()}`;
      const row: Record<string, string | number> = { label };
      for (const h of habits) {
        const hit = filteredDoneCheckIns.some((c) => c.habitId === h.id && c.date === dateKey);
        row[h.id] = hit ? 1 : 0;
      }
      rows.push(row);
    }
    return rows;
  }, [habits, filteredDoneCheckIns, range, rangeStartKey, todayKey]);

  const perHabitStats = useMemo(() => {
    const counts = activeHabits.map((h) => {
      const reps = filteredDoneCheckIns.filter((c) => c.habitId === h.id).length;
      return { habit: h, reps };
    });
    counts.sort((a, b) => b.reps - a.reps);
    const maxReps = Math.max(1, ...counts.map((c) => c.reps));
    return counts.map((item) => ({
      ...item,
      pct: Math.round((item.reps / maxReps) * 100),
    }));
  }, [activeHabits, filteredDoneCheckIns]);

  const streakSummaries = useMemo(
    () =>
      activeHabits.map((h) => ({
        habit: h,
        summary: getStreakSummary(h, checkIns, todayKey),
      })),
    [activeHabits, checkIns, todayKey]
  );

  const bestStreakLeader = useMemo(() => {
    if (streakSummaries.length === 0) return null;
    return streakSummaries.reduce((best, item) =>
      item.summary.longestStreak > best.summary.longestStreak ? item : best
    );
  }, [streakSummaries]);

  const toggleExpandMilestones = (habitId: string) => {
    setExpandedMilestones((prev) => ({ ...prev, [habitId]: !prev[habitId] }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-28 md:pb-12 space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]">
            Habit progress
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Every action you take is a vote for the type of person you wish to become.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Progress | Milestones segmented toggle */}
          <div
            className="grid grid-cols-2 gap-1 p-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] sm:w-72"
            role="tablist"
            aria-label="Progress sections"
          >
            {(
              [
                { id: 'progress', label: 'Progress' },
                { id: 'milestones', label: 'Milestones' },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[40px] px-5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'progress' && (
            <div
              className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] self-start sm:self-auto"
              role="tablist"
              aria-label="Time range"
            >
              {(
                [
                  { id: 'week', label: 'Week' },
                  { id: 'month', label: 'Month' },
                  { id: 'all', label: 'All time' },
                ] as const
              ).map((tab) => {
                const active = range === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setRange(tab.id)}
                    className={`min-h-[38px] px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {habits.length === 0 ? (
        <section
          className="relative bg-[var(--bg-surface)] rounded-[28px] p-8 sm:p-10 text-center border border-[var(--border-hairline)] overflow-hidden"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <PebbleBlob variant="warm" className="w-56 h-40 mx-auto -mt-2 -mb-4 pointer-events-none select-none" />
          <div className="relative z-10 max-w-sm mx-auto space-y-3">
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              Nothing tracked yet
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Once you create a habit and check in, your repetitions, streaks, and milestones will
              appear here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/create')}
              className="mt-2 inline-flex items-center justify-center min-h-[46px] px-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-semibold cursor-pointer"
            >
              Design a habit
            </button>
          </div>
        </section>
      ) : activeTab === 'progress' ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="Total repetitions" value={filteredDoneCheckIns.length} />
            <StatTile label="Active habits" value={activeHabits.length} />
            <StatTile label="Completion rate" value={`${overallCompletionRate}%`} />
            <StatTile
              label="Best weekday"
              value={bestDay ? bestDay.label.slice(0, 3) : '—'}
              sublabel={bestDay ? `${bestDay.count} completions` : undefined}
            />
          </div>

          <section
            className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)]"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] mb-3">
              Daily repetitions
            </h2>
            <Suspense
              fallback={
                <div className="h-56 flex items-center justify-center text-xs text-[var(--text-muted)]">
                  Loading chart…
                </div>
              }
            >
              <ProgressStackedChart data={chartData} series={chartSeries} />
            </Suspense>
          </section>

          {perHabitStats.length > 0 && (
            <section
              className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)] space-y-3"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                By habit
              </h2>
              <div className="divide-y divide-[var(--border-hairline)]">
                {perHabitStats.map(({ habit, reps, pct }) => {
                  const token = getHabitColor(habit.color);
                  const Icon = getHabitIconComponent(habit.icon);
                  const accent = isDark ? token.darkHex : token.hex;
                  const iconBg = isDark ? token.tintDark : token.tintLight;
                  const iconFg = isDark ? token.textDark : token.textLight;

                  return (
                    <button
                      key={habit.id}
                      type="button"
                      onClick={() => navigate(`/habit/${habit.id}`)}
                      className="w-full py-3.5 flex items-center gap-3.5 text-left hover:opacity-85 transition-opacity cursor-pointer"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: iconBg, color: iconFg }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-medium text-sm text-[var(--text-primary)] truncate">
                            {habit.name}
                          </span>
                          <span className="text-xs font-bold tabular-nums text-[var(--text-secondary)] shrink-0">
                            {reps} reps
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%`, backgroundColor: accent }}
                          />
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Streaks Section */}
          {streakSummaries.length > 0 && (
            <section
              className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)] space-y-4"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div>
                <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Streaks
                </h2>
                {bestStreakLeader && (
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    My best streak is{' '}
                    <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                      {bestStreakLeader.summary.longestStreak}{' '}
                      {bestStreakLeader.summary.longestStreak === 1 ? 'day' : 'days'}
                    </span>{' '}
                    on{' '}
                    <span className="font-semibold underline decoration-[var(--color-primary)]/50 underline-offset-4 text-[var(--text-primary)]">
                      {bestStreakLeader.habit.name}
                    </span>
                  </p>
                )}
              </div>

              <div className="divide-y divide-[var(--border-hairline)]">
                {streakSummaries.map(({ habit, summary }) => {
                  const token = getHabitColor(habit.color);
                  const accent = isDark ? token.darkHex : token.hex;
                  return (
                    <button
                      key={habit.id}
                      type="button"
                      onClick={() => navigate(`/habit/${habit.id}`)}
                      className="w-full py-3.5 flex items-center gap-3.5 text-left hover:opacity-85 transition-opacity cursor-pointer"
                    >
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: isDark ? token.tintDark : token.tintLight,
                          color: accent,
                        }}
                      >
                        <Flame className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                          {summary.currentStreak}{' '}
                          {summary.currentStreak === 1 ? 'day' : 'days'} in a row!
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{habit.name}</p>
                      </div>
                      <span className="text-xs font-medium tabular-nums text-[var(--text-muted)] shrink-0">
                        Best {summary.longestStreak}d
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {retiredHabits.length > 0 && (
            <section
              className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)] space-y-3"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div>
                <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Retired habits
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Habits you paused or graduated from.
                </p>
              </div>
              <div className="divide-y divide-[var(--border-hairline)]">
                {retiredHabits.map((habit) => {
                  const totalReps = getRepetitions(habit.id, checkIns);
                  return (
                    <div key={habit.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {habit.name}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] tabular-nums">
                          {totalReps} total repetitions
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          restoreHabit(habit.id);
                          showToast(`Restored "${habit.name}" to Today`);
                        }}
                        className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-xs font-semibold text-[var(--text-primary)] cursor-pointer shrink-0"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                        Restore
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      ) : (
        /* Milestones Tab */
        <div className="space-y-4">
          {activeHabits.length === 0 ? (
            <section
              className="bg-[var(--bg-surface)] rounded-[24px] p-7 text-center border border-[var(--border-hairline)]"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <p className="font-display text-lg font-semibold text-[var(--text-primary)]">
                No active habits
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Restore a retired habit or create a new one to unlock repetition milestones.
              </p>
            </section>
          ) : (
            streakSummaries.map(({ habit, summary }) => {
              const token = getHabitColor(habit.color);
              const accent = isDark ? token.darkHex : token.hex;
              const Icon = getHabitIconComponent(habit.icon);
              const iconBg = isDark ? token.tintDark : token.tintLight;
              const iconFg = isDark ? token.textDark : token.textLight;
              const expanded = Boolean(expandedMilestones[habit.id]);
              const visibleThresholds = expanded
                ? MILESTONE_THRESHOLDS
                : MILESTONE_THRESHOLDS.slice(0, 3);

              return (
                <section
                  key={habit.id}
                  className="bg-[var(--bg-surface)] rounded-[26px] p-5 sm:p-6 border border-[var(--border-hairline)] space-y-5"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/habit/${habit.id}`)}
                      className="flex items-center gap-3 text-left min-w-0 cursor-pointer"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: iconBg, color: iconFg }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] truncate">
                          {habit.name}
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] truncate">
                          {habit.identity}
                        </p>
                      </div>
                    </button>

                    <div className="text-right shrink-0">
                      <span className="font-display text-3xl font-bold tabular-nums text-[var(--text-primary)] leading-none">
                        {summary.repetitions}
                      </span>
                      <span className="block text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                        repetitions
                      </span>
                    </div>
                  </div>

                  <div
                    className={`grid gap-3 ${
                      expanded ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-3'
                    }`}
                  >
                    {visibleThresholds.map((target) => {
                      const unlocked = summary.repetitions >= target;
                      return (
                        <div key={target} className="flex flex-col items-center text-center gap-1.5">
                          <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg
                              viewBox="0 0 80 80"
                              className="absolute inset-0 w-full h-full"
                              aria-hidden="true"
                            >
                              <path
                                d="M40 4 L71 20 L75 52 L40 76 L5 52 L9 20 Z"
                                fill={unlocked ? accent : 'var(--bg-surface)'}
                                stroke={unlocked ? accent : 'var(--border-strong)'}
                                strokeWidth="3"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span
                              className={`relative z-10 font-display text-lg font-bold tabular-nums ${
                                unlocked ? 'text-white' : 'text-[var(--text-muted)]'
                              }`}
                            >
                              {target}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              unlocked ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                            }`}
                          >
                            {target} {target === 1 ? 'Repetition' : 'Repetitions'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => toggleExpandMilestones(habit.id)}
                      className="inline-flex items-center gap-2 min-h-[42px] px-5 rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <span>{expanded ? 'Show less' : 'View all'}</span>
                      {expanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </section>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

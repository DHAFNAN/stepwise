import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUpDown,
  CalendarClock,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  Plus,
  RotateCcw,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import { HabitCard } from '../../components/HabitCard';
import { PebbleBlob } from '../../components/PebbleBlob';
import { ProgressRing } from '../../components/ProgressRing';
import { Sheet } from '../../components/Sheet';
import { WeekStrip } from '../../components/WeekStrip';
import { triggerSubtleConfetti } from '../../lib/confetti';
import { addDays, formatDisplayDate, getGreeting } from '../../lib/dates';
import { getStreakSummary, isHabitScheduledOnDate } from '../../lib/stats';
import { hapticsService } from '../../services/HapticsService';
import { useHabitStore } from '../../store/habitStore';
import type { Habit } from '../../types/habit';
import { HabitDetailPanel } from '../habit-detail/HabitDetailPanel';
import { HabitReminderScheduleSheet } from '../habit-detail/HabitReminderScheduleSheet';

type TodayPageProps = {
  isDark: boolean;
};

export const TodayPage: React.FC<TodayPageProps> = ({ isDark }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedId = searchParams.get('highlight');

  const todayKey = useHabitStore((s) => s.todayKey);
  const habits = useHabitStore((s) => s.habits);
  const checkIns = useHabitStore((s) => s.checkIns);
  const settings = useHabitStore((s) => s.settings);
  const compactView = useHabitStore((s) => s.compactView);
  const setCompactView = useHabitStore((s) => s.setCompactView);
  const toggleTodayDone = useHabitStore((s) => s.toggleTodayDone);
  const adjustHabitProgress = useHabitStore((s) => s.adjustHabitProgress);
  const setCheckIn = useHabitStore((s) => s.setCheckIn);
  const clearCheckIn = useHabitStore((s) => s.clearCheckIn);
  const reorderHabits = useHabitStore((s) => s.reorderHabits);
  const announce = useHabitStore((s) => s.announce);

  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [reorderMode, setReorderMode] = useState(false);
  const [menuHabit, setMenuHabit] = useState<Habit | null>(null);
  const [scheduleHabit, setScheduleHabit] = useState<Habit | null>(null);
  const [skipNoteMode, setSkipNoteMode] = useState(false);
  const [skipNoteText, setSkipNoteText] = useState('');
  const [desktopDetailId, setDesktopDetailId] = useState<string | null>(null);

  // Sync selectedDate when midnight rolls over
  useEffect(() => {
    setSelectedDate((prev) => (prev > todayKey ? todayKey : prev));
  }, [todayKey]);

  // Clear highlight param after 2.5s
  useEffect(() => {
    if (!highlightedId) return;
    const timer = window.setTimeout(() => {
      setSearchParams({}, { replace: true });
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [highlightedId, setSearchParams]);

  const activeHabits = useMemo(
    () =>
      habits
        .filter((h) => !h.archivedAt)
        .slice()
        .sort((a, b) => a.order - b.order),
    [habits]
  );

  // Default desktop detail selection
  useEffect(() => {
    if (activeHabits.length === 0) {
      setDesktopDetailId(null);
      return;
    }
    if (desktopDetailId && !activeHabits.some((h) => h.id === desktopDetailId)) {
      setDesktopDetailId(activeHabits[0].id);
    }
  }, [activeHabits, desktopDetailId]);

  const scheduledHabits = useMemo(
    () => activeHabits.filter((h) => isHabitScheduledOnDate(h, selectedDate)),
    [activeHabits, selectedDate]
  );

  const checkInMapForDay = useMemo(() => {
    const map = new Map<string, (typeof checkIns)[number]>();
    for (const c of checkIns) {
      if (c.date === selectedDate) {
        map.set(c.habitId, c);
      }
    }
    return map;
  }, [checkIns, selectedDate]);

  const summaryMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getStreakSummary>>();
    for (const h of activeHabits) {
      map.set(h.id, getStreakSummary(h, checkIns, todayKey));
    }
    return map;
  }, [activeHabits, checkIns, todayKey]);

  const orderedDisplayHabits = useMemo(() => {
    if (reorderMode || !settings.moveCompletedToBottom) {
      return scheduledHabits;
    }
    return scheduledHabits.slice().sort((a, b) => {
      const ca = checkInMapForDay.get(a.id);
      const cb = checkInMapForDay.get(b.id);
      const aDone = ca?.status === 'done' || ca?.status === 'minimum' || ca?.status === 'skipped';
      const bDone = cb?.status === 'done' || cb?.status === 'minimum' || cb?.status === 'skipped';
      if (aDone !== bDone) return aDone ? 1 : -1;
      return a.order - b.order;
    });
  }, [scheduledHabits, checkInMapForDay, reorderMode, settings.moveCompletedToBottom]);

  const completedByDate = useMemo(() => {
    const out: Record<string, { done: number; total: number }> = {};
    for (let offset = 0; offset <= 21; offset++) {
      const key = addDays(todayKey, -offset);
      const sched = activeHabits.filter((h) => isHabitScheduledOnDate(h, key));
      let done = 0;
      for (const h of sched) {
        const entry = checkIns.find((c) => c.habitId === h.id && c.date === key);
        if (entry && (entry.status === 'done' || entry.status === 'minimum')) {
          done += 1;
        }
      }
      out[key] = { done, total: sched.length };
    }
    return out;
  }, [activeHabits, checkIns, todayKey]);

  const doneTodayCount = useMemo(() => {
    let count = 0;
    for (const h of scheduledHabits) {
      const entry = checkInMapForDay.get(h.id);
      if (entry && (entry.status === 'done' || entry.status === 'minimum')) {
        count += 1;
      }
    }
    return count;
  }, [scheduledHabits, checkInMapForDay]);

  const allDoneToday = scheduledHabits.length > 0 && doneTodayCount === scheduledHabits.length;

  const handleToggleHabit = (habit: Habit) => {
    const result = toggleTodayDone(habit.id, selectedDate);
    if (result === 'done') {
      hapticsService.success(settings.hapticsEnabled, settings.soundsEnabled);
      triggerSubtleConfetti();
      const prevStreak = summaryMap.get(habit.id)?.currentStreak ?? 0;
      announce(`${habit.name} marked done, streak ${prevStreak + 1}`);
    } else {
      hapticsService.tick(settings.hapticsEnabled);
      announce(`${habit.name} unmarked`);
    }
  };

  const handleAdjustProgress = (habit: Habit, delta: number) => {
    const prevStatus = checkInMapForDay.get(habit.id)?.status;
    const result = adjustHabitProgress(habit.id, selectedDate, delta);
    if (result === 'done' && prevStatus !== 'done') {
      hapticsService.success(settings.hapticsEnabled, settings.soundsEnabled);
      triggerSubtleConfetti();
      announce(`${habit.name} daily goal reached`);
    } else {
      hapticsService.tick(settings.hapticsEnabled);
    }
  };

  const handleMoveHabit = (habitId: string, delta: -1 | 1) => {
    const ids = activeHabits.map((h) => h.id);
    const idx = ids.indexOf(habitId);
    const target = idx + delta;
    if (idx < 0 || target < 0 || target >= ids.length) return;
    const copy = ids.slice();
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    reorderHabits(copy);
  };

  const handleOpenDetail = (habitId: string) => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setDesktopDetailId(habitId);
    } else {
      navigate(`/habit/${habitId}`);
    }
  };

  const menuCheckIn = menuHabit ? checkInMapForDay.get(menuHabit.id) : undefined;
  const selectedDesktopHabit =
    activeHabits.find((h) => h.id === desktopDetailId) ?? activeHabits[0] ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-28 md:pb-10">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-8 lg:items-start">
        {/* Main Today Column */}
        <div className="space-y-5 min-w-0">
          <header className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                {formatDisplayDate(selectedDate)}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] truncate">
                {selectedDate === todayKey ? getGreeting() : 'Past check-in'}
              </h1>
            </div>

            {scheduledHabits.length > 0 && (
              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:inline text-xs font-medium text-[var(--text-secondary)] tabular-nums">
                  {doneTodayCount} of {scheduledHabits.length} done
                </span>
                <ProgressRing done={doneTodayCount} total={scheduledHabits.length} size={50} />
              </div>
            )}
          </header>

          <section
            aria-label="Week calendar"
            className="bg-[var(--bg-surface)] rounded-[24px] p-2.5 sm:p-3 border border-[var(--border-hairline)]"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <WeekStrip
              selectedDate={selectedDate}
              todayKey={todayKey}
              weekStartsOn={settings.weekStartsOn}
              onSelectDate={setSelectedDate}
              completedByDate={completedByDate}
            />
          </section>

          {activeHabits.length > 0 && (
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                {activeHabits.length > 1 && (
                  <button
                    type="button"
                    aria-pressed={reorderMode}
                    onClick={() => setReorderMode((v) => !v)}
                    className={`inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      reorderMode
                        ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {reorderMode ? 'Done reordering' : 'Edit order'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-[var(--text-secondary)]" id="compact-label">
                  Compact view
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={compactView}
                  aria-labelledby="compact-label"
                  onClick={() => setCompactView(!compactView)}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                    compactView ? 'bg-[var(--color-primary)]' : 'bg-[var(--border-strong)]'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      compactView ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {allDoneToday && (
            <div className="rounded-[22px] bg-[var(--color-success)]/12 border border-[var(--color-success)]/25 px-5 py-3.5 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] shrink-0" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                All done for {selectedDate === todayKey ? 'today' : 'this day'}. Nice work.
              </p>
            </div>
          )}

          {/* Empty state when user has 0 active habits */}
          {activeHabits.length === 0 ? (
            <section
              className="relative bg-[var(--bg-surface)] rounded-[28px] p-8 sm:p-10 text-center border border-[var(--border-hairline)] overflow-hidden"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <PebbleBlob className="w-56 h-40 mx-auto -mt-2 -mb-4 pointer-events-none select-none" />
              <div className="relative z-10 max-w-sm mx-auto space-y-4">
                <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] text-balance">
                  No habits yet. Let’s design your first tiny habit.
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Take 60 seconds to pair one small action with a cue and the person you want to
                  become.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/create')}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold text-sm hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create my first habit
                </button>
              </div>
            </section>
          ) : scheduledHabits.length === 0 ? (
            <section
              className="bg-[var(--bg-surface)] rounded-[24px] p-7 text-center border border-[var(--border-hairline)]"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <p className="font-display text-lg font-semibold text-[var(--text-primary)]">
                Nothing scheduled for {formatDisplayDate(selectedDate)}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Enjoy the rest day, or tap another day above to review your habits.
              </p>
            </section>
          ) : (
            <div className="space-y-3">
              {(reorderMode ? activeHabits : orderedDisplayHabits).map((habit, idx, list) => {
                const summary = summaryMap.get(habit.id)!;
                const isHighlighted = habit.id === highlightedId;
                return (
                  <div
                    key={habit.id}
                    className={
                      isHighlighted
                        ? 'rounded-[24px] ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--bg-canvas)] transition-shadow'
                        : ''
                    }
                  >
                    <HabitCard
                      habit={habit}
                      checkIn={checkInMapForDay.get(habit.id)}
                      summary={summary}
                      compact={compactView}
                      isDark={isDark}
                      reorderMode={reorderMode}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < list.length - 1}
                      isSelectedDetail={desktopDetailId === habit.id}
                      onMoveUp={() => handleMoveHabit(habit.id, -1)}
                      onMoveDown={() => handleMoveHabit(habit.id, 1)}
                      onToggleDone={() => handleToggleHabit(habit)}
                      onAdjustProgress={(delta) => handleAdjustProgress(habit, delta)}
                      onOpenMenu={() => {
                        setSkipNoteMode(false);
                        setSkipNoteText(checkInMapForDay.get(habit.id)?.note ?? '');
                        setMenuHabit(habit);
                      }}
                      onOpenDetail={() => handleOpenDetail(habit.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Split Pane Detail */}
        <aside className="hidden lg:block sticky top-6">
          {selectedDesktopHabit ? (
            <HabitDetailPanel habit={selectedDesktopHabit} isDark={isDark} embedded />
          ) : (
            <div
              className="bg-[var(--bg-surface)] rounded-[24px] p-8 border border-[var(--border-hairline)] text-center"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <Sparkles className="w-6 h-6 mx-auto text-[var(--color-primary)] mb-2" />
              <p className="font-display text-lg font-semibold text-[var(--text-primary)]">
                Habit insights live here
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Create a habit on the left to see its streaks, calendar heatmap, and milestones.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Floating + New habit button on Today (mobile) */}
      <button
        type="button"
        onClick={() => navigate('/create')}
        aria-label="New habit"
        className="md:hidden fixed right-4 bottom-22 z-30 inline-flex items-center gap-2 min-h-[52px] px-5 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold text-sm hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all cursor-pointer"
        style={{ boxShadow: 'var(--shadow-float)' }}
      >
        <Plus className="w-5 h-5" />
        <span>New habit</span>
      </button>

      {/* Habit Action Sheet */}
      <Sheet
        open={Boolean(menuHabit)}
        onClose={() => {
          setMenuHabit(null);
          setSkipNoteMode(false);
        }}
        title={menuHabit?.name ?? 'Habit options'}
      >
        {menuHabit && (
          <div className="space-y-2.5">
            {!skipNoteMode ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setCheckIn(menuHabit.id, selectedDate, 'minimum');
                    hapticsService.success(settings.hapticsEnabled, settings.soundsEnabled);
                    announce(`${menuHabit.name} 2-minute version marked done`);
                    setMenuHabit(null);
                  }}
                  className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-left flex items-center gap-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                  <div className="min-w-0 flex-1">
                    <span className="block font-semibold">Did the 2-minute version</span>
                    {menuHabit.twoMinuteVersion && (
                      <span className="block text-xs text-[var(--text-secondary)] truncate">
                        {menuHabit.twoMinuteVersion}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSkipNoteMode(true)}
                  className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-left flex items-center gap-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer"
                >
                  <SkipForward className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span>Skip today</span>
                </button>

                {menuCheckIn && (
                  <button
                    type="button"
                    onClick={() => {
                      clearCheckIn(menuHabit.id, selectedDate);
                      hapticsService.tick(settings.hapticsEnabled);
                      setMenuHabit(null);
                    }}
                    className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-left flex items-center gap-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[var(--text-secondary)]" />
                    <span>Undo check-in</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const target = menuHabit;
                    setMenuHabit(null);
                    setScheduleHabit(target);
                  }}
                  className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-left flex items-center gap-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer"
                >
                  <CalendarClock className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>Schedule &amp; reminders</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const id = menuHabit.id;
                    setMenuHabit(null);
                    navigate(`/edit/${id}`);
                  }}
                  className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-left flex items-center gap-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span>Edit habit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const id = menuHabit.id;
                    setMenuHabit(null);
                    navigate(`/habit/${id}`);
                  }}
                  className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-left flex items-center gap-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span>View details</span>
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="skip-note-input" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Note <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                  </label>
                  <input
                    id="skip-note-input"
                    type="text"
                    value={skipNoteText}
                    onChange={(e) => setSkipNoteText(e.target.value)}
                    placeholder="e.g. Traveling today"
                    maxLength={120}
                    className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSkipNoteMode(false)}
                    className="flex-1 min-h-[46px] rounded-full bg-[var(--bg-subtle)] text-sm font-semibold text-[var(--text-primary)] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckIn(
                        menuHabit.id,
                        selectedDate,
                        'skipped',
                        skipNoteText.trim() || undefined
                      );
                      setSkipNoteMode(false);
                      setMenuHabit(null);
                    }}
                    className="flex-1 min-h-[46px] rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-semibold cursor-pointer"
                  >
                    Confirm skip
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Sheet>

      <HabitReminderScheduleSheet
        habit={scheduleHabit}
        open={Boolean(scheduleHabit)}
        onClose={() => setScheduleHabit(null)}
      />
    </div>
  );
};

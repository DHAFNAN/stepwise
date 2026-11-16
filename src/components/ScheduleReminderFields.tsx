import React, { useState } from 'react';
import { Bell, BellOff, Plus, Send, X } from 'lucide-react';
import { formatTime12h, getShortWeekdayName } from '../lib/dates';
import { GOAL_UNIT_OPTIONS } from '../lib/suggestions';
import {
  formatReminderNotification,
  getReminderTriggerTimes,
  reminderService,
  type ReminderPermissionState,
} from '../services/ReminderService';
import type { GoalScope, Habit, ReminderTiming, WeekStart } from '../types/habit';

type ScheduleReminderFieldsProps = {
  habitId?: string;
  habitName?: string;
  habitIdentity?: string;
  twoMinuteVersion?: string;
  weekStartsOn: WeekStart;
  frequencyType: 'daily' | 'weekdays' | 'custom';
  frequencyDays: number[];
  dailyGoal: number;
  goalUnit: string;
  goalScope: GoalScope;
  habitTimes: string[];
  reminderEnabled: boolean;
  reminderTiming: ReminderTiming;
  reminderTime: string;
  onChangeDays: (days: number[], type: 'daily' | 'weekdays' | 'custom') => void;
  onChangeDailyGoal: (goal: number) => void;
  onChangeGoalUnit: (unit: string) => void;
  onChangeGoalScope: (scope: GoalScope) => void;
  onChangeHabitTimes: (times: string[]) => void;
  onChangeReminderEnabled: (enabled: boolean) => void;
  onChangeReminderTiming: (timing: ReminderTiming) => void;
  onChangeReminderTime: (time: string) => void;
};

const TIMING_OPTIONS: { id: ReminderTiming; label: string }[] = [
  { id: 'at-time', label: 'At time of habit' },
  { id: '5-min-before', label: '5 mins before' },
  { id: '10-min-before', label: '10 mins before' },
  { id: '15-min-before', label: '15 mins before' },
  { id: '30-min-before', label: '30 mins before' },
  { id: 'custom', label: 'Custom time' },
];

function resolveSelectedDays(
  frequencyType: 'daily' | 'weekdays' | 'custom',
  frequencyDays: number[]
): number[] {
  if (frequencyType === 'daily') return [0, 1, 2, 3, 4, 5, 6];
  if (frequencyType === 'weekdays') return [1, 2, 3, 4, 5];
  return frequencyDays;
}

export const ScheduleReminderFields: React.FC<ScheduleReminderFieldsProps> = ({
  habitId = 'preview',
  habitName = '',
  habitIdentity = '',
  twoMinuteVersion = '',
  weekStartsOn,
  frequencyType,
  frequencyDays,
  dailyGoal,
  goalUnit,
  goalScope,
  habitTimes,
  reminderEnabled,
  reminderTiming,
  reminderTime,
  onChangeDays,
  onChangeDailyGoal,
  onChangeGoalUnit,
  onChangeGoalScope,
  onChangeHabitTimes,
  onChangeReminderEnabled,
  onChangeReminderTiming,
  onChangeReminderTime,
}) => {
  const [addingTime, setAddingTime] = useState(false);
  const [newTimeInput, setNewTimeInput] = useState('08:30');
  const [testFeedback, setTestFeedback] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<ReminderPermissionState>(() =>
    reminderService.getPermission()
  );

  const dayOrder = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);
  const activeDays = resolveSelectedDays(frequencyType, frequencyDays);

  const repeatLabel =
    activeDays.length === 7
      ? 'Daily'
      : activeDays.length === 5 &&
          [1, 2, 3, 4, 5].every((d) => activeDays.includes(d))
        ? 'Weekdays'
        : `${activeDays.length} ${activeDays.length === 1 ? 'day' : 'days'}/week`;

  const handleToggleDay = (dayIdx: number) => {
    const exists = activeDays.includes(dayIdx);
    const next = exists ? activeDays.filter((d) => d !== dayIdx) : [...activeDays, dayIdx];
    const sorted = next.slice().sort((a, b) => a - b);
    const nextType: 'daily' | 'weekdays' | 'custom' =
      sorted.length === 7
        ? 'daily'
        : sorted.length === 5 && [1, 2, 3, 4, 5].every((d) => sorted.includes(d))
          ? 'weekdays'
          : 'custom';
    onChangeDays(sorted, nextType);
  };

  const handleAddHabitTime = () => {
    if (!newTimeInput) return;
    if (!habitTimes.includes(newTimeInput)) {
      onChangeHabitTimes([...habitTimes, newTimeInput].sort());
    }
    setAddingTime(false);
  };

  const handleRemoveHabitTime = (timeToRemove: string) => {
    onChangeHabitTimes(habitTimes.filter((t) => t !== timeToRemove));
  };

  const handleToggleReminder = async () => {
    const next = !reminderEnabled;
    onChangeReminderEnabled(next);
    if (!next) return;
    const current = reminderService.getPermission();
    setPermissionState(current);
    if (current === 'default') {
      const result = await reminderService.requestPermission();
      setPermissionState(result);
    }
  };

  const previewHabit: Pick<
    Habit,
    | 'id'
    | 'name'
    | 'identity'
    | 'dailyGoal'
    | 'goalUnit'
    | 'goalScope'
    | 'twoMinuteVersion'
    | 'habitTimes'
    | 'reminderEnabled'
    | 'reminderTiming'
    | 'reminderTime'
  > = {
    id: habitId,
    name: habitName.trim() || 'your small action',
    identity: habitIdentity.trim() || 'your best self',
    dailyGoal,
    goalUnit,
    goalScope,
    twoMinuteVersion: twoMinuteVersion.trim() || undefined,
    habitTimes,
    reminderEnabled,
    reminderTiming,
    reminderTime,
  };
  const triggerTimes = getReminderTriggerTimes(previewHabit as Habit);
  const sampleTriggerTime = triggerTimes[0] ?? reminderTime;
  const notificationPreview = formatReminderNotification(previewHabit, sampleTriggerTime);

  const handleSendTest = async () => {
    const res = await reminderService.sendTestNotification(previewHabit, sampleTriggerTime);
    setPermissionState(reminderService.getPermission());
    if (res === 'sent') {
      setTestFeedback('Test notification sent.');
    } else if (res === 'denied') {
      setTestFeedback('Notifications are blocked in browser settings.');
    } else {
      setTestFeedback('Notifications are not supported in this browser.');
    }
  };

  const isPresetUnit = GOAL_UNIT_OPTIONS.includes(goalUnit);

  return (
    <div className="space-y-6">
      {/* Repeat in week */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Repeat</span>
          <span className="text-xs font-medium text-[var(--text-secondary)]">{repeatLabel}</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {dayOrder.map((dayIdx) => {
            const selected = activeDays.includes(dayIdx);
            const letter = getShortWeekdayName(dayIdx).slice(0, 1);
            return (
              <button
                key={dayIdx}
                type="button"
                aria-label={getShortWeekdayName(dayIdx)}
                aria-pressed={selected}
                onClick={() => handleToggleDay(dayIdx)}
                className={`aspect-square min-h-[44px] rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center justify-center ${
                  selected
                    ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] shadow-sm'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-hairline)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
        {activeDays.length === 0 && (
          <p className="text-xs text-[var(--color-accent)]">
            Choose at least one day of the week.
          </p>
        )}
      </section>

      {/* Per day / session goal + unit */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Goal</span>
          <div className="inline-flex p-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-hairline)]">
            {(
              [
                { id: 'per-day', label: 'Per day' },
                { id: 'per-session', label: 'Per session' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={goalScope === opt.id}
                onClick={() => onChangeGoalScope(opt.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  goalScope === opt.id
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[110px_1fr] gap-2.5">
          <div>
            <label htmlFor="habit-goal-count" className="sr-only">
              Goal amount
            </label>
            <input
              id="habit-goal-count"
              type="number"
              min={1}
              max={999}
              value={dailyGoal}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                onChangeDailyGoal(Number.isFinite(parsed) && parsed >= 1 ? Math.min(999, parsed) : 1);
              }}
              className="w-full min-h-[48px] px-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-base font-semibold tabular-nums text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="flex gap-2">
            <label htmlFor="habit-goal-unit" className="sr-only">
              Goal unit
            </label>
            <select
              id="habit-goal-unit"
              value={isPresetUnit ? goalUnit : '__custom__'}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  onChangeGoalUnit('');
                } else {
                  onChangeGoalUnit(e.target.value);
                }
              }}
              className="flex-1 min-h-[48px] px-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {GOAL_UNIT_OPTIONS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
              <option value="__custom__">Custom unit…</option>
            </select>
            {!isPresetUnit && (
              <input
                type="text"
                aria-label="Custom goal unit"
                value={goalUnit}
                onChange={(e) => onChangeGoalUnit(e.target.value)}
                placeholder="unit"
                maxLength={20}
                className="w-28 min-h-[48px] px-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            )}
          </div>
        </div>
      </section>

      {/* Habit times (+ Add multiple times) */}
      <section className="space-y-2.5">
        <span className="block text-sm font-semibold text-[var(--text-primary)]">
          Habit time <span className="text-xs font-normal text-[var(--text-muted)]">(optional)</span>
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {habitTimes.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 min-h-[40px] pl-3.5 pr-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-semibold tabular-nums text-[var(--text-primary)]"
            >
              <span>{formatTime12h(t)}</span>
              <button
                type="button"
                aria-label={`Remove ${formatTime12h(t)}`}
                onClick={() => handleRemoveHabitTime(t)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {addingTime ? (
            <div className="inline-flex items-center gap-1.5">
              <input
                type="time"
                aria-label="New habit time"
                value={newTimeInput}
                onChange={(e) => setNewTimeInput(e.target.value)}
                className="min-h-[40px] px-3 rounded-full bg-[var(--bg-surface)] border border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)]"
              />
              <button
                type="button"
                onClick={handleAddHabitTime}
                className="min-h-[40px] px-3.5 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-xs font-semibold cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setAddingTime(false)}
                className="min-h-[40px] px-3 rounded-full bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-secondary)] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingTime(true)}
              className="inline-flex items-center gap-1 min-h-[40px] px-4 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          )}
        </div>
      </section>

      {/* Separate Send Reminder System */}
      <section
        className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)] space-y-4"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-tint)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
              {reminderEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Send reminder</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Separate from your cue text; can be changed anytime in this habit.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={reminderEnabled}
            aria-label="Send reminder"
            onClick={() => void handleToggleReminder()}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
              reminderEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--border-strong)]'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                reminderEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {reminderEnabled && (
          <div className="pt-3 border-t border-[var(--border-hairline)] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="habit-reminder-timing" className="text-sm font-medium text-[var(--text-primary)]">
                When to remind
              </label>
              <select
                id="habit-reminder-timing"
                value={reminderTiming}
                onChange={(e) => onChangeReminderTiming(e.target.value as ReminderTiming)}
                className="min-h-[42px] px-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-xs font-semibold text-[var(--text-primary)]"
              >
                {TIMING_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {(reminderTiming === 'custom' || habitTimes.length === 0) && (
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="habit-reminder-custom-time" className="text-sm font-medium text-[var(--text-primary)]">
                  Reminder time
                </label>
                <input
                  id="habit-reminder-custom-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => onChangeReminderTime(e.target.value)}
                  className="min-h-[42px] px-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-sm font-semibold text-[var(--text-primary)]"
                />
              </div>
            )}

            <div className="rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)] p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Notification preview
                </span>
                <button
                  type="button"
                  onClick={() => void handleSendTest()}
                  className="inline-flex items-center gap-1 min-h-[30px] px-2.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[11px] font-semibold text-[var(--text-primary)] hover:bg-[var(--border-strong)]/30 cursor-pointer"
                >
                  <Send className="w-3 h-3 text-[var(--color-primary)]" />
                  Test
                </button>
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  {notificationPreview.title}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  {notificationPreview.body}
                </p>
              </div>
              {testFeedback && (
                <p className="text-[11px] font-medium text-[var(--color-primary)]">
                  {testFeedback}
                </p>
              )}
            </div>

            {permissionState === 'denied' && (
              <p className="text-xs text-[var(--color-warning)] leading-relaxed">
                Browser notifications are currently blocked. Your reminder schedule is saved and
                will work once notifications are allowed in site settings.
              </p>
            )}
            {permissionState === 'unsupported' && (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                This browser does not support notifications; your reminder times are still saved.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

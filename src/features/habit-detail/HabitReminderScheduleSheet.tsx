import React, { useEffect, useState } from 'react';
import { ScheduleReminderFields } from '../../components/ScheduleReminderFields';
import { Sheet } from '../../components/Sheet';
import { formatWhenWherePhrase } from '../../lib/cueFormat';
import { useHabitStore } from '../../store/habitStore';
import type { GoalScope, Habit, ReminderTiming } from '../../types/habit';

type HabitReminderScheduleSheetProps = {
  habit: Habit | null;
  open: boolean;
  onClose: () => void;
};

export const HabitReminderScheduleSheet: React.FC<HabitReminderScheduleSheetProps> = ({
  habit,
  open,
  onClose,
}) => {
  const settings = useHabitStore((s) => s.settings);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const showToast = useHabitStore((s) => s.showToast);

  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekdays' | 'custom'>('daily');
  const [frequencyDays, setFrequencyDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [dailyGoal, setDailyGoal] = useState(1);
  const [goalUnit, setGoalUnit] = useState('times');
  const [goalScope, setGoalScope] = useState<GoalScope>('per-day');
  const [habitTimes, setHabitTimes] = useState<string[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTiming, setReminderTiming] = useState<ReminderTiming>('at-time');
  const [reminderTime, setReminderTime] = useState(settings.defaultReminderTime || '08:00');

  useEffect(() => {
    if (!open || !habit) return;
    setFrequencyType(habit.frequency.type);
    setFrequencyDays(
      habit.frequency.days ??
        (habit.frequency.type === 'weekdays' ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6])
    );
    setDailyGoal(habit.dailyGoal ?? 1);
    setGoalUnit(habit.goalUnit ?? 'times');
    setGoalScope(habit.goalScope ?? 'per-day');
    setHabitTimes(habit.habitTimes ?? (habit.cue.time ? [habit.cue.time] : []));
    setReminderEnabled(habit.reminderEnabled);
    setReminderTiming(habit.reminderTiming ?? 'at-time');
    setReminderTime(habit.reminderTime ?? settings.defaultReminderTime ?? '08:00');
  }, [open, habit, settings.defaultReminderTime]);

  if (!habit) return null;

  const whenWhere = formatWhenWherePhrase(
    habit.whenWhereText || habit.cue.text,
    habit.place || habit.cue.place
  );

  const canSave = frequencyDays.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    updateHabit(habit.id, {
      frequency: {
        type: frequencyType,
        days: frequencyType === 'custom' ? frequencyDays : undefined,
      },
      dailyGoal: Math.max(1, dailyGoal),
      goalUnit: goalUnit.trim() || 'times',
      goalScope,
      habitTimes,
      reminderEnabled,
      reminderTiming,
      reminderTime,
    });
    showToast(`Updated schedule & reminders for "${habit.name}"`);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Adjust schedule & reminders">
      <div className="space-y-6">
        <div className="rounded-2xl bg-[var(--bg-subtle)] px-4 py-3.5 border border-[var(--border-hairline)]">
          <p className="font-display text-sm sm:text-base leading-relaxed text-[var(--text-primary)]">
            I will{' '}
            <span className="font-semibold underline decoration-[var(--color-primary)]/50 underline-offset-4">
              {habit.name}
            </span>
            {whenWhere ? (
              <>
                ,{' '}
                <span className="font-semibold underline decoration-[var(--color-primary)]/50 underline-offset-4">
                  {whenWhere}
                </span>
              </>
            ) : null}{' '}
            so that I can become{' '}
            <span className="font-semibold underline decoration-[var(--color-primary)]/50 underline-offset-4">
              {habit.identity}
            </span>
            .
          </p>
        </div>

        <ScheduleReminderFields
          habitId={habit.id}
          habitName={habit.name}
          habitIdentity={habit.identity}
          twoMinuteVersion={habit.twoMinuteVersion}
          weekStartsOn={settings.weekStartsOn}
          frequencyType={frequencyType}
          frequencyDays={frequencyDays}
          dailyGoal={dailyGoal}
          goalUnit={goalUnit}
          goalScope={goalScope}
          habitTimes={habitTimes}
          reminderEnabled={reminderEnabled}
          reminderTiming={reminderTiming}
          reminderTime={reminderTime}
          onChangeDays={(days, type) => {
            setFrequencyDays(days);
            setFrequencyType(type);
          }}
          onChangeDailyGoal={setDailyGoal}
          onChangeGoalUnit={setGoalUnit}
          onChangeGoalScope={setGoalScope}
          onChangeHabitTimes={setHabitTimes}
          onChangeReminderEnabled={setReminderEnabled}
          onChangeReminderTiming={setReminderTiming}
          onChangeReminderTime={setReminderTime}
        />

        <div className="pt-2 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[48px] rounded-full bg-[var(--bg-subtle)] text-sm font-semibold text-[var(--text-primary)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="flex-[1.5] min-h-[48px] rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-45 transition-colors cursor-pointer"
          >
            Save changes
          </button>
        </div>
      </div>
    </Sheet>
  );
};

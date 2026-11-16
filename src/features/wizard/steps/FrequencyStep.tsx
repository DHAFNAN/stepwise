import React from 'react';
import { ScheduleReminderFields } from '../../../components/ScheduleReminderFields';
import type { GoalScope, ReminderTiming, WeekStart } from '../../../types/habit';

type FrequencyStepProps = {
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

export const FrequencyStep: React.FC<FrequencyStepProps> = (props) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] text-balance">
          Schedule, goal &amp; reminders
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          Set weekly repeat days, your daily or session goal, and optional habit times &amp;
          reminders.
        </p>
      </div>

      <ScheduleReminderFields {...props} />
    </div>
  );
};

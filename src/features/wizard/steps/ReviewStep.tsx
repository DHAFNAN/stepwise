import React from 'react';
import { Bell, Calendar, Check, MapPin, Target } from 'lucide-react';
import { HABIT_COLORS, getHabitColor } from '../../../lib/colors';
import {
  formatCueSummary,
  formatFrequencyLabel,
  formatGoalSummary,
  formatReminderTimingLabel,
  formatWhenWherePhrase,
} from '../../../lib/cueFormat';
import { formatTime12h } from '../../../lib/dates';
import { HABIT_ICONS, getHabitIconComponent } from '../../../lib/icons';
import type { GoalScope, HabitColorId, ReminderTiming } from '../../../types/habit';

type ReviewStepProps = {
  color: HabitColorId;
  icon: string;
  name: string;
  identity: string;
  whenWhereText: string;
  place: string;
  twoMinuteVersion: string;
  frequencyType: 'daily' | 'weekdays' | 'custom';
  frequencyDays: number[];
  dailyGoal: number;
  goalUnit: string;
  goalScope: GoalScope;
  habitTimes: string[];
  reminderEnabled: boolean;
  reminderTiming: ReminderTiming;
  reminderTime: string;
  isDark: boolean;
  onChangeColor: (c: HabitColorId) => void;
  onChangeIcon: (i: string) => void;
};

export const ReviewStep: React.FC<ReviewStepProps> = ({
  color,
  icon,
  name,
  identity,
  whenWhereText,
  place,
  twoMinuteVersion,
  frequencyType,
  frequencyDays,
  dailyGoal,
  goalUnit,
  goalScope,
  habitTimes,
  reminderEnabled,
  reminderTiming,
  reminderTime,
  isDark,
  onChangeColor,
  onChangeIcon,
}) => {
  const colorToken = getHabitColor(color);
  const SelectedIcon = getHabitIconComponent(icon);
  const accentHex = isDark ? colorToken.darkHex : colorToken.hex;
  const iconBg = isDark ? colorToken.tintDark : colorToken.tintLight;
  const iconFg = isDark ? colorToken.textDark : colorToken.textLight;

  const whenWhere = formatWhenWherePhrase(whenWhereText, place);
  const cueSummary = formatCueSummary({ type: 'text', text: whenWhereText }, place, whenWhereText);
  const freqLabel = formatFrequencyLabel({
    frequency: { type: frequencyType, days: frequencyDays },
  });
  const goalLabel = formatGoalSummary({ dailyGoal, goalUnit, goalScope });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] text-balance">
          Style &amp; commit
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          Pick a color and icon, then review your habit details.
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-2.5">Color</p>
        <div className="grid grid-cols-8 gap-2">
          {HABIT_COLORS.map((swatch) => {
            const hex = isDark ? swatch.darkHex : swatch.hex;
            const selected = swatch.id === color;
            return (
              <button
                key={swatch.id}
                type="button"
                aria-label={swatch.label}
                aria-pressed={selected}
                onClick={() => onChangeColor(swatch.id)}
                className={`aspect-square min-h-[40px] rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                  selected ? 'scale-110 ring-2 ring-offset-2 ring-[var(--text-primary)] ring-offset-[var(--bg-canvas)]' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: hex }}
              >
                {selected && <Check className="w-4 h-4 text-white stroke-[2.6]" />}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-2.5">Icon</p>
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {HABIT_ICONS.map(({ id, label, Icon }) => {
            const selected = id === icon;
            return (
              <button
                key={id}
                type="button"
                aria-label={label}
                aria-pressed={selected}
                onClick={() => onChangeIcon(id)}
                className={`min-h-[44px] aspect-square rounded-2xl flex items-center justify-center transition-colors cursor-pointer ${
                  selected
                    ? 'text-white shadow-sm'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-hairline)] hover:bg-[var(--bg-subtle)]'
                }`}
                style={selected ? { backgroundColor: accentHex } : undefined}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      </div>

      <section
        aria-label="Commitment card"
        className="bg-[var(--bg-surface)] rounded-[24px] p-6 border border-[var(--border-hairline)] space-y-4"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: iconBg, color: iconFg }}
          >
            <SelectedIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)]">Your commitment</p>
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">{name}</h2>
          </div>
        </div>

        <p className="text-base leading-relaxed text-[var(--text-primary)]">
          I will <strong>{name}</strong>, {whenWhere} so that I can become{' '}
          <strong>{identity}</strong>.
        </p>

        {twoMinuteVersion.trim() && (
          <p className="text-xs text-[var(--text-secondary)]">
            2-minute fallback:{' '}
            <span className="font-medium text-[var(--text-primary)]">{twoMinuteVersion.trim()}</span>
          </p>
        )}

        <div className="pt-3 border-t border-[var(--border-hairline)] flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {cueSummary}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {freqLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            {goalLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            {reminderEnabled
              ? `${formatReminderTimingLabel(reminderTiming, reminderTime)}${
                  habitTimes.length > 0 && reminderTiming !== 'custom'
                    ? ` (${habitTimes.map(formatTime12h).join(', ')})`
                    : ''
                }`
              : 'No reminder'}
          </span>
        </div>
      </section>
    </div>
  );
};

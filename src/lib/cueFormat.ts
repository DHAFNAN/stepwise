import { formatTime12h } from './dates';
import type { Habit, HabitCue, ReminderTiming } from '../types/habit';

export function formatCueSummary(
  cue: HabitCue,
  place?: string,
  whenWhereText?: string
): string {
  const parts: string[] = [];

  if (whenWhereText?.trim()) {
    parts.push(whenWhereText.trim());
  } else if (cue.text?.trim()) {
    parts.push(cue.text.trim());
  } else if (cue.type === 'time' && cue.time) {
    parts.push(`At ${formatTime12h(cue.time)}`);
  } else if (cue.type === 'after-habit' && cue.anchor) {
    const cleanAnchor = cue.anchor.trim();
    const hasSubject = /^(i|my|the)\b/i.test(cleanAnchor);
    parts.push(hasSubject ? `After ${cleanAnchor}` : `After I ${cleanAnchor}`);
  } else if (cue.type === 'location' && cue.place) {
    parts.push(`At ${cue.place}`);
  }

  const effectivePlace = place?.trim() || (cue.type !== 'location' ? cue.place?.trim() : '');
  if (effectivePlace && !parts.some((p) => p.toLowerCase().includes(effectivePlace.toLowerCase()))) {
    parts.push(effectivePlace);
  }

  return parts.join(' · ') || 'Anytime';
}

export function formatWhenWherePhrase(whenWhereText?: string, place?: string): string {
  const main = whenWhereText?.trim() ?? '';
  const extraPlace = place?.trim() ?? '';
  if (main && extraPlace && !main.toLowerCase().includes(extraPlace.toLowerCase())) {
    return `${main} (${extraPlace})`;
  }
  if (main) return main;
  if (extraPlace) return `at ${extraPlace}`;
  return '';
}

export function formatFrequencyLabel(habit: Pick<Habit, 'frequency'>): string {
  if (habit.frequency.type === 'daily') return 'Daily';
  if (habit.frequency.type === 'weekdays') return 'Weekdays';
  const days = habit.frequency.days ?? [];
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (days.length === 7) return 'Daily';
  if (days.length === 0) return 'Custom';
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => names[d])
    .join(', ');
}

export function formatGoalSummary(habit: Pick<Habit, 'dailyGoal' | 'goalUnit' | 'goalScope'>): string {
  const goal = habit.dailyGoal ?? 1;
  const unit = habit.goalUnit?.trim() || 'times';
  const scope = habit.goalScope === 'per-session' ? 'session' : 'day';
  if (goal <= 1 && unit === 'times' && scope === 'day') {
    return 'Once a day';
  }
  const unitLabel = goal === 1 && unit.endsWith('s') && unit !== 'times' ? unit.slice(0, -1) : unit;
  return `${goal} ${unitLabel}/${scope}`;
}

export function formatReminderTimingLabel(timing?: ReminderTiming, customTime?: string): string {
  switch (timing) {
    case '5-min-before':
      return '5 mins before';
    case '10-min-before':
      return '10 mins before';
    case '15-min-before':
      return '15 mins before';
    case '30-min-before':
      return '30 mins before';
    case 'custom':
      return customTime ? `At ${formatTime12h(customTime)}` : 'Custom time';
    case 'at-time':
    default:
      return 'At time of habit';
  }
}

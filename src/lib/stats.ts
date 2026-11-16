import { addDays, diffDays, getFullWeekdayName, getTodayKey, getWeekday, toLocalDateKey } from './dates';
import type { CheckIn, Habit } from '../types/habit';

export type StreakSummary = {
  currentStreak: number;
  longestStreak: number;
  repetitions: number;
  neverMissTwice: boolean;
  needsGentleNudge: boolean;
  completionRate7d: number;
  completionRate30d: number;
  bestWeekday: { dayIndex: number; label: string; count: number } | null;
};

export function isHabitScheduledOnDate(habit: Habit, dateKey: string): boolean {
  const dow = getWeekday(dateKey);
  if (habit.frequency.type === 'daily') return true;
  if (habit.frequency.type === 'weekdays') return dow >= 1 && dow <= 5;
  const days = habit.frequency.days ?? [];
  return days.includes(dow);
}

export function getRepetitions(habitId: string, checkIns: CheckIn[]): number {
  let count = 0;
  for (const c of checkIns) {
    if (c.habitId === habitId && (c.status === 'done' || c.status === 'minimum')) {
      count += 1;
    }
  }
  return count;
}

function getHabitStartKey(habit: Habit, habitCheckIns: CheckIn[], todayKey: string): string {
  const createdKey = toLocalDateKey(new Date(habit.createdAt));
  let earliest = createdKey <= todayKey ? createdKey : todayKey;
  for (const c of habitCheckIns) {
    if (c.date < earliest) {
      earliest = c.date;
    }
  }
  return earliest;
}

export function getStreakSummary(
  habit: Habit,
  allCheckIns: CheckIn[],
  todayKey: string = getTodayKey()
): StreakSummary {
  const habitCheckIns = allCheckIns.filter((c) => c.habitId === habit.id && c.date <= todayKey);
  const byDate = new Map<string, CheckIn>();
  for (const c of habitCheckIns) {
    byDate.set(c.date, c);
  }

  const repetitions = habitCheckIns.filter(
    (c) => c.status === 'done' || c.status === 'minimum'
  ).length;

  const startKey = getHabitStartKey(habit, habitCheckIns, todayKey);
  const totalSpanDays = Math.min(730, Math.max(0, diffDays(startKey, todayKey)));

  // 1. Current streak (walking backwards from todayKey)
  let currentStreak = 0;
  let consecutiveMisses = 0;
  let missedImmediatelyBeforeToday = false;
  let brokeOnTwoMisses = false;

  for (let offset = 0; offset <= totalSpanDays; offset++) {
    const dateKey = addDays(todayKey, -offset);
    if (!isHabitScheduledOnDate(habit, dateKey)) {
      continue;
    }

    const checkIn = byDate.get(dateKey);
    if (dateKey === todayKey && !checkIn) {
      // Today is still in progress; do not treat pending check-in as a miss.
      continue;
    }

    if (checkIn && (checkIn.status === 'done' || checkIn.status === 'minimum')) {
      currentStreak += 1;
      consecutiveMisses = 0;
    } else if (checkIn && checkIn.status === 'skipped') {
      // Intentional skip is neutral: neither adds nor breaks continuity.
      continue;
    } else {
      consecutiveMisses += 1;
      if (consecutiveMisses === 1 && currentStreak === 0) {
        missedImmediatelyBeforeToday = true;
      }
      if (consecutiveMisses >= 2) {
        brokeOnTwoMisses = true;
        break;
      }
    }
  }

  const neverMissTwice = currentStreak > 0 && missedImmediatelyBeforeToday && !brokeOnTwoMisses;
  const needsGentleNudge = currentStreak === 0 && brokeOnTwoMisses;

  // 2. Longest streak (walking forward chronologically)
  let longestStreak = 0;
  let running = 0;
  let forwardMisses = 0;

  for (let offset = totalSpanDays; offset >= 0; offset--) {
    const dateKey = addDays(todayKey, -offset);
    if (!isHabitScheduledOnDate(habit, dateKey)) {
      continue;
    }

    const checkIn = byDate.get(dateKey);
    if (dateKey === todayKey && !checkIn) {
      continue;
    }

    if (checkIn && (checkIn.status === 'done' || checkIn.status === 'minimum')) {
      running += 1;
      forwardMisses = 0;
      if (running > longestStreak) longestStreak = running;
    } else if (checkIn && checkIn.status === 'skipped') {
      continue;
    } else {
      forwardMisses += 1;
      if (forwardMisses >= 2) {
        running = 0;
      }
    }
  }

  // 3. Completion rates
  const completionRate7d = getCompletionRate(habit, habitCheckIns, 7, todayKey);
  const completionRate30d = getCompletionRate(habit, habitCheckIns, 30, todayKey);

  // 4. Best weekday
  const bestWeekday = getBestWeekday(habitCheckIns);

  return {
    currentStreak,
    longestStreak,
    repetitions,
    neverMissTwice,
    needsGentleNudge,
    completionRate7d,
    completionRate30d,
    bestWeekday,
  };
}

export function getCompletionRate(
  habit: Habit,
  habitCheckIns: CheckIn[],
  windowDays: number,
  todayKey: string = getTodayKey()
): number {
  const byDate = new Map<string, CheckIn>();
  for (const c of habitCheckIns) {
    if (c.habitId === habit.id && c.date <= todayKey) {
      byDate.set(c.date, c);
    }
  }

  const startKey = getHabitStartKey(habit, habitCheckIns, todayKey);
  const windowStart = addDays(todayKey, -(windowDays - 1));
  const effectiveStart = startKey > windowStart ? startKey : windowStart;
  const span = diffDays(effectiveStart, todayKey);

  if (span < 0) return 0;

  let scheduled = 0;
  let completed = 0;

  for (let i = 0; i <= span; i++) {
    const dateKey = addDays(effectiveStart, i);
    if (!isHabitScheduledOnDate(habit, dateKey)) continue;

    const entry = byDate.get(dateKey);
    // If today has not been checked in yet and there are prior days, still count today only if checked or if it's the only day.
    if (dateKey === todayKey && !entry && scheduled > 0) {
      continue;
    }
    scheduled += 1;
    if (entry && (entry.status === 'done' || entry.status === 'minimum')) {
      completed += 1;
    }
  }

  if (scheduled === 0) return 0;
  return Math.round((completed / scheduled) * 100);
}

export function getBestWeekday(
  checkIns: CheckIn[]
): { dayIndex: number; label: string; count: number } | null {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  let total = 0;
  for (const c of checkIns) {
    if (c.status === 'done' || c.status === 'minimum') {
      const dow = getWeekday(c.date);
      counts[dow] += 1;
      total += 1;
    }
  }
  if (total === 0) return null;

  let bestIdx = 0;
  for (let i = 1; i < 7; i++) {
    if (counts[i] > counts[bestIdx]) {
      bestIdx = i;
    }
  }

  return {
    dayIndex: bestIdx,
    label: getFullWeekdayName(bestIdx),
    count: counts[bestIdx],
  };
}

export function getWeeklyCompletionBuckets(
  habitId: string,
  checkIns: CheckIn[],
  weeksCount = 8,
  todayKey: string = getTodayKey()
): { weekLabel: string; count: number }[] {
  const buckets: { weekLabel: string; count: number }[] = [];
  const habitDone = checkIns.filter(
    (c) => c.habitId === habitId && (c.status === 'done' || c.status === 'minimum') && c.date <= todayKey
  );

  for (let w = weeksCount - 1; w >= 0; w--) {
    const endKey = addDays(todayKey, -w * 7);
    const startKey = addDays(endKey, -6);
    const count = habitDone.filter((c) => c.date >= startKey && c.date <= endKey).length;
    const [, m, d] = startKey.split('-').map(Number);
    buckets.push({
      weekLabel: `${m}/${d}`,
      count,
    });
  }
  return buckets;
}

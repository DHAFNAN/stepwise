import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, diffDays, getMonthGridDays, getWeekDates } from './dates';
import { getCompletionRate, getRepetitions, getStreakSummary, isHabitScheduledOnDate } from './stats';
import {
  formatReminderNotification,
  getReminderTriggerTimes,
  subtractMinutesHHMM,
} from '../services/ReminderService';
import type { CheckIn, Habit } from '../types/habit';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'hab_1',
    name: 'Read 10 pages',
    identity: 'a reader',
    whenWhereText: 'after morning coffee',
    cue: { type: 'text', text: 'after morning coffee' },
    frequency: { type: 'daily' },
    dailyGoal: 1,
    goalUnit: 'times',
    goalScope: 'per-day',
    color: 'teal',
    icon: 'book-open',
    reminderEnabled: false,
    createdAt: '2026-03-01T08:00:00.000Z',
    order: 0,
    ...overrides,
  };
}

function makeCheckIn(date: string, status: CheckIn['status'] = 'done', habitId = 'hab_1'): CheckIn {
  return {
    id: `chk_${date}`,
    habitId,
    date,
    status,
    createdAt: `${date}T09:00:00.000Z`,
  };
}

test('repetitions count only done and minimum, excluding skipped and partial', () => {
  const checkIns: CheckIn[] = [
    makeCheckIn('2026-03-01', 'done'),
    makeCheckIn('2026-03-02', 'minimum'),
    makeCheckIn('2026-03-03', 'skipped'),
    makeCheckIn('2026-03-04', 'partial'),
    makeCheckIn('2026-03-05', 'done', 'other_habit'),
  ];
  assert.equal(getRepetitions('hab_1', checkIns), 2);
});

test('never-miss-twice preserves streak across a single missed day and resets after two consecutive misses', () => {
  const habit = makeHabit({ createdAt: '2026-03-01T08:00:00.000Z' });

  const oneMissPending = [makeCheckIn('2026-03-01', 'done')];
  const s1 = getStreakSummary(habit, oneMissPending, '2026-03-03');
  assert.equal(s1.currentStreak, 1);
  assert.equal(s1.neverMissTwice, true);
  assert.equal(s1.needsGentleNudge, false);

  const recovered = [makeCheckIn('2026-03-01', 'done'), makeCheckIn('2026-03-03', 'minimum')];
  const s2 = getStreakSummary(habit, recovered, '2026-03-03');
  assert.equal(s2.currentStreak, 2);
  assert.equal(s2.neverMissTwice, false);

  const twoMisses = [makeCheckIn('2026-03-01', 'done')];
  const s3 = getStreakSummary(habit, twoMisses, '2026-03-04');
  assert.equal(s3.currentStreak, 0);
  assert.equal(s3.longestStreak, 1);
  assert.equal(s3.needsGentleNudge, true);
});

test('skipped days bridge continuity without breaking streak or inflating repetitions', () => {
  const habit = makeHabit({ createdAt: '2026-03-01T08:00:00.000Z' });
  const checkIns = [
    makeCheckIn('2026-03-01', 'done'),
    makeCheckIn('2026-03-02', 'skipped'),
    makeCheckIn('2026-03-03', 'skipped'),
    makeCheckIn('2026-03-04', 'done'),
  ];
  const summary = getStreakSummary(habit, checkIns, '2026-03-04');
  assert.equal(summary.repetitions, 2);
  assert.equal(summary.currentStreak, 2);
  assert.equal(summary.needsGentleNudge, false);
});

test('non-daily weekdays and custom schedules ignore unscheduled weekend days', () => {
  const weekdayHabit = makeHabit({
    createdAt: '2026-03-06T08:00:00.000Z',
    frequency: { type: 'weekdays' },
  });
  assert.equal(isHabitScheduledOnDate(weekdayHabit, '2026-03-07'), false);
  assert.equal(isHabitScheduledOnDate(weekdayHabit, '2026-03-08'), false);
  assert.equal(isHabitScheduledOnDate(weekdayHabit, '2026-03-09'), true);

  const checkIns = [makeCheckIn('2026-03-06', 'done'), makeCheckIn('2026-03-09', 'done')];
  const summary = getStreakSummary(weekdayHabit, checkIns, '2026-03-09');
  assert.equal(summary.currentStreak, 2);
  assert.equal(summary.completionRate7d, 100);
});

test('back-filling earlier than createdAt updates repetitions, streak, and completion rate', () => {
  const habit = makeHabit({ createdAt: '2026-03-10T08:00:00.000Z' });
  const checkIns = [
    makeCheckIn('2026-03-08', 'done'),
    makeCheckIn('2026-03-09', 'done'),
    makeCheckIn('2026-03-10', 'done'),
  ];
  const summary = getStreakSummary(habit, checkIns, '2026-03-10');
  assert.equal(summary.repetitions, 3);
  assert.equal(summary.currentStreak, 3);
  assert.equal(getCompletionRate(habit, checkIns, 7, '2026-03-10'), 100);
});

test('date arithmetic handles month boundaries and DST transitions cleanly', () => {
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(addDays('2026-03-07', 2), '2026-03-09');
  assert.equal(diffDays('2026-03-07', '2026-03-09'), 2);
  assert.equal(addDays('2026-10-31', 2), '2026-11-02');
  assert.equal(diffDays('2026-10-31', '2026-11-02'), 2);

  const week = getWeekDates('2026-03-01', 1);
  assert.equal(week[0], '2026-02-23');
  assert.equal(week[6], '2026-03-01');

  const grid = getMonthGridDays(2026, 2, 1);
  assert.equal(grid.length % 7, 0);
  assert.equal(grid.filter((c) => c.inMonth).length, 31);
});

test('multi-time reminder trigger calculation handles offsets and custom times', () => {
  assert.equal(subtractMinutesHHMM('00:10', 15), '23:55');
  assert.equal(subtractMinutesHHMM('13:00', 5), '12:55');

  const multiHabit = makeHabit({
    habitTimes: ['05:20', '13:00', '19:20'],
    reminderEnabled: true,
    reminderTiming: '10-min-before',
  });
  assert.deepEqual(getReminderTriggerTimes(multiHabit), ['05:10', '12:50', '19:10']);

  const customHabit = makeHabit({
    habitTimes: ['05:20', '13:00'],
    reminderEnabled: true,
    reminderTiming: 'custom',
    reminderTime: '07:45',
  });
  assert.deepEqual(getReminderTriggerTimes(customHabit), ['07:45']);
});

test('reminder notification formats title with goal/identity and body with small action and time', () => {
  const prayHabit = makeHabit({
    name: 'Pray',
    identity: 'a better Muslim',
    dailyGoal: 5,
    goalUnit: 'times',
    goalScope: 'per-day',
  });
  const payload = formatReminderNotification(prayHabit, '05:20');
  assert.equal(payload.title, '5 times/day · Become a better Muslim');
  assert.equal(payload.body, 'Hi! "Pray" at 5:20 AM — one small step toward success.');

  const twoMinHabit = makeHabit({
    name: 'Read 10 pages',
    twoMinuteVersion: 'Read 1 page',
    identity: 'become a reader',
    dailyGoal: 10,
    goalUnit: 'pages',
    goalScope: 'per-session',
  });
  const payload2 = formatReminderNotification(twoMinHabit, '20:30');
  assert.equal(payload2.title, '10 pages/session · Become a reader');
  assert.equal(payload2.body, 'Hi! "Read 1 page" at 8:30 PM — one small step toward success.');
});

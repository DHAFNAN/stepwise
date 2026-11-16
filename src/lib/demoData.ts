import { addDays, getTodayKey } from './dates';
import { createId } from './ids';
import type { CheckIn, Habit } from '../types/habit';

export function buildDemoData(): { habits: Habit[]; checkIns: CheckIn[] } {
  const today = getTodayKey();
  const created14 = `${addDays(today, -18)}T08:00:00.000Z`;

  const habits: Habit[] = [
    {
      id: createId('hab'),
      name: 'Drink water',
      identity: 'someone who cares for my energy',
      whenWhereText: 'throughout the day',
      cue: { type: 'text', text: 'throughout the day' },
      place: 'Kitchen & desk',
      twoMinuteVersion: 'Take 3 sips of water',
      makeItObvious: 'Keep a filled water bottle right beside my laptop.',
      makeItAttractive: 'Add a slice of lemon in the morning.',
      frequency: { type: 'daily' },
      dailyGoal: 5,
      goalUnit: 'glasses',
      goalScope: 'per-day',
      habitTimes: ['08:00', '11:00', '14:00', '17:00', '20:00'],
      color: 'teal',
      icon: 'droplets',
      reminderEnabled: true,
      reminderTiming: 'at-time',
      reminderTime: '08:00',
      createdAt: created14,
      order: 0,
    },
    {
      id: createId('hab'),
      name: 'Read 10 pages',
      identity: 'a reader',
      whenWhereText: 'after morning coffee',
      cue: { type: 'text', text: 'after morning coffee', place: 'Reading chair' },
      place: 'Reading chair',
      twoMinuteVersion: 'Read 1 page',
      makeItObvious: 'Leave my book right next to the kettle each evening.',
      makeItAttractive: 'Enjoy the first warm sip of coffee while reading.',
      frequency: { type: 'daily' },
      dailyGoal: 1,
      goalUnit: 'times',
      goalScope: 'per-day',
      habitTimes: ['08:30'],
      color: 'amber',
      icon: 'book-open',
      reminderEnabled: false,
      reminderTiming: 'at-time',
      createdAt: created14,
      order: 1,
    },
    {
      id: createId('hab'),
      name: 'Walk 10 minutes',
      identity: 'an active person',
      whenWhereText: 'after lunch',
      cue: { type: 'text', text: 'after lunch', place: 'Neighborhood loop' },
      place: 'Neighborhood loop',
      twoMinuteVersion: 'Put on shoes and walk to the corner',
      makeItObvious: 'Leave walking shoes by the front door.',
      makeItAttractive: 'Listen to a favorite playlist.',
      frequency: { type: 'weekdays' },
      dailyGoal: 10,
      goalUnit: 'minutes',
      goalScope: 'per-session',
      habitTimes: ['13:00'],
      color: 'coral',
      icon: 'footprints',
      reminderEnabled: false,
      reminderTiming: '5-min-before',
      createdAt: created14,
      order: 2,
    },
    {
      id: createId('hab'),
      name: 'Write 3 gratitude lines',
      identity: 'a writer',
      whenWhereText: 'before bed',
      cue: { type: 'text', text: 'before bed', place: 'Nightstand' },
      place: 'Nightstand',
      twoMinuteVersion: 'Write 1 sentence',
      makeItObvious: 'Keep a small notebook and pen on the pillow.',
      frequency: { type: 'daily' },
      dailyGoal: 1,
      goalUnit: 'times',
      goalScope: 'per-day',
      color: 'violet',
      icon: 'pen-tool',
      reminderEnabled: false,
      createdAt: created14,
      archivedAt: `${addDays(today, -2)}T21:00:00.000Z`,
      order: 3,
    },
  ];

  const checkIns: CheckIn[] = [];

  for (let d = 16; d >= 1; d--) {
    if (d === 3) continue;
    const dateKey = addDays(today, -d);
    checkIns.push({
      id: createId('chk'),
      habitId: habits[0].id,
      date: dateKey,
      status: 'done',
      progressCount: 5,
      createdAt: `${dateKey}T20:15:00.000Z`,
    });
  }

  for (let d = 14; d >= 2; d--) {
    const dateKey = addDays(today, -d);
    checkIns.push({
      id: createId('chk'),
      habitId: habits[1].id,
      date: dateKey,
      status: d % 5 === 0 ? 'minimum' : 'done',
      progressCount: 1,
      createdAt: `${dateKey}T08:45:00.000Z`,
    });
  }

  for (let d = 14; d >= 4; d--) {
    const dateKey = addDays(today, -d);
    const dow = new Date(`${dateKey}T12:00:00`).getDay();
    if (dow === 0 || dow === 6) continue;
    checkIns.push({
      id: createId('chk'),
      habitId: habits[2].id,
      date: dateKey,
      status: d === 8 ? 'skipped' : 'done',
      progressCount: d === 8 ? 0 : 10,
      createdAt: `${dateKey}T13:15:00.000Z`,
    });
  }

  for (let d = 16; d >= 5; d--) {
    const dateKey = addDays(today, -d);
    checkIns.push({
      id: createId('chk'),
      habitId: habits[3].id,
      date: dateKey,
      status: 'done',
      progressCount: 1,
      createdAt: `${dateKey}T22:00:00.000Z`,
    });
  }

  return { habits, checkIns };
}

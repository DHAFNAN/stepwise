import { formatCueSummary } from '../lib/cueFormat';
import { SCHEMA_VERSION, STORAGE_KEY } from '../lib/constants';
import type { AppSettings, Habit, StoreDataV1 } from '../types/habit';

export interface StorageService {
  load(): { data: StoreDataV1; corrupted: boolean };
  save(data: StoreDataV1): void;
  clear(): void;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  weekStartsOn: 1,
  defaultReminderTime: '08:30',
  moveCompletedToBottom: true,
  hapticsEnabled: true,
  soundsEnabled: false,
};

export function getDefaultStoreData(): StoreDataV1 {
  return {
    schemaVersion: SCHEMA_VERSION,
    onboardingDone: false,
    habits: [],
    checkIns: [],
    settings: { ...DEFAULT_SETTINGS },
    wizardDraft: null,
  };
}

function normalizeHabit(raw: Habit): Habit {
  const whenWhereText =
    raw.whenWhereText ??
    (raw.cue?.text || formatCueSummary(raw.cue ?? { type: 'text' }, raw.place));

  const habitTimes = Array.isArray(raw.habitTimes)
    ? raw.habitTimes
    : raw.cue?.time
      ? [raw.cue.time]
      : raw.reminderTime
        ? [raw.reminderTime]
        : [];

  return {
    ...raw,
    whenWhereText: whenWhereText === 'Anytime' ? '' : whenWhereText,
    dailyGoal: typeof raw.dailyGoal === 'number' && raw.dailyGoal >= 1 ? raw.dailyGoal : 1,
    goalUnit: raw.goalUnit?.trim() || 'times',
    goalScope: raw.goalScope === 'per-session' ? 'per-session' : 'per-day',
    habitTimes,
    reminderTiming: raw.reminderTiming ?? 'at-time',
  };
}

export function migrateStoreData(raw: unknown): StoreDataV1 {
  const fallback = getDefaultStoreData();
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const obj = raw as Record<string, unknown>;
  const rawHabits = Array.isArray(obj.habits) ? obj.habits : [];
  const checkIns = Array.isArray(obj.checkIns) ? obj.checkIns : [];
  const rawSettings = (obj.settings && typeof obj.settings === 'object' ? obj.settings : {}) as Partial<AppSettings>;

  const habits = rawHabits
    .filter((h): h is Habit => Boolean(h && typeof h === 'object' && typeof (h as { id?: unknown }).id === 'string'))
    .map(normalizeHabit);

  return {
    schemaVersion: SCHEMA_VERSION,
    onboardingDone: Boolean(obj.onboardingDone),
    habits,
    checkIns: checkIns.filter(
      (c) =>
        c &&
        typeof c === 'object' &&
        typeof (c as { habitId?: unknown }).habitId === 'string' &&
        typeof (c as { date?: unknown }).date === 'string'
    ),
    settings: {
      ...DEFAULT_SETTINGS,
      ...rawSettings,
    },
    wizardDraft: null,
  };
}

class WebLocalStorageService implements StorageService {
  load(): { data: StoreDataV1; corrupted: boolean } {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { data: getDefaultStoreData(), corrupted: false };
      }
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { data: getDefaultStoreData(), corrupted: false };
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return { data: getDefaultStoreData(), corrupted: true };
      }
      return { data: migrateStoreData(parsed), corrupted: false };
    } catch {
      return { data: getDefaultStoreData(), corrupted: true };
    }
  }

  save(data: StoreDataV1): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch {
      // Ignore quota / private-mode storage exceptions safely
    }
  }

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }
}

export const storageService: StorageService = new WebLocalStorageService();

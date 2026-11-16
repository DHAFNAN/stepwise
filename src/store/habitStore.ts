import { create } from 'zustand';
import { APP_NAME, SCHEMA_VERSION } from '../lib/constants';
import { getTodayKey } from '../lib/dates';
import { buildDemoData } from '../lib/demoData';
import { createId } from '../lib/ids';
import { reminderService } from '../services/ReminderService';
import {
  DEFAULT_SETTINGS,
  getDefaultStoreData,
  migrateStoreData,
  storageService,
} from '../services/StorageService';
import type {
  AppSettings,
  CheckIn,
  CheckInStatus,
  Habit,
  StoreDataV1,
  WizardDraft,
} from '../types/habit';

export type UndoAction = {
  id: string;
  message: string;
  restore: () => void;
};

type HabitStoreState = {
  schemaVersion: number;
  onboardingDone: boolean;
  habits: Habit[];
  checkIns: CheckIn[];
  settings: AppSettings;
  wizardDraft: WizardDraft | null;
  todayKey: string;
  compactView: boolean;
  storageCorruptedWarning: boolean;
  toast: { id: string; message: string; undo?: () => void } | null;
  srAnnouncement: string;

  refreshTodayKey: () => void;
  setOnboardingDone: (done: boolean) => void;
  setCompactView: (compact: boolean) => void;
  dismissStorageWarning: () => void;
  showToast: (message: string, undo?: () => void) => void;
  dismissToast: () => void;
  announce: (text: string) => void;

  createHabit: (habitInput: Omit<Habit, 'id' | 'createdAt' | 'order'>) => Habit;
  updateHabit: (habitId: string, patch: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void;
  archiveHabit: (habitId: string) => void;
  restoreHabit: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;
  reorderHabits: (orderedIds: string[]) => void;

  setCheckIn: (habitId: string, dateKey: string, status: CheckInStatus, note?: string) => void;
  clearCheckIn: (habitId: string, dateKey: string) => void;
  toggleTodayDone: (habitId: string, dateKey: string) => CheckInStatus | null;
  adjustHabitProgress: (habitId: string, dateKey: string, delta: number) => CheckInStatus | null;

  saveWizardDraft: (draft: WizardDraft | null) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;

  exportJson: () => string;
  importJson: (jsonText: string) => { ok: boolean; error?: string };
  resetAllData: () => void;
  loadDemoData: () => void;
};

let persistTimer: number | undefined;
function schedulePersist(state: HabitStoreState): void {
  if (typeof window === 'undefined') return;
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    const payload: StoreDataV1 = {
      schemaVersion: SCHEMA_VERSION,
      onboardingDone: state.onboardingDone,
      habits: state.habits,
      checkIns: state.checkIns,
      settings: state.settings,
      wizardDraft: state.wizardDraft,
    };
    storageService.save(payload);
    reminderService.syncReminders(state.habits);
  }, 120);
}

const initialLoad = storageService.load();

export const useHabitStore = create<HabitStoreState>((set, get) => ({
  schemaVersion: initialLoad.data.schemaVersion,
  onboardingDone: initialLoad.data.onboardingDone,
  habits: initialLoad.data.habits,
  checkIns: initialLoad.data.checkIns,
  settings: initialLoad.data.settings,
  wizardDraft: initialLoad.data.wizardDraft,
  todayKey: getTodayKey(),
  compactView: false,
  storageCorruptedWarning: initialLoad.corrupted,
  toast: initialLoad.corrupted
    ? {
        id: createId('tst'),
        message: 'Saved data could not be read, so we started with clean defaults.',
      }
    : null,
  srAnnouncement: '',

  refreshTodayKey: () => {
    const next = getTodayKey();
    if (next !== get().todayKey) {
      set({ todayKey: next });
      reminderService.syncReminders(get().habits);
    }
  },

  setOnboardingDone: (done) => {
    set({ onboardingDone: done });
    schedulePersist(get());
  },

  setCompactView: (compact) => set({ compactView: compact }),

  dismissStorageWarning: () => set({ storageCorruptedWarning: false }),

  showToast: (message, undo) => {
    set({ toast: { id: createId('tst'), message, undo } });
  },

  dismissToast: () => set({ toast: null }),

  announce: (text) => set({ srAnnouncement: text }),

  createHabit: (habitInput) => {
    const existing = get().habits;
    const maxOrder = existing.reduce((max, h) => Math.max(max, h.order), -1);
    const habit: Habit = {
      ...habitInput,
      id: createId('hab'),
      createdAt: new Date().toISOString(),
      order: maxOrder + 1,
    };
    set((s) => ({ habits: [...s.habits, habit], wizardDraft: null }));
    schedulePersist(get());
    return habit;
  },

  updateHabit: (habitId, patch) => {
    set((s) => ({
      habits: s.habits.map((h) => (h.id === habitId ? { ...h, ...patch } : h)),
    }));
    schedulePersist(get());
  },

  archiveHabit: (habitId) => {
    const prevHabit = get().habits.find((h) => h.id === habitId);
    if (!prevHabit) return;
    set((s) => ({
      habits: s.habits.map((h) =>
        h.id === habitId ? { ...h, archivedAt: new Date().toISOString() } : h
      ),
    }));
    reminderService.cancelReminder(habitId);
    schedulePersist(get());
    get().showToast(`Retired "${prevHabit.name}"`, () => {
      get().restoreHabit(habitId);
    });
  },

  restoreHabit: (habitId) => {
    set((s) => ({
      habits: s.habits.map((h) => {
        if (h.id !== habitId) return h;
        const copy = { ...h };
        delete copy.archivedAt;
        return copy;
      }),
    }));
    schedulePersist(get());
  },

  deleteHabit: (habitId) => {
    const prevHabits = get().habits;
    const prevCheckIns = get().checkIns;
    const target = prevHabits.find((h) => h.id === habitId);
    if (!target) return;

    set((s) => ({
      habits: s.habits.filter((h) => h.id !== habitId),
      checkIns: s.checkIns.filter((c) => c.habitId !== habitId),
    }));
    reminderService.cancelReminder(habitId);
    schedulePersist(get());
    get().showToast(`Deleted "${target.name}"`, () => {
      set({ habits: prevHabits, checkIns: prevCheckIns });
      schedulePersist(get());
    });
  },

  reorderHabits: (orderedIds) => {
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
    set((s) => ({
      habits: s.habits.map((h) =>
        orderMap.has(h.id) ? { ...h, order: orderMap.get(h.id)! } : h
      ),
    }));
    schedulePersist(get());
  },

  setCheckIn: (habitId, dateKey, status, note) => {
    const prevCheckIns = get().checkIns;
    const habit = get().habits.find((h) => h.id === habitId);
    const goal = habit?.dailyGoal ?? 1;
    const existing = prevCheckIns.find((c) => c.habitId === habitId && c.date === dateKey);
    const progressCount =
      status === 'done' ? goal : status === 'minimum' ? 1 : status === 'skipped' ? 0 : existing?.progressCount;

    const nextEntry: CheckIn = existing
      ? {
          ...existing,
          status,
          progressCount,
          note: note !== undefined ? note : existing.note,
        }
      : {
          id: createId('chk'),
          habitId,
          date: dateKey,
          status,
          progressCount,
          note,
          createdAt: new Date().toISOString(),
        };

    const nextCheckIns = existing
      ? prevCheckIns.map((c) => (c.id === existing.id ? nextEntry : c))
      : [...prevCheckIns, nextEntry];

    set({ checkIns: nextCheckIns });
    schedulePersist(get());

    const label =
      status === 'done'
        ? 'marked done'
        : status === 'minimum'
          ? '2-minute version done'
          : status === 'partial'
            ? 'progress logged'
            : 'skipped';
    get().showToast(`${habit?.name ?? 'Habit'} ${label}`, () => {
      set({ checkIns: prevCheckIns });
      schedulePersist(get());
    });
  },

  clearCheckIn: (habitId, dateKey) => {
    const prevCheckIns = get().checkIns;
    const existing = prevCheckIns.find((c) => c.habitId === habitId && c.date === dateKey);
    if (!existing) return;

    set({
      checkIns: prevCheckIns.filter((c) => !(c.habitId === habitId && c.date === dateKey)),
    });
    schedulePersist(get());
    const habit = get().habits.find((h) => h.id === habitId);
    get().showToast(`Undid check-in for "${habit?.name ?? 'habit'}"`, () => {
      set({ checkIns: prevCheckIns });
      schedulePersist(get());
    });
  },

  toggleTodayDone: (habitId, dateKey) => {
    const existing = get().checkIns.find((c) => c.habitId === habitId && c.date === dateKey);
    if (existing && (existing.status === 'done' || existing.status === 'minimum')) {
      get().clearCheckIn(habitId, dateKey);
      return null;
    }
    get().setCheckIn(habitId, dateKey, 'done');
    return 'done';
  },

  adjustHabitProgress: (habitId, dateKey, delta) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return null;
    const goal = Math.max(1, habit.dailyGoal ?? 1);
    const prevCheckIns = get().checkIns;
    const existing = prevCheckIns.find((c) => c.habitId === habitId && c.date === dateKey);
    const currentCount =
      existing?.status === 'done'
        ? (existing.progressCount ?? goal)
        : existing?.status === 'partial'
          ? (existing.progressCount ?? 0)
          : 0;
    const nextCount = Math.max(0, currentCount + delta);

    if (nextCount === 0) {
      if (existing) {
        set({
          checkIns: prevCheckIns.filter((c) => !(c.habitId === habitId && c.date === dateKey)),
        });
        schedulePersist(get());
      }
      return null;
    }

    const nextStatus: CheckInStatus = nextCount >= goal ? 'done' : 'partial';
    const nextEntry: CheckIn = existing
      ? { ...existing, status: nextStatus, progressCount: nextCount }
      : {
          id: createId('chk'),
          habitId,
          date: dateKey,
          status: nextStatus,
          progressCount: nextCount,
          createdAt: new Date().toISOString(),
        };

    const nextCheckIns = existing
      ? prevCheckIns.map((c) => (c.id === existing.id ? nextEntry : c))
      : [...prevCheckIns, nextEntry];

    set({ checkIns: nextCheckIns });
    schedulePersist(get());

    if (nextStatus === 'done' && currentCount < goal) {
      get().showToast(`${habit.name} goal reached (${nextCount}/${goal})`, () => {
        set({ checkIns: prevCheckIns });
        schedulePersist(get());
      });
    }

    return nextStatus;
  },

  saveWizardDraft: (draft) => {
    set({ wizardDraft: draft });
    schedulePersist(get());
  },

  updateSettings: (patch) => {
    set((s) => ({ settings: { ...s.settings, ...patch } }));
    schedulePersist(get());
  },

  exportJson: () => {
    const s = get();
    const payload = {
      app: APP_NAME,
      exportedAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
      onboardingDone: s.onboardingDone,
      habits: s.habits,
      checkIns: s.checkIns,
      settings: s.settings,
    };
    return JSON.stringify(payload, null, 2);
  },

  importJson: (jsonText) => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.habits)) {
        return { ok: false, error: 'This file does not look like a valid Stepwise backup.' };
      }
      const migrated = migrateStoreData(parsed);
      set({
        schemaVersion: migrated.schemaVersion,
        onboardingDone: true,
        habits: migrated.habits,
        checkIns: migrated.checkIns,
        settings: migrated.settings,
        wizardDraft: null,
      });
      schedulePersist(get());
      get().showToast(`Imported ${migrated.habits.length} habits.`);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Could not parse JSON file.' };
    }
  },

  resetAllData: () => {
    const fresh = getDefaultStoreData();
    storageService.clear();
    reminderService.cancelAll();
    set({
      schemaVersion: fresh.schemaVersion,
      onboardingDone: false,
      habits: [],
      checkIns: [],
      settings: { ...DEFAULT_SETTINGS },
      wizardDraft: null,
      toast: { id: createId('tst'), message: 'All local data cleared.' },
    });
  },

  loadDemoData: () => {
    const demo = buildDemoData();
    set({
      onboardingDone: true,
      habits: demo.habits,
      checkIns: demo.checkIns,
      wizardDraft: null,
      toast: { id: createId('tst'), message: 'Sample habits loaded.' },
    });
    schedulePersist(get());
  },
}));

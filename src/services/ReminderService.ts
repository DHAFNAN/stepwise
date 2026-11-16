import { formatGoalSummary } from '../lib/cueFormat';
import { formatTime12h, getTodayKey } from '../lib/dates';
import { isHabitScheduledOnDate } from '../lib/stats';
import type { Habit, ReminderTiming } from '../types/habit';

export type ReminderPermissionState = NotificationPermission | 'unsupported';

export type ReminderNotificationPayload = {
  title: string;
  body: string;
};

export interface ReminderService {
  getPermission(): ReminderPermissionState;
  requestPermission(): Promise<ReminderPermissionState>;
  syncReminders(habits: Habit[]): void;
  cancelReminder(habitId: string): void;
  cancelAll(): void;
  sendTestNotification(
    habit: Pick<
      Habit,
      'id' | 'name' | 'identity' | 'dailyGoal' | 'goalUnit' | 'goalScope' | 'twoMinuteVersion'
    >,
    triggerTimeHHMM?: string
  ): Promise<'sent' | 'denied' | 'unsupported'>;
}

function getOffsetMinutes(timing?: ReminderTiming): number {
  switch (timing) {
    case '5-min-before':
      return 5;
    case '10-min-before':
      return 10;
    case '15-min-before':
      return 15;
    case '30-min-before':
      return 30;
    default:
      return 0;
  }
}

export function subtractMinutesHHMM(hhmm: string, mins: number): string | null {
  const [hh, mm] = hhmm.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  let total = hh * 60 + mm - mins;
  if (total < 0) total += 24 * 60;
  const outH = Math.floor(total / 60) % 24;
  const outM = total % 60;
  return `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}`;
}

export function getReminderTriggerTimes(habit: Habit): string[] {
  if (!habit.reminderEnabled) return [];
  if (habit.reminderTiming === 'custom') {
    return habit.reminderTime ? [habit.reminderTime] : [];
  }
  const offset = getOffsetMinutes(habit.reminderTiming);
  const baseTimes =
    habit.habitTimes && habit.habitTimes.length > 0
      ? habit.habitTimes
      : habit.reminderTime
        ? [habit.reminderTime]
        : [];

  const unique = new Set<string>();
  for (const t of baseTimes) {
    const adjusted = subtractMinutesHHMM(t, offset);
    if (adjusted) unique.add(adjusted);
  }
  return Array.from(unique).sort();
}

export function formatReminderNotification(
  habit: Pick<
    Habit,
    'name' | 'identity' | 'dailyGoal' | 'goalUnit' | 'goalScope' | 'twoMinuteVersion'
  >,
  triggerTimeHHMM?: string
): ReminderNotificationPayload {
  const goalSummary = formatGoalSummary(habit);
  const cleanIdentity = habit.identity.trim().replace(/^become\s+/i, '');
  const title = cleanIdentity
    ? `${goalSummary} · Become ${cleanIdentity}`
    : `${goalSummary} · ${habit.name.trim() || 'Daily step'}`;

  const smallAction = habit.twoMinuteVersion?.trim() || habit.name.trim() || 'your tiny habit';
  const timeFormatted = triggerTimeHHMM ? formatTime12h(triggerTimeHHMM) : '';
  const body = timeFormatted
    ? `Hi! "${smallAction}" at ${timeFormatted} — one small step toward success.`
    : `Hi! "${smallAction}" today — one small step toward success.`;

  return { title, body };
}

class WebReminderService implements ReminderService {
  private timers = new Map<string, number[]>();

  getPermission(): ReminderPermissionState {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  async requestPermission(): Promise<ReminderPermissionState> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      return await Notification.requestPermission();
    } catch {
      return Notification.permission;
    }
  }

  cancelReminder(habitId: string): void {
    const ids = this.timers.get(habitId);
    if (ids && typeof window !== 'undefined') {
      for (const id of ids) {
        window.clearTimeout(id);
      }
      this.timers.delete(habitId);
    }
  }

  cancelAll(): void {
    if (typeof window !== 'undefined') {
      for (const list of this.timers.values()) {
        for (const id of list) {
          window.clearTimeout(id);
        }
      }
    }
    this.timers.clear();
  }

  syncReminders(habits: Habit[]): void {
    this.cancelAll();
    if (typeof window === 'undefined' || this.getPermission() !== 'granted') {
      return;
    }

    const now = new Date();
    const todayKey = getTodayKey(now);

    for (const habit of habits) {
      if (habit.archivedAt || !habit.reminderEnabled) {
        continue;
      }
      if (!isHabitScheduledOnDate(habit, todayKey)) {
        continue;
      }

      const times = getReminderTriggerTimes(habit);
      const timerIds: number[] = [];

      for (const hhmm of times) {
        const [hh, mm] = hhmm.split(':').map(Number);
        if (Number.isNaN(hh) || Number.isNaN(mm)) continue;

        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
        const delay = target.getTime() - now.getTime();
        if (delay <= 0 || delay > 24 * 60 * 60 * 1000) continue;

        const timerId = window.setTimeout(() => {
          void this.showNotification(habit, hhmm);
        }, delay);
        timerIds.push(timerId);
      }

      if (timerIds.length > 0) {
        this.timers.set(habit.id, timerIds);
      }
    }
  }

  async sendTestNotification(
    habit: Pick<
      Habit,
      'id' | 'name' | 'identity' | 'dailyGoal' | 'goalUnit' | 'goalScope' | 'twoMinuteVersion'
    >,
    triggerTimeHHMM?: string
  ): Promise<'sent' | 'denied' | 'unsupported'> {
    let perm = this.getPermission();
    if (perm === 'default') {
      perm = await this.requestPermission();
    }
    if (perm === 'unsupported') return 'unsupported';
    if (perm !== 'granted') return 'denied';

    await this.showNotification(habit, triggerTimeHHMM);
    return 'sent';
  }

  private async showNotification(
    habit: Pick<
      Habit,
      'id' | 'name' | 'identity' | 'dailyGoal' | 'goalUnit' | 'goalScope' | 'twoMinuteVersion'
    >,
    triggerTimeHHMM?: string
  ): Promise<void> {
    const { title, body } = formatReminderNotification(habit, triggerTimeHHMM);
    const tag = `stepwise-${habit.id}-${triggerTimeHHMM ?? 'daily'}`;

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            tag,
          });
          return;
        }
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/pwa-192x192.png', tag });
      }
    } catch {
      // Best-effort web notification
    }
  }
}

export const reminderService: ReminderService = new WebReminderService();

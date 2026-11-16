import type { WeekStart } from '../types/habit';

/**
 * Formats a Date into YYYY-MM-DD in local timezone without UTC drift.
 */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses a YYYY-MM-DD key into a local Date anchored at noon (12:00)
 * so DST transitions (+/- 1 hour) never shift the calendar day.
 */
export function fromDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/**
 * Adds delta calendar days to a YYYY-MM-DD key safely across month/year/DST boundaries.
 */
export function addDays(dateKey: string, delta: number): string {
  const dt = fromDateKey(dateKey);
  dt.setDate(dt.getDate() + delta);
  return toLocalDateKey(dt);
}

/**
 * Difference in calendar days (dateB - dateA). Positive if dateB > dateA.
 */
export function diffDays(dateA: string, dateB: string): number {
  const a = fromDateKey(dateA);
  const b = fromDateKey(dateB);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

export function getTodayKey(now: Date = new Date()): string {
  return toLocalDateKey(now);
}

/**
 * Returns the 0-6 weekday index (0=Sun .. 6=Sat) for a YYYY-MM-DD key.
 */
export function getWeekday(dateKey: string): number {
  return fromDateKey(dateKey).getDay();
}

/**
 * Returns the 7 date keys for the week containing `referenceDateKey`.
 */
export function getWeekDates(referenceDateKey: string, weekStartsOn: WeekStart = 1): string[] {
  const dayOfWeek = getWeekday(referenceDateKey);
  const offset = (dayOfWeek - weekStartsOn + 7) % 7;
  const startKey = addDays(referenceDateKey, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(startKey, i));
}

export function getShortWeekdayLabel(dateKey: string): string {
  return fromDateKey(dateKey).toLocaleDateString(undefined, { weekday: 'short' });
}

export function getFullWeekdayName(dayIndex: number): string {
  // 2026-03-01 is a Sunday (index 0)
  const dt = new Date(2026, 2, 1 + dayIndex, 12, 0, 0);
  return dt.toLocaleDateString(undefined, { weekday: 'long' });
}

export function getShortWeekdayName(dayIndex: number): string {
  const dt = new Date(2026, 2, 1 + dayIndex, 12, 0, 0);
  return dt.toLocaleDateString(undefined, { weekday: 'short' });
}

export function formatDisplayDate(dateKey: string): string {
  return fromDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function formatMonthYear(year: number, monthIndex0: number): string {
  return new Date(year, monthIndex0, 15, 12, 0, 0).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Returns all days in the month grid (including leading/trailing padding days for 7-col calendar).
 */
export function getMonthGridDays(
  year: number,
  monthIndex0: number,
  weekStartsOn: WeekStart = 1
): { dateKey: string; inMonth: boolean }[] {
  const firstOfMonth = toLocalDateKey(new Date(year, monthIndex0, 1, 12, 0, 0));
  const lastOfMonth = toLocalDateKey(new Date(year, monthIndex0 + 1, 0, 12, 0, 0));
  const firstDow = getWeekday(firstOfMonth);
  const leading = (firstDow - weekStartsOn + 7) % 7;
  const totalDaysInMonth = diffDays(firstOfMonth, lastOfMonth) + 1;
  const totalCells = Math.ceil((leading + totalDaysInMonth) / 7) * 7;

  const cells: { dateKey: string; inMonth: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const key = addDays(firstOfMonth, i - leading);
    const dt = fromDateKey(key);
    cells.push({
      dateKey: key,
      inMonth: dt.getMonth() === monthIndex0 && dt.getFullYear() === year,
    });
  }
  return cells;
}

export function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatTime12h(hhmm?: string): string {
  if (!hhmm || !hhmm.includes(':')) return '';
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

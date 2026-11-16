import type { HabitColorId } from '../types/habit';

export type HabitColorToken = {
  id: HabitColorId;
  label: string;
  hex: string;
  darkHex: string;
  tintLight: string;
  tintDark: string;
  textLight: string;
  textDark: string;
};

export const HABIT_COLORS: HabitColorToken[] = [
  {
    id: 'teal',
    label: 'Deep Teal',
    hex: '#0F766E',
    darkHex: '#14968B',
    tintLight: 'rgba(15, 118, 110, 0.12)',
    tintDark: 'rgba(20, 150, 139, 0.20)',
    textLight: '#0B5B55',
    textDark: '#5EEAD4',
  },
  {
    id: 'coral',
    label: 'Warm Coral',
    hex: '#E05A4A',
    darkHex: '#F27D6F',
    tintLight: 'rgba(242, 107, 91, 0.14)',
    tintDark: 'rgba(242, 107, 91, 0.22)',
    textLight: '#B43E30',
    textDark: '#FDA49A',
  },
  {
    id: 'amber',
    label: 'Honey Amber',
    hex: '#C8841E',
    darkHex: '#E9A23B',
    tintLight: 'rgba(233, 162, 59, 0.16)',
    tintDark: 'rgba(233, 162, 59, 0.22)',
    textLight: '#8E5A0C',
    textDark: '#F7CA7A',
  },
  {
    id: 'sky',
    label: 'Clear Sky',
    hex: '#0284C7',
    darkHex: '#38BDF8',
    tintLight: 'rgba(2, 132, 199, 0.12)',
    tintDark: 'rgba(56, 189, 248, 0.20)',
    textLight: '#0369A1',
    textDark: '#7DD3FC',
  },
  {
    id: 'violet',
    label: 'Soft Violet',
    hex: '#6D28D9',
    darkHex: '#A78BFA',
    tintLight: 'rgba(109, 40, 217, 0.11)',
    tintDark: 'rgba(167, 139, 250, 0.20)',
    textLight: '#5B21B6',
    textDark: '#C4B5FD',
  },
  {
    id: 'rose',
    label: 'Terracotta Rose',
    hex: '#BE123C',
    darkHex: '#FB7185',
    tintLight: 'rgba(190, 18, 60, 0.11)',
    tintDark: 'rgba(251, 113, 133, 0.20)',
    textLight: '#9F1239',
    textDark: '#FDA4AF',
  },
  {
    id: 'lime',
    label: 'Meadow Leaf',
    hex: '#2E8B57',
    darkHex: '#4AB878',
    tintLight: 'rgba(63, 166, 107, 0.14)',
    tintDark: 'rgba(74, 184, 120, 0.20)',
    textLight: '#216A41',
    textDark: '#86EFAC',
  },
  {
    id: 'slate',
    label: 'Stone Slate',
    hex: '#475569',
    darkHex: '#94A3B8',
    tintLight: 'rgba(71, 85, 105, 0.12)',
    tintDark: 'rgba(148, 163, 184, 0.20)',
    textLight: '#334155',
    textDark: '#CBD5E1',
  },
];

export function getHabitColor(id: HabitColorId | string): HabitColorToken {
  return HABIT_COLORS.find((c) => c.id === id) ?? HABIT_COLORS[0];
}

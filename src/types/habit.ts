export type CueType = 'text' | 'time' | 'after-habit' | 'location';

export type HabitCue = {
  type: CueType;
  text?: string;
  time?: string; // HH:mm
  anchor?: string;
  place?: string;
};

export type HabitFrequency = {
  type: 'daily' | 'weekdays' | 'custom';
  days?: number[]; // 0 (Sun) - 6 (Sat)
};

export type GoalScope = 'per-day' | 'per-session';

export type ReminderTiming =
  | 'at-time'
  | '5-min-before'
  | '10-min-before'
  | '15-min-before'
  | '30-min-before'
  | 'custom';

export type HabitColorId =
  | 'teal'
  | 'coral'
  | 'amber'
  | 'sky'
  | 'violet'
  | 'rose'
  | 'lime'
  | 'slate';

export type Habit = {
  id: string;
  name: string;
  identity: string;
  whenWhereText?: string;
  cue: HabitCue;
  place?: string;
  twoMinuteVersion?: string;
  makeItObvious?: string;
  makeItAttractive?: string;
  frequency: HabitFrequency;
  dailyGoal?: number;
  goalUnit?: string;
  goalScope?: GoalScope;
  habitTimes?: string[]; // ['08:00', '13:00']
  color: HabitColorId;
  icon: string;
  reminderEnabled: boolean;
  reminderTiming?: ReminderTiming;
  reminderTime?: string;
  createdAt: string; // ISO
  archivedAt?: string;
  order: number;
};

export type CheckInStatus = 'done' | 'minimum' | 'partial' | 'skipped';

export type CheckIn = {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD (local)
  status: CheckInStatus;
  progressCount?: number;
  note?: string;
  createdAt: string;
};

export type ThemePreference = 'system' | 'light' | 'dark';
export type WeekStart = 0 | 1; // 0 = Sunday, 1 = Monday

export type AppSettings = {
  theme: ThemePreference;
  weekStartsOn: WeekStart;
  defaultReminderTime: string;
  moveCompletedToBottom: boolean;
  hapticsEnabled: boolean;
  soundsEnabled: boolean;
};

export type WizardDraft = {
  editingHabitId?: string;
  step: number;
  name: string;
  size: 'tiny' | 'small' | 'medium' | 'big';
  twoMinuteVersion: string;
  whenWhereText: string;
  place: string;
  identity: string;
  makeItObvious: string;
  makeItAttractive: string;
  frequencyType: 'daily' | 'weekdays' | 'custom';
  frequencyDays: number[];
  dailyGoal: number;
  goalUnit: string;
  goalScope: GoalScope;
  habitTimes: string[];
  reminderEnabled: boolean;
  reminderTiming: ReminderTiming;
  reminderTime: string;
  color: HabitColorId;
  icon: string;
};

export type StoreDataV1 = {
  schemaVersion: number;
  onboardingDone: boolean;
  habits: Habit[];
  checkIns: CheckIn[];
  settings: AppSettings;
  wizardDraft: WizardDraft | null;
};

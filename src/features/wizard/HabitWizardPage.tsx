import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Sheet } from '../../components/Sheet';
import { WizardShell } from '../../components/WizardShell';
import { getHabitColor } from '../../lib/colors';
import { triggerSubtleConfetti } from '../../lib/confetti';
import { formatCueSummary } from '../../lib/cueFormat';
import { hapticsService } from '../../services/HapticsService';
import { useHabitStore } from '../../store/habitStore';
import type { Habit, WizardDraft } from '../../types/habit';
import { HowItWorksSheet } from './HowItWorksSheet';
import { LiveSentencePreview } from './LiveSentencePreview';
import { ActionStep } from './steps/ActionStep';
import { CueStep } from './steps/CueStep';
import { EasyStep } from './steps/EasyStep';
import { FrequencyStep } from './steps/FrequencyStep';
import { IdentityStep } from './steps/IdentityStep';
import { ReviewStep } from './steps/ReviewStep';

const STEP_TITLES = [
  'Action',
  'When & where',
  'Person to become',
  'Goal & reminders',
  'Make it easy',
  'Style & review',
];

function createEmptyDraft(defaultReminderTime: string, initialStep = 1): WizardDraft {
  return {
    step: initialStep,
    name: '',
    size: 'tiny',
    twoMinuteVersion: '',
    whenWhereText: '',
    place: '',
    identity: '',
    makeItObvious: '',
    makeItAttractive: '',
    frequencyType: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    dailyGoal: 1,
    goalUnit: 'times',
    goalScope: 'per-day',
    habitTimes: [],
    reminderEnabled: false,
    reminderTiming: 'at-time',
    reminderTime: defaultReminderTime || '08:30',
    color: 'teal',
    icon: 'book-open',
  };
}

function habitToDraft(habit: Habit, initialStep = 1): WizardDraft {
  const whenWhereText =
    habit.whenWhereText ??
    (habit.cue.text || formatCueSummary(habit.cue, habit.place));
  return {
    editingHabitId: habit.id,
    step: initialStep,
    name: habit.name,
    size: 'tiny',
    twoMinuteVersion: habit.twoMinuteVersion ?? '',
    whenWhereText: whenWhereText === 'Anytime' ? '' : whenWhereText,
    place: habit.place ?? '',
    identity: habit.identity,
    makeItObvious: habit.makeItObvious ?? '',
    makeItAttractive: habit.makeItAttractive ?? '',
    frequencyType: habit.frequency.type,
    frequencyDays:
      habit.frequency.type === 'daily'
        ? [0, 1, 2, 3, 4, 5, 6]
        : habit.frequency.type === 'weekdays'
          ? [1, 2, 3, 4, 5]
          : (habit.frequency.days ?? [1, 2, 3, 4, 5]),
    dailyGoal: habit.dailyGoal ?? 1,
    goalUnit: habit.goalUnit ?? 'times',
    goalScope: habit.goalScope ?? 'per-day',
    habitTimes: habit.habitTimes ?? (habit.reminderTime ? [habit.reminderTime] : []),
    reminderEnabled: habit.reminderEnabled,
    reminderTiming: habit.reminderTiming ?? 'at-time',
    reminderTime: habit.reminderTime ?? habit.habitTimes?.[0] ?? '08:30',
    color: habit.color,
    icon: habit.icon,
  };
}

type HabitWizardPageProps = {
  isDark: boolean;
};

export const HabitWizardPage: React.FC<HabitWizardPageProps> = ({ isDark }) => {
  const navigate = useNavigate();
  const { habitId } = useParams<{ habitId?: string }>();
  const [searchParams] = useSearchParams();
  const requestedStep = Number(searchParams.get('step'));
  const initialStep = requestedStep >= 1 && requestedStep <= 6 ? requestedStep : 1;

  const onboardingDone = useHabitStore((s) => s.onboardingDone);
  const setOnboardingDone = useHabitStore((s) => s.setOnboardingDone);
  const habits = useHabitStore((s) => s.habits);
  const settings = useHabitStore((s) => s.settings);
  const storedDraft = useHabitStore((s) => s.wizardDraft);
  const saveWizardDraft = useHabitStore((s) => s.saveWizardDraft);
  const createHabit = useHabitStore((s) => s.createHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const showToast = useHabitStore((s) => s.showToast);

  useEffect(() => {
    if (!onboardingDone) {
      setOnboardingDone(true);
    }
  }, [onboardingDone, setOnboardingDone]);

  const editingHabit = useMemo(
    () => (habitId ? habits.find((h) => h.id === habitId) : undefined),
    [habitId, habits]
  );

  const [draft, setDraft] = useState<WizardDraft>(() => {
    if (editingHabit) {
      return habitToDraft(editingHabit, initialStep);
    }
    if (storedDraft && !storedDraft.editingHabitId) {
      return {
        ...createEmptyDraft(settings.defaultReminderTime, initialStep),
        ...storedDraft,
        step: requestedStep ? initialStep : storedDraft.step,
      };
    }
    return createEmptyDraft(settings.defaultReminderTime, initialStep);
  });

  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [exitSheetOpen, setExitSheetOpen] = useState(false);

  useEffect(() => {
    if (!editingHabit) {
      saveWizardDraft(draft);
    }
  }, [draft, editingHabit, saveWizardDraft]);

  const updateDraft = (patch: Partial<WizardDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const isStepValid = useMemo(() => {
    switch (draft.step) {
      case 1:
        return draft.name.trim().length > 0;
      case 2:
        return draft.whenWhereText.trim().length > 0;
      case 3:
        return draft.identity.trim().length > 0;
      case 4:
        return draft.frequencyDays.length > 0 && draft.dailyGoal >= 1 && draft.goalUnit.trim().length > 0;
      case 5:
        return true;
      case 6:
        return (
          draft.name.trim().length > 0 &&
          draft.whenWhereText.trim().length > 0 &&
          draft.identity.trim().length > 0
        );
      default:
        return false;
    }
  }, [draft]);

  const hasUnsavedChanges = useMemo(() => {
    if (editingHabit) return true;
    return Boolean(draft.name.trim() || draft.whenWhereText.trim() || draft.identity.trim());
  }, [draft, editingHabit]);

  const handleAttemptExit = () => {
    if (!hasUnsavedChanges || editingHabit) {
      if (!editingHabit) saveWizardDraft(null);
      navigate(-1);
      return;
    }
    setExitSheetOpen(true);
  };

  const handleBack = () => {
    if (draft.step <= 1) {
      handleAttemptExit();
    } else {
      updateDraft({ step: draft.step - 1 });
    }
  };

  const handleSubmit = () => {
    const cleanWhenWhere = draft.whenWhereText.trim();
    const cleanPlace = draft.place.trim() || undefined;
    const habitPayload: Omit<Habit, 'id' | 'createdAt' | 'order'> = {
      name: draft.name.trim(),
      identity: draft.identity.trim(),
      whenWhereText: cleanWhenWhere,
      cue: {
        type: 'text',
        text: cleanWhenWhere,
        place: cleanPlace,
      },
      place: cleanPlace,
      twoMinuteVersion: draft.twoMinuteVersion.trim() || undefined,
      makeItObvious: draft.makeItObvious.trim() || undefined,
      makeItAttractive: draft.makeItAttractive.trim() || undefined,
      frequency: {
        type: draft.frequencyType,
        days: draft.frequencyType === 'custom' ? draft.frequencyDays : undefined,
      },
      dailyGoal: Math.max(1, draft.dailyGoal),
      goalUnit: draft.goalUnit.trim() || 'times',
      goalScope: draft.goalScope,
      habitTimes: draft.habitTimes,
      color: draft.color,
      icon: draft.icon,
      reminderEnabled: draft.reminderEnabled,
      reminderTiming: draft.reminderTiming,
      reminderTime: draft.reminderEnabled
        ? draft.reminderTiming === 'custom' || draft.habitTimes.length === 0
          ? draft.reminderTime
          : draft.habitTimes[0]
        : undefined,
    };

    if (editingHabit) {
      updateHabit(editingHabit.id, habitPayload);
      showToast(`Updated "${habitPayload.name}"`);
      navigate(`/habit/${editingHabit.id}`, { replace: true });
      return;
    }

    const created = createHabit(habitPayload);
    hapticsService.success(settings.hapticsEnabled, settings.soundsEnabled);
    const token = getHabitColor(created.color);
    triggerSubtleConfetti([token.hex, '#0F766E', '#F26B5B', '#3FA66B']);
    showToast(`Added "${created.name}" to Today`);
    navigate(`/today?highlight=${created.id}`, { replace: true });
  };

  const handleNext = () => {
    if (!isStepValid) return;
    if (draft.step < 6) {
      updateDraft({ step: draft.step + 1 });
    } else {
      handleSubmit();
    }
  };

  return (
    <>
      <WizardShell
        step={draft.step}
        totalSteps={6}
        title={STEP_TITLES[draft.step - 1]}
        canGoNext={isStepValid}
        nextLabel={draft.step === 6 ? (editingHabit ? 'Save changes' : 'Create habit') : 'Next'}
        onBack={handleBack}
        onNext={handleNext}
        onClose={handleAttemptExit}
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
        preview={
          <LiveSentencePreview
            action={draft.name}
            whenWhereText={draft.whenWhereText}
            place={draft.place}
            identity={draft.identity}
          />
        }
      >
        {draft.step === 1 && (
          <ActionStep
            name={draft.name}
            size={draft.size}
            twoMinuteVersion={draft.twoMinuteVersion}
            onChangeName={(name) => updateDraft({ name })}
            onChangeSize={(size) => updateDraft({ size })}
            onChangeTwoMinute={(twoMinuteVersion) => updateDraft({ twoMinuteVersion })}
          />
        )}

        {draft.step === 2 && (
          <CueStep
            whenWhereText={draft.whenWhereText}
            place={draft.place}
            onChangeWhenWhere={(whenWhereText) => updateDraft({ whenWhereText })}
            onChangePlace={(place) => updateDraft({ place })}
          />
        )}

        {draft.step === 3 && (
          <IdentityStep
            identity={draft.identity}
            onChange={(identity) => updateDraft({ identity })}
          />
        )}

        {draft.step === 4 && (
          <FrequencyStep
            habitName={draft.name}
            habitIdentity={draft.identity}
            twoMinuteVersion={draft.twoMinuteVersion}
            weekStartsOn={settings.weekStartsOn}
            frequencyType={draft.frequencyType}
            frequencyDays={draft.frequencyDays}
            dailyGoal={draft.dailyGoal}
            goalUnit={draft.goalUnit}
            goalScope={draft.goalScope}
            habitTimes={draft.habitTimes}
            reminderEnabled={draft.reminderEnabled}
            reminderTiming={draft.reminderTiming}
            reminderTime={draft.reminderTime}
            onChangeDays={(frequencyDays, frequencyType) =>
              updateDraft({ frequencyDays, frequencyType })
            }
            onChangeDailyGoal={(dailyGoal) => updateDraft({ dailyGoal })}
            onChangeGoalUnit={(goalUnit) => updateDraft({ goalUnit })}
            onChangeGoalScope={(goalScope) => updateDraft({ goalScope })}
            onChangeHabitTimes={(habitTimes) => updateDraft({ habitTimes })}
            onChangeReminderEnabled={(reminderEnabled) => updateDraft({ reminderEnabled })}
            onChangeReminderTiming={(reminderTiming) => updateDraft({ reminderTiming })}
            onChangeReminderTime={(reminderTime) => updateDraft({ reminderTime })}
          />
        )}

        {draft.step === 5 && (
          <EasyStep
            makeItObvious={draft.makeItObvious}
            makeItAttractive={draft.makeItAttractive}
            onChangeObvious={(makeItObvious) => updateDraft({ makeItObvious })}
            onChangeAttractive={(makeItAttractive) => updateDraft({ makeItAttractive })}
            onSkip={() => updateDraft({ step: 6 })}
          />
        )}

        {draft.step === 6 && (
          <ReviewStep
            color={draft.color}
            icon={draft.icon}
            name={draft.name.trim()}
            identity={draft.identity.trim()}
            whenWhereText={draft.whenWhereText}
            place={draft.place}
            twoMinuteVersion={draft.twoMinuteVersion}
            frequencyType={draft.frequencyType}
            frequencyDays={draft.frequencyDays}
            dailyGoal={draft.dailyGoal}
            goalUnit={draft.goalUnit}
            goalScope={draft.goalScope}
            habitTimes={draft.habitTimes}
            reminderEnabled={draft.reminderEnabled}
            reminderTiming={draft.reminderTiming}
            reminderTime={draft.reminderTime}
            isDark={isDark}
            onChangeColor={(color) => updateDraft({ color })}
            onChangeIcon={(icon) => updateDraft({ icon })}
          />
        )}
      </WizardShell>

      <HowItWorksSheet open={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} />

      <Sheet open={exitSheetOpen} onClose={() => setExitSheetOpen(false)} title="Save draft?">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            You can keep your habit draft so you can pick up right where you left off, or discard
            it.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                saveWizardDraft(draft);
                setExitSheetOpen(false);
                navigate('/today');
              }}
              className="w-full min-h-[48px] rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold text-sm cursor-pointer"
            >
              Save draft &amp; exit
            </button>
            <button
              type="button"
              onClick={() => {
                saveWizardDraft(null);
                setExitSheetOpen(false);
                navigate('/today');
              }}
              className="w-full min-h-[48px] rounded-full bg-[var(--bg-subtle)] text-[var(--color-accent)] font-semibold text-sm cursor-pointer"
            >
              Discard draft
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
};

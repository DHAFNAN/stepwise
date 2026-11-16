import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import { HabitDetailPanel } from './HabitDetailPanel';

type HabitDetailPageProps = {
  isDark: boolean;
};

export const HabitDetailPage: React.FC<HabitDetailPageProps> = ({ isDark }) => {
  const { habitId } = useParams<{ habitId: string }>();
  const navigate = useNavigate();
  const habits = useHabitStore((s) => s.habits);
  const habit = habits.find((h) => h.id === habitId);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-28 md:pb-12 space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-xl font-semibold text-[var(--text-primary)]">
          Habit details
        </h1>
      </div>

      {habit ? (
        <HabitDetailPanel habit={habit} isDark={isDark} />
      ) : (
        <div className="bg-[var(--bg-surface)] rounded-[24px] p-8 text-center border border-[var(--border-hairline)]">
          <p className="font-display text-lg font-semibold text-[var(--text-primary)]">
            Habit not found
          </p>
          <button
            type="button"
            onClick={() => navigate('/today')}
            className="mt-4 min-h-[44px] px-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-semibold cursor-pointer"
          >
            Back to Today
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Compass, Sparkles } from 'lucide-react';
import { PebbleBlob } from '../../components/PebbleBlob';
import { APP_NAME } from '../../lib/constants';
import { useHabitStore } from '../../store/habitStore';

const SLIDES = [
  {
    title: 'Start tiny.',
    body: 'Big changes rarely stick overnight. A two-minute action repeated daily quietly builds momentum that lasts.',
    variant: 'teal' as const,
    Icon: Sparkles,
  },
  {
    title: 'Become someone.',
    body: 'Every small check-in is a quiet vote for the person you want to be—a reader, a runner, a calmer friend.',
    variant: 'warm' as const,
    Icon: Compass,
  },
  {
    title: 'Track simply.',
    body: 'One tap a day. No noisy feeds, no guilt when life happens—just a calm record of showing up.',
    variant: 'sage' as const,
    Icon: CheckCircle2,
  },
];

export const OnboardingScreen: React.FC = () => {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const setOnboardingDone = useHabitStore((s) => s.setOnboardingDone);

  const slide = SLIDES[index];
  const SlideIcon = slide.Icon;

  const handleSkip = () => {
    setOnboardingDone(true);
    navigate('/today', { replace: true });
  };

  const handleCreateFirst = () => {
    navigate('/create', { replace: true });
  };

  const handleNext = () => {
    if (index < SLIDES.length - 1) {
      setIndex((i) => i + 1);
    } else {
      handleCreateFirst();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] px-6 py-6">
      <div className="max-w-lg w-full mx-auto flex items-center justify-between">
        <span className="font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]">
          {APP_NAME}
        </span>
        <button
          type="button"
          onClick={handleSkip}
          className="min-h-[44px] px-4 rounded-full text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-lg w-full mx-auto py-8">
        <motion.div
          key={index}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x < -50 && index < SLIDES.length - 1) {
              setIndex((i) => i + 1);
            } else if (info.offset.x > 50 && index > 0) {
              setIndex((i) => i - 1);
            }
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="relative w-full bg-[var(--bg-surface)] rounded-[28px] p-8 sm:p-10 border border-[var(--border-hairline)] overflow-hidden text-center"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <PebbleBlob
            variant={slide.variant}
            className="w-64 h-48 mx-auto -mt-4 -mb-6 pointer-events-none select-none"
          />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-tint)] text-[var(--color-primary)] flex items-center justify-center mb-5">
              <SlideIcon className="w-6 h-6" />
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--text-primary)] text-balance">
              {slide.title}
            </h1>

            <p className="mt-4 text-base text-[var(--text-secondary)] leading-relaxed max-w-sm">
              {slide.body}
            </p>
          </div>
        </motion.div>

        <div className="mt-7 flex items-center gap-2.5" role="tablist" aria-label="Onboarding steps">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Step ${i + 1}: ${s.title}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                i === index
                  ? 'w-8 bg-[var(--color-primary)]'
                  : 'w-2.5 bg-[var(--border-strong)] hover:bg-[var(--text-muted)]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-lg w-full mx-auto space-y-3 safe-pb">
        <button
          type="button"
          onClick={handleCreateFirst}
          className="w-full min-h-[52px] px-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold text-base flex items-center justify-center gap-2 hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer shadow-sm"
        >
          <span>Create my first habit</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {index < SLIDES.length - 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="w-full min-h-[44px] rounded-full text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
          >
            Next card ({index + 1} of {SLIDES.length})
          </button>
        )}
      </div>
    </div>
  );
};

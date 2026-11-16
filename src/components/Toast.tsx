import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RotateCcw, X } from 'lucide-react';
import { useHabitStore } from '../store/habitStore';

export const Toast: React.FC = () => {
  const toast = useHabitStore((s) => s.toast);
  const dismissToast = useHabitStore((s) => s.dismissToast);
  const srAnnouncement = useHabitStore((s) => s.srAnnouncement);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      dismissToast();
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [toast, dismissToast]);

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite">
        {srAnnouncement}
      </div>
      <div className="fixed bottom-38 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#1F2A2E] dark:bg-[#2A3337] text-[#EEF2F1] shadow-xl border border-white/10"
            >
              <span className="text-sm font-medium leading-snug">{toast.message}</span>
              <div className="flex items-center gap-1 shrink-0">
                {toast.undo && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.undo?.();
                      dismissToast();
                    }}
                    className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Undo
                  </button>
                )}
                <button
                  type="button"
                  onClick={dismissToast}
                  aria-label="Dismiss message"
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

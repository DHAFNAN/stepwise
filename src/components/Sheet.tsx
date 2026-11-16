import React, { useEffect } from 'react';
import { X } from 'lucide-react';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export const Sheet: React.FC<SheetProps> = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/45 backdrop-blur-[2px] p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md max-h-[88vh] overflow-y-auto bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-t-[28px] md:rounded-[24px] shadow-2xl border border-[var(--border-hairline)] safe-pb"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-[var(--border-strong)]" />
        </div>
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-[var(--border-hairline)]">
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

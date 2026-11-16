import React, { useRef, useState } from 'react';
import { Bell, Database, Download, RotateCcw, Upload } from 'lucide-react';
import { PWAInstallButton } from '../../components/PWAInstallButton';
import { Sheet } from '../../components/Sheet';
import { APP_NAME, APP_VERSION } from '../../lib/constants';
import { reminderService } from '../../services/ReminderService';
import { useHabitStore } from '../../store/habitStore';
import type { ThemePreference, WeekStart } from '../../types/habit';

export const SettingsPage: React.FC = () => {
  const settings = useHabitStore((s) => s.settings);
  const updateSettings = useHabitStore((s) => s.updateSettings);
  const exportJson = useHabitStore((s) => s.exportJson);
  const importJson = useHabitStore((s) => s.importJson);
  const resetAllData = useHabitStore((s) => s.resetAllData);
  const loadDemoData = useHabitStore((s) => s.loadDemoData);
  const showToast = useHabitStore((s) => s.showToast);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [permState, setPermState] = useState(() => reminderService.getPermission());

  const handleExport = () => {
    const json = exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stepwise-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported JSON backup');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = importJson(text);
      if (!result.ok) {
        setImportError(result.error ?? 'Invalid backup file.');
      }
    } catch {
      setImportError('Could not read the selected file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleRequestNotifications = async () => {
    const res = await reminderService.requestPermission();
    setPermState(res);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-28 md:pb-12 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]">
            Settings
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Customize appearance, reminders, and local backups.
          </p>
        </div>
        <PWAInstallButton />
      </header>

      {/* Appearance & Calendar */}
      <section
        className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)] space-y-5"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-2.5">Theme</p>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[var(--bg-subtle)]">
            {(['system', 'light', 'dark'] as ThemePreference[]).map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={settings.theme === opt}
                onClick={() => updateSettings({ theme: opt })}
                className={`min-h-[42px] rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  settings.theme === opt
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-2.5">Week starts on</p>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[var(--bg-subtle)]">
            {(
              [
                { value: 1 as WeekStart, label: 'Monday' },
                { value: 0 as WeekStart, label: 'Sunday' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={settings.weekStartsOn === opt.value}
                onClick={() => updateSettings({ weekStartsOn: opt.value })}
                className={`min-h-[42px] rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  settings.weekStartsOn === opt.value
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          <label htmlFor="setting-default-reminder" className="text-sm font-semibold text-[var(--text-primary)]">
            Default reminder time
          </label>
          <input
            id="setting-default-reminder"
            type="time"
            value={settings.defaultReminderTime}
            onChange={(e) => updateSettings({ defaultReminderTime: e.target.value })}
            className="min-h-[42px] px-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-sm font-semibold text-[var(--text-primary)]"
          />
        </div>
      </section>

      {/* Behavior & Feedback */}
      <section
        className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)] divide-y divide-[var(--border-hairline)]"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="pb-4 flex items-center justify-between gap-4">
          <div>
            <p id="lbl-move-bottom" className="text-sm font-semibold text-[var(--text-primary)]">
              Move completed habits to bottom
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Keeps remaining habits easy to see on Today.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.moveCompletedToBottom}
            aria-labelledby="lbl-move-bottom"
            onClick={() =>
              updateSettings({ moveCompletedToBottom: !settings.moveCompletedToBottom })
            }
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
              settings.moveCompletedToBottom ? 'bg-[var(--color-primary)]' : 'bg-[var(--border-strong)]'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                settings.moveCompletedToBottom ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="py-4 flex items-center justify-between gap-4">
          <div>
            <p id="lbl-haptics" className="text-sm font-semibold text-[var(--text-primary)]">
              Haptic feedback
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Gentle vibration tick on check-in where supported.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.hapticsEnabled}
            aria-labelledby="lbl-haptics"
            onClick={() => updateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
              settings.hapticsEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--border-strong)]'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                settings.hapticsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="pt-4 flex items-center justify-between gap-4">
          <div>
            <p id="lbl-sounds" className="text-sm font-semibold text-[var(--text-primary)]">
              Completion chime
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Play a soft chime when marking a habit done.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.soundsEnabled}
            aria-labelledby="lbl-sounds"
            onClick={() => updateSettings({ soundsEnabled: !settings.soundsEnabled })}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
              settings.soundsEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--border-strong)]'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                settings.soundsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section
        className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)] space-y-3"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[var(--color-primary)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Notifications</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Status:{' '}
                <span className="font-semibold text-[var(--text-primary)] capitalize">
                  {permState}
                </span>
              </p>
            </div>
          </div>

          {permState === 'default' && (
            <button
              type="button"
              onClick={() => void handleRequestNotifications()}
              className="min-h-[40px] px-4 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-xs font-semibold cursor-pointer"
            >
              Allow
            </button>
          )}
        </div>

        {permState === 'denied' && (
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Notifications are blocked. To enable them, open your browser’s site settings (lock or
            tune icon next to the address bar) and allow Notifications for this site.
          </p>
        )}
      </section>

      {/* Data Backup & Testing */}
      <section
        className="bg-[var(--bg-surface)] rounded-[24px] p-5 border border-[var(--border-hairline)] space-y-3"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
          Your offline data
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Everything stays on this device. Export a JSON backup anytime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleExport}
            className="min-h-[46px] px-4 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-sm font-semibold text-[var(--text-primary)] inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[46px] px-4 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--border-strong)]/40 text-sm font-semibold text-[var(--text-primary)] inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => void handleImportFile(e)}
          />
        </div>

        {importError && (
          <p className="text-xs font-medium text-[var(--color-accent)]">{importError}</p>
        )}

        <div className="pt-3 border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={loadDemoData}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            Load demo data
          </button>

          <button
            type="button"
            onClick={() => setResetStep(1)}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-full text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all data
          </button>
        </div>
      </section>

      {/* About */}
      <footer className="text-center text-xs text-[var(--text-muted)] pt-2">
        {APP_NAME} · Version {APP_VERSION}
      </footer>

      {/* Double Confirmation Reset Sheet */}
      <Sheet
        open={resetStep > 0}
        onClose={() => setResetStep(0)}
        title={resetStep === 1 ? 'Reset all local data?' : 'Are you completely sure?'}
      >
        {resetStep === 1 ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              This will erase all your habits, check-ins, and settings on this device. Consider
              exporting a JSON backup first.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setResetStep(0)}
                className="flex-1 min-h-[46px] rounded-full bg-[var(--bg-subtle)] text-sm font-semibold text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setResetStep(2)}
                className="flex-1 min-h-[46px] rounded-full bg-[var(--color-accent)] text-white text-sm font-semibold cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Tap “Erase everything” to permanently wipe all stored Stepwise data from this browser.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setResetStep(0)}
                className="flex-1 min-h-[46px] rounded-full bg-[var(--bg-subtle)] text-sm font-semibold text-[var(--text-primary)] cursor-pointer"
              >
                Keep my data
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  setResetStep(0);
                }}
                className="flex-1 min-h-[46px] rounded-full bg-[var(--color-accent)] text-white text-sm font-semibold cursor-pointer"
              >
                Erase everything
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
};

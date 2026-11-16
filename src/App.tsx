import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Toast } from './components/Toast';
import { HabitDetailPage } from './features/habit-detail/HabitDetailPage';
import { OnboardingScreen } from './features/onboarding/OnboardingScreen';
import { ProgressPage } from './features/progress/ProgressPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { TodayPage } from './features/today/TodayPage';
import { HabitWizardPage } from './features/wizard/HabitWizardPage';
import { reminderService } from './services/ReminderService';
import { useHabitStore } from './store/habitStore';
import { AppLayout } from './app/Layout';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function useResolvedDarkTheme(): boolean {
  const theme = useHabitStore((s) => s.settings.theme);
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return isDark;
}

function AppRoutes({ isDark }: { isDark: boolean }) {
  const onboardingDone = useHabitStore((s) => s.onboardingDone);
  const setOnboardingDone = useHabitStore((s) => s.setOnboardingDone);
  const [searchParams] = useSearchParams();
  const autostart = searchParams.get('autostart') === '1';

  useEffect(() => {
    if (autostart && !onboardingDone) {
      setOnboardingDone(true);
    }
  }, [autostart, onboardingDone, setOnboardingDone]);

  const showOnboarding = !onboardingDone && !autostart;

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={showOnboarding ? <OnboardingScreen /> : <Navigate to="/today" replace />}
      />
      <Route
        path="/create"
        element={<HabitWizardPage isDark={isDark} />}
      />
      <Route
        path="/edit/:habitId"
        element={<HabitWizardPage isDark={isDark} />}
      />
      <Route element={<AppLayout />}>
        <Route
          path="/today"
          element={showOnboarding ? <Navigate to="/onboarding" replace /> : <TodayPage isDark={isDark} />}
        />
        <Route
          path="/progress"
          element={showOnboarding ? <Navigate to="/onboarding" replace /> : <ProgressPage isDark={isDark} />}
        />
        <Route
          path="/settings"
          element={showOnboarding ? <Navigate to="/onboarding" replace /> : <SettingsPage />}
        />
        <Route path="/habit/:habitId" element={<HabitDetailPage isDark={isDark} />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={showOnboarding ? '/onboarding' : '/today'} replace />}
      />
    </Routes>
  );
}

export default function App() {
  const isDark = useResolvedDarkTheme();
  const refreshTodayKey = useHabitStore((s) => s.refreshTodayKey);
  const habits = useHabitStore((s) => s.habits);

  // Midnight rollover & app-focus re-evaluation
  useEffect(() => {
    refreshTodayKey();
    reminderService.syncReminders(habits);

    const onFocus = () => refreshTodayKey();
    const interval = window.setInterval(refreshTodayKey, 60_000);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [refreshTodayKey, habits]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <OfflineIndicator />
      <AppRoutes isDark={isDark} />
      <Toast />
    </BrowserRouter>
  );
}

# Stepwise — Guided Habit Builder & Tracker

An offline-first, mobile-first progressive web app built around two focused pillars:

1. **Guided Habit Creation** — A 6-step wizard that pairs an identity vote, a tiny 2-minute action, and a reliable cue into a clear commitment.
2. **Habit Tracking** — A calm daily check-in view, "Never miss twice" streaks, an interactive calendar heatmap, and progress overview.

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Running Unit Tests

```bash
npx --yes tsx --test src/lib/stats.test.ts
```

### Building for Production

```bash
npm run build
```

## Renaming the App

The product name is centralized in `src/lib/constants.ts`:

```ts
export const APP_NAME = 'Stepwise';
```

Update `APP_NAME` in `src/lib/constants.ts`, plus the `<title>` / manifest fields in `index.html`, `metadata.json`, and `vite.config.ts`.

## Swapping Platform Services for Native Android

All platform integrations live behind small TypeScript interfaces in `src/services/`:

- `StorageService` (`src/services/StorageService.ts`) — Swap `localStorage` for Capacitor `Preferences` or a SQLite/Room bridge.
- `ReminderService` (`src/services/ReminderService.ts`) — Swap web `Notification` timers for Capacitor Local Notifications (`@capacitor/local-notifications`) or Android `AlarmManager` / `WorkManager`.
- `HapticsService` (`src/services/HapticsService.ts`) — Swap `navigator.vibrate` for `@capacitor/haptics`.

## Packaging as an Android APK with Capacitor

1. Build the production web bundle:
   ```bash
   npm run build
   ```
2. Install Capacitor and initialize the Android project:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init Stepwise com.example.stepwise --web-dir=dist
   npx cap add android
   ```
3. Sync web assets and open Android Studio to build a signed APK/AAB:
   ```bash
   npx cap sync android
   npx cap open android
   ```

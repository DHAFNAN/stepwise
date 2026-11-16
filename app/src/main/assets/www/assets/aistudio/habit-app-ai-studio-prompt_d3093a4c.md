# Google AI Studio Prompt: "Stepwise" – Guided Habit Builder & Tracker

> Copy everything below the line into Google AI Studio.

---

## 1. ROLE & GOAL

You are a senior mobile product designer and full-stack engineer. Build a complete, polished, **mobile-first habit app** called **"Stepwise"** (working name; keep it easy to rename from a single constant). The app has exactly **two core pillars**:

1. **Guided Habit Creation**: a step-by-step wizard that helps the user design a tiny, identity-based habit.
2. **Habit Tracking**: a daily check-in screen, streaks, repetition counts, history calendar and simple progress stats.

**Out of scope (do NOT build):** lessons/articles, social features, accountability partners, sharing, "hall of fame", AI/LLM suggestions, accounts/login, payments, cloud sync, ads. Keep the app focused and small.

This is an **original product**. Do not reuse any existing app's name, logo, illustrations, slogans, or copy. All text, colors, shapes and icons must be original (use Lucide / Material Symbols icons only).

## 2. TECH STACK

- React 18 + TypeScript + Vite, Tailwind CSS, Framer Motion for animation, `lucide-react` for icons.
- State: Zustand (or React Context + reducer) with persistence to `localStorage` (versioned schema, with a `migrate` function).
- Routing: React Router (bottom-tab navigation).
- Reminders: in-app scheduling through the Notifications API + service worker (best effort on web). Abstract this behind a `ReminderService` interface so it can be swapped for Android native `AlarmManager`/`WorkManager` later.
- Make the project **PWA-installable** (manifest + service worker) and **Capacitor-ready** so it can be packaged as an Android app. Keep all platform code behind small service interfaces (`StorageService`, `ReminderService`, `HapticsService`).
- No backend. 100% offline. Include a Settings option to export/import data as JSON.

## 3. DESIGN SYSTEM (original)

**Feel:** calm, encouraging, uncluttered, warm. Large touch targets (min 48dp), generous spacing, soft rounded shapes.

**Colors (define as CSS variables; light + dark theme):**
- Background: `#F6F4EF` (light) / `#14181A` (dark)
- Surface/card: `#FFFFFF` / `#1E2427`
- Primary (deep teal): `#0F766E`, on-primary `#FFFFFF`
- Accent (coral): `#F26B5B`
- Success (leaf green): `#3FA66B`
- Warning (amber): `#E9A23B`
- Text primary: `#1F2A2E` / `#EEF2F1`; text secondary: `#66757A` / `#9AA8AD`
- Each habit can be assigned one color from a 8-color palette (teal, coral, amber, sky, violet, rose, lime, slate) used for its card accent, heatmap and chart.

**Typography:**
- Headings: "Fraunces" (serif, weight 600) for habit names and big numbers.
- Body/UI: "Plus Jakarta Sans" (400/500/700).
- Scale: Display 32/40, Title 22/28, Body 16/24, Caption 13/18.

**Shape & elevation:** cards radius 24px, buttons fully rounded (pill), chips radius 999px. Soft shadows (`0 6px 20px rgba(0,0,0,.06)`). Use an original organic "pebble" blob as a decorative background accent on empty states and onboarding (inline SVG, low opacity).

**Motion:** 200–300ms ease-out transitions; check-off triggers a satisfying scale-bounce + subtle confetti burst (small, ≤ 1s) + haptic tick (`navigator.vibrate(10)` when available). Respect `prefers-reduced-motion`.

**Accessibility:** WCAG AA contrast, visible focus states, ARIA labels on all icon buttons, screen-reader announcements on check-in ("Read 10 pages marked done, streak 5"), supports system font scaling.

## 4. DATA MODEL

```ts
type Habit = {
  id: string;
  name: string;                // e.g. "Read 10 pages"
  identity: string;            // e.g. "a reader"  -> "I want to become a reader"
  cue: { type: 'time' | 'after-habit' | 'location'; time?: string /* HH:mm */; anchor?: string; place?: string };
  place?: string;
  twoMinuteVersion?: string;   // smallest fallback version
  frequency: { type: 'daily' | 'weekdays' | 'custom'; days?: number[] /* 0-6 */ };
  color: string;
  icon: string;
  reminderEnabled: boolean;
  reminderTime?: string;
  createdAt: string;           // ISO
  archivedAt?: string;
  order: number;
};

type CheckIn = {
  id: string; habitId: string;
  date: string;                // YYYY-MM-DD (local)
  status: 'done' | 'minimum' | 'skipped';
  note?: string;
  createdAt: string;
};
```

Derived values (compute with pure, unit-tested functions in `lib/stats.ts`):
- **Repetitions** = count of `done` + `minimum` check-ins.
- **Current streak** counts consecutive *scheduled* days completed; a single missed day does not break the streak back to zero. It shows a gentle "Never miss twice" state, and the streak only resets after two consecutive missed scheduled days.
- **Longest streak**, **completion rate (last 7 / 30 days)**, **best weekday**.

## 5. SCREENS & NAVIGATION

Bottom navigation with 3 tabs: **Today**, **Progress**, **Settings**. A floating "+ New habit" button appears on Today. Wizard and detail screens open as full-screen routes / bottom sheets.

### 5.1 Onboarding (first launch only, 3 swipeable cards + skip)
1. "Start tiny." Explains that small actions repeated beat big goals.
2. "Become someone." Habits are votes for the person you want to be.
3. "Track simply." One tap a day.
CTA: "Create my first habit" → opens the Guided Creation wizard. Store `onboardingDone` flag.

### 5.2 Today (home)
- Header: greeting by time of day, date, small circular progress ring "3 of 5 done today".
- Horizontal **week strip** (Mon–Sun) with the selected day highlighted; tap to view/edit another day (allow back-fill up to 14 days, no future check-ins).
- **Habit cards** (vertical list), each showing: icon, name (serif), identity line ("I want to become a reader"), cue line ("After breakfast · Desk"), a **streak badge** (flame/bolt + number), and a large circular **check button**.
  - Tap check → `done` (animated).
  - Long-press (or the "⋯" menu) → options: "Did the 2-minute version" (`minimum`), "Skip today" (with optional note), "Undo", "Edit", "View details".
- **Compact view toggle** (switches between large cards and dense rows).
- Completed habits get a subtle "done" visual state and sink to the bottom of the list (configurable in Settings).
- **Empty state:** pebble illustration, "No habits yet. Let's design your first tiny habit." + primary button.
- **All done state:** small celebratory banner "All done for today. Nice work."
- Reorder habits by drag handle in an "Edit order" mode.

### 5.3 Guided Habit Creation (the core feature, a 6-step wizard)
Full-screen with a top progress bar (step X of 6), Back / Next buttons, and the ability to exit with a "Save draft?" confirmation. Each step has one question, a short helper line, and live validation. A **live sentence preview card** at the top builds as the user answers:

> "I will **[action]** **[when/where]** so that I can become **[identity]**."

**Step 1: Identity.** "Who do you want to become?" Free-text input + tappable suggestion chips (e.g. a reader, a mindful person, an active person, a learner, a good listener, a saver, a writer). Preview updates immediately.

**Step 2: Action.** "What's a tiny action that proves it?" Free-text + chips filtered by the chosen identity (provide a local suggestion map). Include a **Size Helper**: a 4-option segmented control ("Tiny: under 2 min", "Small: 5 min", "Medium: 15 min", "Big: 30+ min"). If Medium/Big is chosen, show a friendly nudge: "Start smaller. What's the 2-minute version?" and offer one-tap shrink suggestions (rule-based: "Read 10 pages" → "Read 1 page"). Also ask for the optional **2-minute fallback version**.

**Step 3: Cue (time & place).** "When and where will you do it?" Three cue modes (tabs):
  - **At a time:** time picker.
  - **After something I already do:** pick an anchor chip (wake up, brush teeth, morning coffee, lunch, commute, dinner, before bed) or type your own.
  - **At a place:** text input.
  Plus an optional "Where?" field.

**Step 4: Make it easy and attractive (optional, skippable).** Two short optional fields: "How can you make it obvious?" (e.g. put the book on the pillow) and "What's a small reward or pairing that makes it enjoyable?". Stored as `notes` on the habit and shown on the detail screen.

**Step 5: Frequency & reminder.** Daily / Weekdays / Custom days (7 day chips). Toggle "Remind me" with a time defaulting to the cue time. Request notification permission only here, with a one-line explanation first.

**Step 6: Style & review.** Choose color (8 swatches) and icon (grid of ~24 icons). Show the final **commitment card** with the full sentence, cue, frequency and reminder. Buttons: "Create habit" (primary), "Edit" (back). On success: confetti, a short message, and navigate to Today with the new card highlighted.

A "How it works" bottom sheet (info icon in the wizard header) shows a simple colored-sentence example with numbered markers on each part, and a "Different example" button that cycles through 5 local examples.

Edit mode re-uses the same wizard, pre-filled.

### 5.4 Habit Detail
- Header: name, identity, color accent, "⋯" menu (Edit, Pause/Archive, Delete with confirm).
- Stat tiles: **Repetitions**, **Current streak**, **Longest streak**, **30-day completion %**.
- **Calendar heatmap** (month view with prev/next; done = filled, minimum = half-filled, skipped = outlined, missed = empty). Tap a day to change its status or add a note.
- A **weekly bar chart** for the last 8 weeks (completion count per week).
- **Milestones** row (badges at 7, 21, 50, 100, 200 repetitions) shown as locked/unlocked chips, with a small unlock animation. These are local only and not shareable.
- "Notes" card showing the cue, place, the "make it easy" text and the reward text.
- **Gentle check-in suggestion:** if the streak is 0 after ≥ 2 missed days, show a non-judgmental banner: "Missing twice is a pattern forming. Want to make it smaller?" with buttons **Make it smaller** (opens the wizard at step 2) and **Not now**. This is rule-based, not AI.

### 5.5 Progress (overview)
- Segmented control: **Week / Month / All time**.
- Summary: total repetitions, active habits, overall completion rate, best day of week.
- Overall **stacked/multi-line chart** of repetitions per day colored per habit (Recharts).
- Per-habit list sorted by repetitions with a mini progress bar. Tap → Habit Detail.
- **Archived habits** section ("Retired habits") listing habits the user stopped, with their final repetition count and an option to restore.

### 5.6 Settings
- Theme: System / Light / Dark.
- Week starts on: Monday / Sunday.
- Default reminder time.
- Move completed habits to bottom (toggle).
- Haptics & sounds (toggles).
- Notifications permission status + "Open settings" hint.
- Export data (JSON download), Import data (file picker with validation), Reset all data (double confirmation).
- About: app name/version only.

## 6. INTERACTION & BEHAVIOR RULES

- All dates use the device's local timezone; "today" rolls over at local midnight (re-evaluate on app focus).
- Undo snackbar for 5 seconds after any check-in, skip or delete.
- Check-ins are idempotent per habit per day (toggle behavior).
- Form validation inline; Next is disabled until the step's required fields are valid; never lose user input when navigating Back.
- Debounce persistence; guard against corrupted localStorage (fallback to defaults and show a toast).
- Reminders: schedule per habit/day; update or cancel on edit/archive/delete; if permission is denied, show an inline explanation and keep the app fully usable.
- Tone of all copy: warm, short, non-judgmental, never guilt-based. Write all microcopy originally.

## 7. RESPONSIVE BEHAVIOR

- Design for **360–430px width first**; layout must hold from 320px to tablets.
- ≥ 768px: center content in a max-width 480px column with a subtle backdrop (phone-like), or switch to a two-pane layout (list left, detail right) for Today/Detail.
- Respect safe-area insets (`env(safe-area-inset-*)`), keep the bottom nav and FAB clear of the gesture bar.
- Landscape: allow scrolling, never clip the wizard's primary button.
- Handle large font scaling and long habit names (truncate with ellipsis in compact view, wrap in cards).

## 8. PROJECT STRUCTURE

```
src/
  app/            (router, providers, theme)
  components/     (HabitCard, CheckButton, WeekStrip, StatTile, Heatmap, WizardShell, Chip, Sheet, Toast, ProgressRing)
  features/
    onboarding/
    today/
    wizard/       (steps/IdentityStep, ActionStep, CueStep, EasyStep, FrequencyStep, ReviewStep)
    habit-detail/
    progress/
    settings/
  lib/            (stats.ts, dates.ts, suggestions.ts, ids.ts)
  services/       (StorageService, ReminderService, HapticsService)
  store/          (habitStore.ts with persist + migrations)
  styles/         (tokens.css)
```

## 9. DELIVERABLES & QUALITY BAR

1. A working app with all screens above, wired together, with seed-free first launch (empty state) plus a hidden "Load demo data" button in Settings for testing.
2. Unit tests for streak, repetition and completion-rate logic (edge cases: skipped days, non-daily schedules, back-filling, month boundaries, DST changes).
3. No console errors, no placeholder "lorem ipsum", no broken links.
4. A short README covering: how to run, how to rename the app, how to swap services for native Android, and how to wrap with Capacitor to produce an APK.
5. Keep dependencies minimal and the bundle lean; lazy-load Progress/Detail charts.

Build the full app now, starting with the design tokens, store and Today screen, then the creation wizard, then Detail, Progress and Settings. After generating, list any assumptions you made.

---

### OPTIONAL: Native Android variant
If you want native instead of web, replace section 2 with: **Kotlin + Jetpack Compose (Material 3), MVVM, Room for persistence, Hilt for DI, WorkManager/AlarmManager for reminders, Navigation-Compose, Vico or MPAndroidChart for charts, minSdk 26, targetSdk 35.** Keep all sections 3–7 unchanged, mapping the design tokens to a Compose `MaterialTheme` (custom color scheme, typography and shapes).

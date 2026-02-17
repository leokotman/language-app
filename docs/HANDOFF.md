# Language Learning App — Project History & Handoff

This file is the canonical handoff for the language app. Update it after each session with **Current state**, **Session summary (latest)**, and **Suggestions for next steps**.

**Session start:** Create a branch from `main` (e.g. `feat/lang-011-…`). Use the next task number from §4 session summary or §6 Priority. Load this file and `docs/AI agent instructions.md` for context.

---

## 1. Project history (by week)

### Week 1 — Project setup (Feb 5, 2026)

1. Initialized Vite + React + TypeScript project.
2. Configured MUI theme with light/dark mode.
3. Set up project structure (src/, components/, lib/, pages/, etc.).
4. Configured PWA plugin (vite-plugin-pwa).
5. Set up Supabase client and environment variables.
6. Set up Vitest for unit testing.
7. Created basic layout (AppBar, navigation, routes).

**Constraints:** Free-tier services only; React + TypeScript + MUI (no Tailwind).

### Week 2 — Authentication (Feb 5, 2026)

1. Implemented Supabase Auth: email/password signup, login, forgot password.
2. Auth state management with Zustand store and useAuth hook.
3. Protected routes and Navbar auth UI.
4. User profile creation (migration 001, auto-create on signup).
5. Unit tests for errors and auth store.
6. Fix: login on first attempt; docs for customizing signup email.

### Week 3 — Core data layer (Feb 6, 2026)

1. Database schema: migration 002 — tables `languages`, `user_languages`, `vocabulary`, `user_vocabulary` with RLS.
2. Typed Supabase client; API and hooks; TanStack Query.
3. Settings: language pair selection (EN↔RU, EN↔SR Latin only).
4. Single-step addWordToLibrary; handle 404 when migration 002 not run.

### Week 4 — Personal library (Feb 6, 2026)

1. Library page: list, search, filter by language pair; add/edit/delete with ConfirmDialog.
2. Bidirectional pairs; virtual pair Russian ↔ Serbian (via English).
3. Layout: sticky navbar, full-height main.

### Week 5 — App library, seed, dictionary, import/export (Feb 6–9, 2026)

1. Seed data: migrations 003, 005, optional 008; App Library; Dictionary (MyMemory, one tab with app library).
2. Library import/export CSV and JSON; Supabase RLS/docs; code quality refactor.

### Week 6 — Input sanitization, offline, errors, E2E (Feb 6–11, 2026)

1. Input sanitization (OWASP); offline mode toggle; error handling.
2. Offline PWA: IndexedDB cache, OfflinePrefetch, Navbar toggle, dictionary offline.
3. Performance (lang-007); E2E: Playwright (home, library), data-testid, E2E auth helper.

---

## 2. Current state

- **Auth:** Login, signup, forgot password, protected routes, profiles (migration 001).
- **Settings:** Language pairs (add/remove with confirmation); requires migration 002.
- **Library:** List, search, filter, add/edit/delete with confirm; requires 002.
- **Dictionary:** One tab — lookup (MyMemory en↔ru, en↔sr), browse app library, add to my library; offline from cache when synced.
- **Offline:** Navbar toggle; IndexedDB cache; OfflinePrefetch; sync on “Offline” ON.
- **Migrations:** Run 001 → 002 → 003 → (optional 005, 008) → 004 → 006 → 007 (see `SUPABASE_SETUP.md`).
- **E2E:** Playwright; run `npx playwright install` then `npm run test:e2e`.

---

## 3. Project structure (reference)

- `src/components/common/` — ConfirmDialog, etc.
- `src/components/features/` — auth (ProtectedRoute), offline (OfflinePrefetch).
- `src/components/layout/` — Layout, Navbar.
- `src/pages/` — HomePage, LibraryPage, DictionaryPage, SettingsPage, LoginPage, SignupPage, ForgotPasswordPage, ProgressPage, StudyPage (shell).
- `src/api/` — languages, userLanguages, vocabulary, profiles.
- `src/hooks/` — useAuth, useLanguages, useUserLanguages, useVocabulary.
- `src/lib/` — supabase, errors, sanitize, dictionary, offlineCache, offlineSync, offlineDebug, importExport, fsrs.
- `src/stores/` — authStore, offlineModeStore.
- `docs/supabase-migrations/` — 001–008.
- `e2e/` — home.spec.ts, library.spec.ts, helpers/auth.ts.

---

## 4. Session summary (latest — today’s work)

Recent work (from git, latest first):

- lang-011: FSRS + study session — src/lib/fsrs.ts (ts-fsrs: row↔Card, scheduleRating); API listDueToday(userId, filters?); hooks useDueToday, useUpdateUserVocabulary invalidates due-today; Study page: language pair, due count, start session, card → reveal → Again/Hard/Good/Easy, update SRS, next or complete. Unit tests for fsrs helper.
- Doc revisions: agent instructions (branch-from-main clarity), HANDOFF session-start note and next task (lang-011).
- Confluence/Jira removed; handoff moved to repo (`docs/HANDOFF.md`), docs updated.
- E2E (lang-009): Playwright — home + library specs; unauthenticated redirect; authenticated add/edit/delete; data-testid for loading/error/empty; E2E auth helper and `.env` (E2E_TEST_EMAIL, E2E_TEST_PASSWORD).
- Performance (lang-007): query and table updates for Supabase performance.
- Phase 3 seed (lang-008): migration 008, 128 triples.
- Dictionary offline (lang-006): persist lookups in IndexedDB; use lookup cache when offline; debounce/perf fixes; migration 001 idempotent.
- Offline PWA (lang-005): IndexedDB cache, OfflinePrefetch, Navbar Offline toggle, full sync; Dictionary from cache; offline debug docs.
- Code quality (lang-004): refactor per Cursor rules.
- Dictionary + App Library (lang-003): one tab; Serbian lookup; virtual pair filter; user-friendly copy.
- Seed, App Library, import/export (lang-002): migrations 003/005, RLS/docs.
- Earlier: auth, core data layer (002), library (list/add/edit/delete, bidirectional + virtual pairs), input sanitization, error handling.

**To see full history:** `git log --oneline -40`.

---

## 5. Suggestions for next steps

*Not yet implemented; pick from here (and from §6 Priority) for the next feature.*

- Phase 3: FSRS algorithm, “due today” query, study session flow (start, show card, reveal, rate, update SRS).
- Phase 3: Flashcard, reverse flashcard, typing, multiple choice, listening (TTS); adaptive exercise selection; E2E for study session.
- Default language pair: preselect when user has one pair; “study language” in Settings or Study page.
- Validation: trim and max length on word/translation in add/edit (align with sanitize).
- “I’ve run the migration” button to refetch after showing migration instructions.
- Categories or notes on vocabulary (schema migration + UI).
- Phase 4+: Speech integration, pronunciation practice.
- Phase 5+: Progress dashboard, stats, streaks, XP, achievements.
- Phase 6+: AI features (mnemonics, pronunciation tips).
- Phase 7: Full E2E suite, performance, Lighthouse, deploy to production.

---

## 6. Priority now

1. **Phase 3 (continued):** More exercise types (reverse flashcard, typing, multiple choice), E2E for study.
2. Default language pair and “study language” in Settings/Study.
3. Validation (trim/max length) in add/edit word.
4. “I’ve run the migration” button.
5. Categories or notes on vocabulary (optional).

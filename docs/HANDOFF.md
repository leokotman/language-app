# Language Learning App — Handoff

Update after each session: **Current state**, **Session summary**, **Suggestions / Priority**. Full history: `git log --oneline -40` or `docs/CHANGELOG.md`.

**Session start:** Branch from `main` (e.g. `feat/lang-014-…`). Next task number from §3 or §5. Load this file and `docs/AI agent instructions.md`.

---

## 1. Current state

- **Auth:** Login, signup, forgot password, protected routes, profiles (migration 001).
- **Settings:** Language pairs (add/remove with confirmation); requires migration 002.
- **Library:** List, search, filter, add/edit/delete with confirm; requires 002.
- **Dictionary:** One tab — lookup (MyMemory en↔ru, en↔sr), browse app library, add to my library; offline from cache when synced.
- **Offline:** Navbar toggle; IndexedDB cache; OfflinePrefetch; sync on “Offline” ON.
- **Migrations:** Run 001 → 002 → 003 → (optional 005, 008) → 004 → 006 → 007 (see `SUPABASE_SETUP.md`).
- **E2E:** Playwright; run `npx playwright install` then `npm run test:e2e`. Specs: home, library, study (redirect + full session flow: add word → start session → do card → rate → session complete).

---

## 2. Project structure

- `src/components/common/` — ConfirmDialog, etc.
- `src/components/features/` — auth (ProtectedRoute), offline (OfflinePrefetch).
- `src/components/layout/` — Layout, Navbar.
- `src/pages/` — HomePage, LibraryPage, DictionaryPage, SettingsPage, LoginPage, SignupPage, ForgotPasswordPage, ProgressPage, StudyPage (flashcard, reverse flashcard, typing, multiple choice).
- `src/api/` — languages, userLanguages, vocabulary, profiles.
- `src/hooks/` — useAuth, useLanguages, useUserLanguages, useVocabulary.
- `src/lib/` — supabase, errors, sanitize, dictionary, offlineCache, offlineSync, offlineDebug, importExport, fsrs.
- `src/stores/` — authStore, offlineModeStore.
- `docs/supabase-migrations/` — 001–008.
- `e2e/` — home.spec.ts, library.spec.ts, study.spec.ts, helpers/auth.ts.

---

## 3. Session summary (latest)

Recent work (from git, latest first):

- lang-013: E2E for study session — data-testid on Study page; e2e/study.spec.ts (redirect, full session flow; resilient loop: wait for Reveal first, handle all exercise types, 60s timeout). Fix: Study page shows “Session complete” after last card (set currentIndex past end instead of setSession(null)); rating buttons not disabled for E2E; removed unused reverseMultipleChoiceOptions.
- lang-012: Study page — added flashcard (word→translation, reveal, rate) and reverse flashcard (translation→word, reveal, rate); four exercise types: flashcard, reverse_flashcard, typing, multiple_choice; helper buildReverseMultipleChoiceOptions for future use.
- lang-011: FSRS + study session — src/lib/fsrs.ts (ts-fsrs: row↔Card, scheduleRating); API listDueToday(userId, filters?); hooks useDueToday, useUpdateUserVocabulary invalidates due-today; Study page: language pair, due count, start session, card → reveal → Again/Hard/Good/Easy, update SRS, next or complete. Unit tests for fsrs helper.
- Doc revisions: agent instructions (branch-from-main clarity), HANDOFF session-start note and next task (lang-011).
- Confluence/Jira removed; handoff moved to repo (`docs/HANDOFF.md`), docs updated.
- E2E (lang-009, lang-013): Playwright — home, library, study specs; unauthenticated redirect; authenticated add/edit/delete (library), full study session (study); data-testid for loading/error/empty and study states; E2E auth helper and `.env` (E2E_TEST_EMAIL, E2E_TEST_PASSWORD).
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

## 4. Suggestions for next steps

*Not yet implemented; pick from here (and from §6 Priority) for the next feature.*

- Phase 3: FSRS algorithm, “due today” query, study session flow (start, show card, reveal, rate, update SRS).
- Phase 3: Listening (TTS), reverse multiple choice (translation→word pick) UI; adaptive exercise selection.
- Default language pair: preselect when user has one pair; “study language” in Settings or Study page.
- Validation: trim and max length on word/translation in add/edit (align with sanitize).
- “I’ve run the migration” button to refetch after showing migration instructions.
- Categories or notes on vocabulary (schema migration + UI).
- Phase 4+: Speech integration, pronunciation practice.
- Phase 5+: Progress dashboard, stats, streaks, XP, achievements.
- Phase 6+: AI features (mnemonics, pronunciation tips).
- Phase 7: Full E2E suite, performance, Lighthouse, deploy to production.

---

## 5. Priority now

1. **Phase 3 (continued):** Reverse multiple choice (translation→word) UI; TTS (listening).
2. Default language pair and “study language” in Settings/Study.
3. Validation (trim/max length) in add/edit word.
4. “I’ve run the migration” button.
5. Categories or notes on vocabulary (optional).

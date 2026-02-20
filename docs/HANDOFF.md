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
- `src/pages/` — HomePage, LibraryPage (subcomponents: AddWordForm, ImportExportBar, LibraryFilterBar, LibraryList, EditWordDialog; `LibraryPage.helpers`, `LibraryPage.models`), DictionaryPage (subcomponents: DictionaryLookupBar, DictionaryResultsList; `DictionaryPage.constants`, `DictionaryPage.models`), SettingsPage, LoginPage, SignupPage, ForgotPasswordPage, ProgressPage, StudyPage (subcomponents in `StudyPage/components/`: SignInAlert, StudyLoading, NoCardsDue, StudySetup, SessionComplete, card blocks, RatingButtons; `StudyPage.constants`, `StudyPage.helpers`, `StudyPage.models`).
- `src/api/` — languages, userLanguages, vocabulary, profiles.
- `src/hooks/` — useAuth, useLanguages, useUserLanguages, useVocabulary, useAudioRecorder.
- `src/lib/` — supabase, errors, sanitize, dictionary, offlineCache, offlineSync, offlineDebug, importExport, fsrs.
- `src/stores/` — authStore, offlineModeStore.
- `docs/supabase-migrations/` — 001–008.
- `e2e/` — home.spec.ts, library.spec.ts, study.spec.ts, helpers/auth.ts.
- **Docs:** `docs/REFACTORING_OPPORTUNITIES.md` (chore: where to split components, utils, types); `docs/TEST_COVERAGE.md` (coverage command, current table, target 70–80%).

---

## 3. Session summary (latest)

Recent work (from git, latest first):

- chore (lang-017): Unit test coverage — reached 70% on all metrics (statements, branches, functions, lines); coverage thresholds enabled in vite.config.ts; added LibraryPage component tests (AddWordForm, EditWordDialog, ImportExportBar, LibraryFilterBar, LibraryList), StudyPage smoke tests (SignInAlert, NoCardsDue), DictionaryPage/LibraryPage smoke tests; docs/TEST_COVERAGE.md updated.
- chore (refactor): Study page — split into layout components (SignInAlert, StudyLoading, NoCardsDue, StudySetup, SessionComplete), card block components (FlashcardBlock, ReverseFlashcardBlock, TypingBlock, MultipleChoiceBlock, ReverseMultipleChoiceBlock, ListeningBlock, SpeakingBlock, AnswerFeedbackBlock, RatingButtons), condition constants (EXERCISE_TYPE_SUBTITLES), memoized handlers; helpers and types in StudyPage.helpers / StudyPage.models; components index.
- lang-015: Phase 4 speech (recording only). New exercise type **speaking**: see/hear word → Record → Stop → Play back → self-rate (Again/Hard/Good/Easy). useAudioRecorder hook (getUserMedia + MediaRecorder), playRecordingBlob helper; StudyPage speaking UI and E2E handling (Record/Stop in loop).
- lang-014: Phase 3 — reverse multiple choice (translation→word pick) and listening (TTS). New exercise types: reverse_multiple_choice (show translation, pick word from 4 options; buildReverseMultipleChoiceOptions), listening (Play word via Web Speech API, pick translation from 4 options; speakWord helper with language_from). StudyPage: new options in EXERCISE_TYPE_OPTIONS, UI blocks and correct-answer display; E2E excludes "Play word" from option click.
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

## 4. User feedback (Feb 2025) — to address

- **Home page:** Still uses mock data (PLACEHOLDER_WORDS); needs a proper Home (e.g. quick stats, due today, links).
- **Progress page:** Placeholder only; should include stats by languages/words/exercises, **score by language pair (2 dimensions: A→B vs B→A)**, and dates for notifications.
- **Study setup:** Exercise-type checkboxes need **Select all / Deselect all** for convenience.
- **Multiple-choice language bug:** When a pair is bidirectional (e.g. ru-sr), `listDueToday` returns **both directions** in one session. Options are then built from all cards, so e.g. sr→ru shows Serbian words mixed with Russian in the same 4 options. **Fix:** options must be in a single language — for word→translation use only cards with same `language_from`/`language_to` and only `translation`; for translation→word use only `word` from same-direction cards.
- **Scoring & exercises (agreed focus):** Per-word/phrase scoring: +5 correct, −10 incorrect; word is "learnt" when e.g. score ≥50 and practised on ≥5 different dates. By default show only **not learnt** words; optional "Train ALL words" before session. After 3 months without practice: deduct 20 points (floor at 40). Notifications: suggest pair and words studied long ago or with low score (needs stored dates + scores). Requires schema: store score and per-direction stats — see §6.

---

## 5. Suggestions for next steps

_Not yet implemented; pick from here (and from §6 Priority) for the next feature._

- **Chore:** Refactor LibraryPage / DictionaryPage (subcomponents, helpers) — see `docs/REFACTORING_OPPORTUNITIES.md`.
- **Chore (done lang-017):** Unit test coverage at 70%+ on all metrics; thresholds enforced in CI. See `docs/TEST_COVERAGE.md`.
- Phase 3: FSRS algorithm, “due today” query, study session flow (start, show card, reveal, rate, update SRS).
- Phase 3: Adaptive exercise selection (e.g. weight by difficulty).
- Default language pair: preselect when user has one pair; “study language” in Settings or Study page.
- Validation: trim and max length on word/translation in add/edit (align with sanitize).
- “I’ve run the migration” button to refetch after showing migration instructions.
- Categories or notes on vocabulary (schema migration + UI).
- Phase 4 – Speech: recording + comparison. See **`docs/SPEECH_PLAN.md`** (recording → STT compare; pronunciation assessment omitted — no free-tier-friendly option).
- Phase 5+: Progress dashboard, stats, streaks, XP, achievements.
- Phase 6+: AI features (mnemonics, pronunciation tips).
- Phase 7: Full E2E suite, performance, Lighthouse, deploy to production.

---

## 6. Priority now (exercises & scoring first)

1. **fix:** Multiple-choice / reverse multiple-choice — options in one language only (filter by same direction as current card). _Next task: lang-018._
2. **feat:** Study setup — Select all / Deselect all for exercise types.
3. **feat:** Scoring system — DB (score, dates, learnt, per direction), +5/−10, learnt rule, "Train ALL", 3‑month decay.
4. **feat:** Progress page — stats, score by pair (2D), store dates for notifications.
5. **feat:** Notifications — suggest pair and words (old / low score).
6. **feat:** Home page — real data instead of mock.
7. Default language pair; validation; migration button; Phase 4 STT; categories (optional).

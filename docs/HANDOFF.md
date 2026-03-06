# Language Learning App — Handoff

Update after each session: **Current state**, **Session summary**, **Suggestions / Priority**. Full history: `git log --oneline -40` or `docs/CHANGELOG.md`.

**Session start:** 
1. Check §3 or §5 for next task or feature.
2. **Create JIRA ticket first** (if not already created) → get ticket number (e.g., KAN-42).
3. Create branch from `main` with that number: `feat/KAN-42-description` (e.g. `feat/KAN-42-home-page-redesign`).
4. Link PR to ticket when pushing (automatic if using KAN-XX in branch name).

Load: this file (`docs/HANDOFF.md`) and `docs/AI agent instructions.md`.

---

## 1. Current state

- **Auth:** Login, signup, forgot password, protected routes, profiles (migration 001).
- **Settings:** Language pairs (add/remove with confirmation); requires migration 002.
- **Library:** List, search, filter, add/edit/delete with confirm; requires 002.
- **Home:** Real dashboard (no mock data): due today count, tracked words, learnt words, average score, active language pairs, quick actions to Study/Library/Dictionary/Progress, sign-in/loading/error/empty states.
- **Dictionary:** One tab — lookup (MyMemory en↔ru, en↔sr), browse app library, add to my library; offline from cache when synced.
- **Offline:** Navbar toggle; IndexedDB cache; OfflinePrefetch; sync on “Offline” ON.
- **Migrations:** Run 001 → 002 → 003 → (optional 005, 008) → 004 → 006 → 007 → 009 (see `SUPABASE_SETUP.md`).
- **E2E:** Playwright; run `npx playwright install` then `npm run test:e2e`. Specs: home, library, study (redirect + full session flow: add word → start session → do card → rate → session complete).

---

## 2. Project structure

- `src/components/common/` — ConfirmDialog, etc.
- `src/components/features/` — auth (ProtectedRoute), offline (OfflinePrefetch).
- `src/components/layout/` — Layout, Navbar.
- `src/pages/` — HomePage, LibraryPage (subcomponents: AddWordForm, ImportExportBar, LibraryFilterBar, LibraryList, EditWordDialog; `LibraryPage.helpers`, `LibraryPage.models`), DictionaryPage (subcomponents: DictionaryLookupBar, DictionaryResultsList; `DictionaryPage.constants`, `DictionaryPage.models`), SettingsPage, LoginPage, SignupPage, ForgotPasswordPage, ProgressPage (ProgressPage.models, ProgressPage.constants, ProgressPage.helpers; stats by pair, score by direction A→B/B→A), StudyPage (subcomponents in `StudyPage/components/`: SignInAlert, StudyLoading, NoCardsDue, StudySetup, SessionComplete, card blocks, RatingButtons; `StudyPage.constants`, `StudyPage.helpers`, `StudyPage.models`).
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

- feat (KAN-42): Home page dashboard — removed `PLACEHOLDER_WORDS`; wired real data via `useDueToday` + `useVocabularyScores`; added Home stats helper (`buildHomeStats`) and quick actions (Study/Library/Dictionary/Progress); implemented sign-in/loading/error/empty states; added unit tests for Home page and helpers; updated app route smoke test expectations.
- feat (KAN-20): Progress page — branch `feat/KAN-20-progress-page`. **Done:** API `listVocabularyScores` (vocabulary_score joined with vocabulary); hook `useVocabularyScores`; Progress page: stats by language pair, score by direction (A→B and B→A), word count, average score, learnt count, last studied; "due today" alert; sign-in/loading/error/empty states. Tests: listVocabularyScores, useVocabularyScores, aggregateProgressByPair, ProgressPage UI. Next: notifications (see SCORING_DESIGN step 6).
- feat (KAN-19): Scoring — **Steps 1–4 done:** Research (docs/SCORING_DESIGN.md); migration 009 (vocabulary_score table + RLS); Formula C in `src/lib/scoring.ts`; API `upsertVocabularyScore`; study session updates score after each rating. Progress page (step 5) done in KAN-20.
- fix (KAN-18): Multiple-choice / reverse multiple-choice — options in one language only (sameDirectionCards; filter by language_from/language_to). chore: avoid single-letter variables across codebase; docs: HANDOFF priority, general-clean-code variable names.
- feat (KAN-18 branch): Study setup — **Select all** / **Deselect all** for exercise-type checkboxes (StudySetup buttons, handlers in StudyPage; tests).
- chore (KAN-17): Unit test coverage — reached 70% on all metrics (statements, branches, functions, lines); coverage thresholds enabled in vite.config.ts; added LibraryPage component tests (AddWordForm, EditWordDialog, ImportExportBar, LibraryFilterBar, LibraryList), StudyPage smoke tests (SignInAlert, NoCardsDue), DictionaryPage/LibraryPage smoke tests; docs/TEST_COVERAGE.md updated.
- chore (refactor): Study page — split into layout components (SignInAlert, StudyLoading, NoCardsDue, StudySetup, SessionComplete), card block components (FlashcardBlock, ReverseFlashcardBlock, TypingBlock, MultipleChoiceBlock, ReverseMultipleChoiceBlock, ListeningBlock, SpeakingBlock, AnswerFeedbackBlock, RatingButtons), condition constants (EXERCISE_TYPE_SUBTITLES), memoized handlers; helpers and types in StudyPage.helpers / StudyPage.models; components index.
- KAN-15: Phase 4 speech (recording only). New exercise type **speaking**: see/hear word → Record → Stop → Play back → self-rate (Again/Hard/Good/Easy). useAudioRecorder hook (getUserMedia + MediaRecorder), playRecordingBlob helper; StudyPage speaking UI and E2E handling (Record/Stop in loop).
- KAN-14: Phase 3 — reverse multiple choice (translation→word pick) and listening (TTS). New exercise types: reverse_multiple_choice (show translation, pick word from 4 options; buildReverseMultipleChoiceOptions), listening (Play word via Web Speech API, pick translation from 4 options; speakWord helper with language_from). StudyPage: new options in EXERCISE_TYPE_OPTIONS, UI blocks and correct-answer display; E2E excludes "Play word" from option click.
- KAN-13: E2E for study session — data-testid on Study page; e2e/study.spec.ts (redirect, full session flow; resilient loop: wait for Reveal first, handle all exercise types, 60s timeout). Fix: Study page shows "Session complete" after last card (set currentIndex past end instead of setSession(null)); rating buttons not disabled for E2E; removed unused reverseMultipleChoiceOptions.
- KAN-12: Study page — added flashcard (word→translation, reveal, rate) and reverse flashcard (translation→word, reveal, rate); four exercise types: flashcard, reverse_flashcard, typing, multiple_choice; helper buildReverseMultipleChoiceOptions for future use.
- KAN-11: FSRS + study session — src/lib/fsrs.ts (ts-fsrs: row↔Card, scheduleRating); API listDueToday(userId, filters?); hooks useDueToday, useUpdateUserVocabulary invalidates due-today; Study page: language pair, due count, start session, card → reveal → Again/Hard/Good/Easy, update SRS, next or complete. Unit tests for fsrs helper.
- Doc revisions: agent instructions (branch-from-main clarity), HANDOFF session-start note and next task (KAN-11).
- Confluence/Jira removed; handoff moved to repo (`docs/HANDOFF.md`), docs updated.
- E2E (KAN-09, KAN-13): Playwright — home, library, study specs; unauthenticated redirect; authenticated add/edit/delete (library), full study session (study); data-testid for loading/error/empty and study states; E2E auth helper and `.env` (E2E_TEST_EMAIL, E2E_TEST_PASSWORD).
- Performance (KAN-07): query and table updates for Supabase performance.
- Phase 3 seed (KAN-08): migration 008, 128 triples.
- Dictionary offline (KAN-06): persist lookups in IndexedDB; use lookup cache when offline; debounce/perf fixes; migration 001 idempotent.
- Offline PWA (KAN-05): IndexedDB cache, OfflinePrefetch, Navbar Offline toggle, full sync; Dictionary from cache; offline debug docs.
- Code quality (KAN-04): refactor per Cursor rules.
- Dictionary + App Library (lang-003): one tab; Serbian lookup; virtual pair filter; user-friendly copy.
- Seed, App Library, import/export (lang-002): migrations 003/005, RLS/docs.
- Earlier: auth, core data layer (002), library (list/add/edit/delete, bidirectional + virtual pairs), input sanitization, error handling.

**To see full history:** `git log --oneline -40`.

---

## 4. User feedback (Feb 2025) — to address

- **Home page:** ~~Still uses mock data (PLACEHOLDER_WORDS); needs a proper Home (e.g. quick stats, due today, links).~~ → **Done (KAN-42):** real dashboard with due today, summary stats, quick actions (Study/Library/Dictionary/Progress), and sign-in/loading/error/empty states.
- **Progress page:** ~~Placeholder only; score by pair (2 dimensions: A→B vs B→A)~~ → **Done (lang-020):** Stats by pair, score per direction (A→B, B→A), word count, average score, learnt count, last studied; due-today alert. Notifications (dates) still to do.
- **Study setup:** ~~Exercise-type checkboxes need Select all / Deselect all~~ → **Done:** Select all / Deselect all buttons added.
- **Multiple-choice language bug:** ~~Options mixed when bidirectional pair~~ → **Done:** options filtered by same direction (same `language_from`/`language_to`).
- **Scoring & exercises (to be designed):** Scoring in a **separate table** linked to language pair; **direction matters** (ru→en and en→ru are separate, e.g. by pair id or pair key). **Scoring rules to be revised:** not fixed +5/−50 etc — base on **human psychology, pace of learning and forgetting**; use **spaced repetition / forgetting-curve research** (e.g. review intervals: several hours, 1 day, 3 days, 1 week, etc.). **Action:** find and summarise research, then define points/intervals/“learnt” and decay. Then: default to “not learnt” only; optional “Train ALL words”; notifications from dates + scores. See §6.

---

## 5. Suggestions for next steps

_Not yet implemented; pick from here (and from §6 Priority) for the next feature._

- **Chore:** Refactor LibraryPage / DictionaryPage (subcomponents, helpers) — see `docs/REFACTORING_OPPORTUNITIES.md`.
**Chore (done KAN-17): Unit test coverage at 70%+ on all metrics; thresholds enforced in CI. See `docs/TEST_COVERAGE.md`.
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

## 6. Priority and future steps (described)

**Completed this branch:** (1) Multiple-choice options same language only (KAN-18). (2) Study setup Select all / Deselect all.

**Current branch (KAN-21):** Home page — real dashboard with hooks data and quick actions (completed in KAN-42; renaming branch to match correct JIRA ticket). Next: notifications (see `docs/SCORING_DESIGN.md` step 6).

**Branch numbering:** Each branch MUST correspond to a JIRA ticket number. Before starting a feature:
- Create or identify the JIRA ticket (format: KAN-XXX)
- Name the branch with that exact number: `feat/KAN-XXX-description`
- This ensures PR-to-ticket linking and maintains traceability

**Next (order TBD):**

- **Scoring system (design first)** — Research done; see `docs/SCORING_DESIGN.md`.  
  **Schema:** Separate table (e.g. `word_score` or `vocabulary_score`) linked to **language pair with direction**: ru→en and en→ru are distinct (link by pair id or pair key e.g. `ru-en` / `en-ru`). One row per (user, vocabulary, direction); fields: score, last_exercise_at, practised_dates_count, learnt, etc.  
  **Rules:** Do **not** hardcode +5/−10. **Revise using research:** human psychology, learning/forgetting pace, **spaced repetition** (review intervals: e.g. several hours, 1 day, 3 days, 1 week — find classic studies and derive points and "learnt" threshold). Then: correct/incorrect points, "learnt" definition, optional "Train ALL words", decay after long inactivity. **Action:** Document research and proposed constants in a design doc before implementing.  
  **Integration:** Study session updates this table per direction; "due" / "not learnt" filter uses it; Progress and notifications read from it.

- **Progress page** — Stats by languages, words, exercises; **score by pair in 2 dimensions** (A→B and B→A). Use scoring table + dates; "last studied", "learnt", "needs review".

- **Notifications** — Use scoring table + dates: suggest pair and words (long ago / low score). Depends on scoring table; in-app or push later.

- **Home page** — ~~Replace mock with real summary: due today, link to Study; Progress teaser; links to Library/Dictionary.~~ **Done (KAN-42).**

- **Phase 6 – AI API integration and usage** — **Provider:** Google Gemini API, free tier ([pricing](https://ai.google.dev/gemini-api/docs/pricing)); API keys only in server-side proxy (e.g. Vercel Edge / serverless), never in client. **Security:** Rate limits (e.g. per existing sketch), input sanitization, response validation; cache responses (e.g. 24h) to reduce calls; see `docs/archive/ai-chat-code-2026-02-05T16-40-30-617Z-ai-security.ts`. **How AI customizes exercise:** (1) **Chat intent → session:** User says e.g. “train pronunciation for my vocabulary” → app loads user’s vocabulary (selected pair or all) → run study session with **exercise types = listening + speaking** on that set; optionally Gemini suggests which words to prioritise for pronunciation (order/subset). (2) **Session params:** “I have 10 min” / “mix easy and hard” → optional Gemini call to suggest card count and exercise-type mix; start session with those params. (3) **Per-word:** On-demand mnemonic, example sentence, pronunciation tip (buttons); cached, rate-limited. **Pronunciation flow:** User in chat: “Scan my vocabulary and train pronunciation for those words.” App resolves word set; optionally Gemini suggests order/subset; then launch pronunciation-only session (listening + speaking) for that set.

- **Lower priority** — Default language pair; validation; migration button; Phase 4 STT; categories (optional).

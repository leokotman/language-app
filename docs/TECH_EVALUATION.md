Language App — Tech Manager Evaluation (one-time assessment; reference for order of work and gaps.)

1. Phase of development & completion
   Where you are: Late Phase 2 / solid Phase 3 of the original roadmap.
   Area Status Notes
   Foundation ✅ Done Vite, React 19, TS, MUI, PWA, Supabase, Vitest
   Auth ✅ Done Email/password, profiles, protected routes (no Google OAuth yet)
   Core data ✅ Done Migrations 001–008, RLS, typed client, TanStack Query
   Library ✅ Done CRUD, search, filters, import/export, bidirectional + virtual pairs
   Dictionary ✅ Done MyMemory lookup, app library, offline cache
   Offline ✅ Done IndexedDB, OfflinePrefetch, navbar toggle
   Study engine 🟡 ~80% FSRS, due-today, 4 exercise types (flashcard, reverse, typing, MC). Missing: TTS, reverse MC, E2E for study
   Progress ⬜ Placeholder “Stats, streaks and achievements will go here.”
   E2E 🟡 Partial Home + Library; no Study, Settings, or Dictionary
   Production ⬜ Not done No deploy config, no CI/CD, no env-based config
   Rough completion: ~65–70% of the full roadmap (Phases 1–5). Core learning loop (library → study → SRS) works; Progress and “polish + ship” are open.
2. Seniority of tech solutions & performance
   Strengths
   Stack: React 19, Vite 7, TanStack Query v5, Zustand, typed Supabase — modern and appropriate.
   Architecture: Clear split: api/ → hooks/ → pages; page folders with .models, .constants, .helpers; Cursor rules for consistency.
   Data: RLS, typed DB client, migrations, performance work (lang-007). FSRS (ts-fsrs) is a proper SRS choice.
   Security: Input sanitization (OWASP), no any, env for secrets.
   Offline: Intentional PWA design (IndexedDB, prefetch, sync) rather than an afterthought.
   Gaps / risks
   Testing depth: Unit tests cover sanitize, errors, fsrs, auth store, theme, App (with QueryClient fix). No unit tests for Study helpers, vocabulary hooks, or offline sync; E2E only for home + library.
   Resilience: No React Error Boundary; uncaught render errors can take down the whole app. No central error reporting (e.g. Sentry).
   Performance: No code-splitting, lazy routes, or lazy imports; no image optimization or Lighthouse/Web Vitals baseline. Worth adding as explicit steps to improve (see §3a Performance and §5 Order of work).
   Test environment: localStorage not available in tests (stderr from theme/offline store); no shared test setup that mocks or polyfills it.
   Types: Strong typing in app code; no strict check that API responses match DB types (e.g. runtime validation / Zod) for extra safety.
   Verdict: Mid–senior implementation: solid structure and choices; next step is more tests, error handling, performance (code-splitting / lazy loading), and production readiness.
3. What else can be done
   3a) Coding & quality
   Tests
   E2E for Study (start session, do a card, rate, finish) and optionally Settings/Dictionary.
   Unit tests for StudyPage.helpers (e.g. buildMultipleChoiceOptions, assignExerciseTypes), and for critical hooks (e.g. useDueToday, useUpdateUserVocabulary).
   Fix test env: mock localStorage (or use jest-environment-jsdom with storage) so theme/offline store don’t log errors in tests.
   Error handling
   Add an Error Boundary (e.g. around Layout or route tree) with a simple “Something went wrong” + retry.
   Optional: Sentry (or similar) for production errors and failed API calls.
   DX / consistency
   Optional: Zod (or similar) for API/DB response validation and shared types.
   Optional: Pre-commit or CI: lint, test, build so main stays green.
   Performance (steps to improve)
   Code-splitting: Lazy-load route components (React.lazy + Suspense) for Study, Library, Dictionary, Settings (and other heavy pages).
   Lazy imports: Defer non-critical imports where it makes sense (e.g. heavy libs only when a feature is used).
   Optimization: One-time Lighthouse + Core Web Vitals baseline; document results and fix critical issues. Consider image optimization if/when images are added.
   3b) Functionality
   High impact, already on HANDOFF
   Default / “study” language: Preselect single pair when user has one; “study language” in Settings or Study to reduce friction.
   Validation: Trim and max length in add/edit word (aligned with sanitize); clear error messages.
   “I’ve run the migration”: Button to refetch after showing migration instructions (better first-run UX).
   Phase 3 completion
   E2E for study session (priority).
   Reverse multiple choice (translation → choose word); helper exists, needs UI.
   TTS (listening): e.g. browser Speech Synthesis for “hear → type or choose”; big UX win for pronunciation.
   Progress & engagement (Phase 5)
   Progress page: “Due today” count, reviews this week, simple streak (e.g. days with at least one review). Later: XP, achievements.
   Nice-to-have
   Categories / notes on vocabulary: Add a field (schema + UI) so users can tag words, e.g.:

- By domain: “basic”, “technical”, “travel”, “business”.
- By part of speech or type: “noun”, “verb”, “adjective”, “useful phrase”, “idiom”.
  Enables filtering in Library and Study (e.g. “practise only verbs” or “technical terms only”). Schema migration + UI for add/edit + filter in list/study.
  Google OAuth (if you want social login).
  3c) Future improvements (planned)
  Phase 4 – Speech
- Pronunciation practice: record user vs model (TTS), compare or give feedback.
- Optional speech recognition for speaking exercises (e.g. “say the word”).
- Builds on TTS (listening) from Phase 3.
  Phase 5 – Gamification
- Streaks (days in a row with at least one review), XP per review, levels, badges.
- Optional leaderboards (e.g. family or friends).
- Progress page becomes the hub for stats and achievements.
  Phase 6 – AI (optional, API cost–aware)
- Mnemonics or memory tips for words.
- Example sentences (e.g. “word in context”).
- Pronunciation tips or feedback.
  Phase 7 – Production & polish
- CI/CD: GitHub Actions (lint, test, build); deploy to Vercel/Netlify (or similar) with env-based config.
- Monitoring and error reporting (e.g. Sentry).
- Optional i18n for app UI (translate the app itself into learner’s language).
- Full E2E suite, Lighthouse audit, performance budget.

4. Other suggestions
   Product & scope (all desired)

- Mobile: Quick pass on touch targets, font sizes, and key flows on a real device to validate “mobile-friendly.”
- Onboarding: First-time user flow (e.g. “Add a language pair → Add first word → Do one study session”) to increase activation.
- Progress page: Minimal version (e.g. “X cards due today”, “Y reviewed this week”) so the app feels complete and gives a natural next step after Study.
  Process & maintainability
- HANDOFF + AI instructions: Keep §4 (session summary) and §6 (priority) updated for handoffs and AI-assisted work.
- Changelog / releases: `docs/CHANGELOG.md` is the canonical place for release history. A script and an optional GitHub Action can update it from commits: see **`docs/CHANGELOG_AUTOMATION.md`**. Run `npm run changelog` to print entries for the current branch (vs main); `npm run changelog:append` to append into CHANGELOG. The Action (`.github/workflows/update-changelog.yml`) appends merged commits to `[Unreleased]` on every push to main. Migrate content from HANDOFF into CHANGELOG so HANDOFF stays focused on current state and next steps (see §5). AI agent instructions reference CHANGELOG.
- Branch/PR policy: You already use feat/lang-NNN-…; optionally add “main is always deployable” and “PR required for main” so history stays clean.
  Risk reduction
- Backup / export: Document that CSV/JSON export is the user’s backup; optionally add “Export all my data” (library + progress) for peace of mind.
- Supabase limits: Research free-tier limits (auth users, DB size, bandwidth, API rate limits). Document them and what to do when approaching limits (upgrade or trim usage). Verify current usage and apply edits if needed.

5. Suggested order of work (updated)
1. Changelog & docs (next nearest step)
   - Add CHANGELOG.md; migrate session summaries / “what shipped” from HANDOFF into it.
   - Slim HANDOFF to current state + next steps only.
   - Update AI agent instructions to use CHANGELOG for release history and to update it when summarizing work.
1. Stabilise & close Phase 3
   - E2E for study session; default/study language; validation + “I’ve run the migration” (small, high impact).
   - TTS (listening), reverse multiple choice (translation → word).
1. Performance (code-splitting & optimization)
   - Lazy routes (React.lazy + Suspense) for Study, Library, Dictionary, Settings.
   - Lazy imports where useful; Lighthouse + Core Web Vitals baseline and document.
1. Resilience
   - Error Boundary + optional error reporting (e.g. Sentry).
1. Categories / notes on vocabulary
   - Schema migration + UI: field(s) for e.g. “basic”/“technical”, “noun”/“verb”/“useful phrase”; filters in Library and Study.
1. Progress (minimal)
   - Due today + “reviewed this week” + optional simple streak on Progress page.
1. Product & scope
   - Mobile pass; onboarding flow; “Export all my data” and backup docs; Supabase limits research + doc + verify/edits.
1. Production path
   - CI (lint, test, build), deploy to a host, env-based config.
1. Then
   - Phase 4 (speech), Phase 5 (gamification), Phase 6 (AI), Phase 7 (full production polish) as planned in §3c.

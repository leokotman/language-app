# Instructions for AI Agent: Jira Tickets and Confluence Documentation

**Purpose:** This document instructs an AI agent to create (1) a Confluence page with the language-app project history, and (2) multiple Jira tickets (retrospective “Done” and future “To Do”) from the project’s git history, handoff summary, and roadmap.

**Sources used:** `docs/AI agent instructions.md`, Confluence page “Language Learning App – Project History”, `docs/ai-chat-code-2026-02-05T16-38-08-153Z-updated-roadmap.txt`, `docs/ai-chat-code-2026-02-05T16-45-46-372Z-project-overview-for-ai.txt`, `docs/ai-chat-code-2026-02-05T16-39-52-440Z-project-structure(updated)).txt`, and the repository’s git history.

---

## Task 1: Create a Confluence Page with Project History

**Objective:** Create one Confluence page that documents the project’s history, structured by **week**, with headers and numbered points. Use the outline below as the page structure. The agent should create the page via the Confluence REST API and set the page body in **storage** format (Atlassian Document Format, ADF). If the API requires another format, use the [Content body convert API](https://developer.atlassian.com/cloud/confluence/rest/v1/api-group-content-body/#api-wiki-rest-api-contentbody-convert-to-post) to convert from `storage` (ADF) to the required representation.

### Confluence page outline (by week)

**Title (suggested):** Language Learning App — Project History

**Page structure:**

---

### Week 1 — Project setup (Feb 5, 2026)

1. Initialized Vite + React + TypeScript project.
2. Configured MUI theme with light/dark mode.
3. Set up project structure (src/, components/, lib/, pages/, etc.).
4. Configured PWA plugin (vite-plugin-pwa).
5. Set up Supabase client and environment variables.
6. Set up Vitest for unit testing.
7. Created basic layout (AppBar, navigation, routes).

**Constraints:** Free-tier services only; React + TypeScript + MUI (no Tailwind).

---

### Week 2 — Authentication (Feb 5, 2026)

1. Implemented Supabase Auth: email/password signup, login, forgot password.
2. Auth state management with Zustand store and useAuth hook.
3. Protected routes and Navbar auth UI.
4. User profile creation (migration 001, auto-create on signup).
5. Unit tests for errors and auth store.
6. Fix: login on first attempt; docs for customizing signup email.

**Constraints:** No Google OAuth in initial scope; profiles table in Supabase.

---

### Week 3 — Core data layer (Feb 6, 2026)

1. Database schema: migration 002 — tables `languages`, `user_languages`, `vocabulary`, `user_vocabulary` with RLS.
2. Typed Supabase client: `src/types/database.ts` (Database, Row/Insert/Update, Relationships).
3. API and hooks: `api/languages.ts`, `api/userLanguages.ts`, `api/vocabulary.ts`; TanStack Query hooks.
4. Settings: language pair selection (EN↔RU, EN↔SR Latin only; Croatian dropped).
5. Single-step addWordToLibrary (create vocabulary + user_vocabulary).
6. QueryClientProvider in main.tsx.
7. Handle 404 when migration 002 not run: `isSupabaseTableMissingError`, show setup instructions (run 002 in Supabase SQL Editor).

**Constraints:** Serbian Latin only; no categories/notes on vocabulary yet.

---

### Week 4 — Personal library (Feb 6, 2026)

1. Library page: list from useUserVocabularyList, search by word/translation, filter by language pair.
2. Add word: form (word, translation, language pair) and useAddWordToLibrary.
3. Edit word: dialog with word/translation; useUpdateVocabulary.
4. Delete word: ConfirmDialog then useDeleteVocabulary (vocabulary row delete; user_vocabulary cascades).
5. Reusable ConfirmDialog component.
6. Dynamic placeholders per language pair (LANGUAGE_PLACEHOLDERS).
7. Library filter fixed: filter value aligned with language_from/language_to.
8. Settings: confirmation dialog before removing a language pair.
9. Layout: sticky navbar, full-height layout (minHeight: 100vh, main flex: 1, overflow: auto).
10. Bidirectional pairs: one row per pair (e.g. Russian ↔ English), add/remove both directions; Library filter and add form with Pair + Direction.
11. Virtual pair: when user has EN–RU and EN–SR, show “Russian ↔ Serbian (via English)” in Settings and Library; allow adding words for RU↔SR via English.

**Constraints:** No notes/category in schema; single “active” pair selection in add form.

---

### Week 5 — App library, seed, dictionary, import/export (Feb 6–9, 2026)

1. Seed and lookup strategy docs: SEED_AND_LOOKUP_STRATEGY.md, DICTIONARY_PLAN.md.
2. Seed data: migration 003 — 82 triples (aligned EN-RU-SR); migration 005 — 150 additional triples; optional 008 — 128 triples (phase 3).
3. App Library: browse app library and add to my library.
4. Dictionary: MyMemory en↔ru, en↔sr lookup; dictionary route and shell; results UI with “Add to library”; pick best match to avoid echo; list all translations (dedupe, sort by quality, cap 50).
5. Merge Dictionary and App Library into one tab; user-friendly copy in Library and Settings; virtual pair filter shows only direct Russian↔Serbian where applicable.
6. Library import/export: CSV and JSON.
7. Supabase: RLS on languages, set_updated_at search_path, docs; leaked password protection noted as Pro plan only.
8. Code quality: refactor per Cursor rules; branch naming and commit style (lang-001, lang-002, …).

**Constraints:** Dictionary offline when “Offline” toggle ON; app library from cache when offline after sync.

---

### Week 6 — Input sanitization, offline, errors, E2E (Feb 6–11, 2026)

1. Input sanitization (OWASP): trim, max length, strip control chars; applied to auth and Library; docs and unit tests.
2. Offline mode toggle: offlineModeStore, Navbar switch; meaningful error handling (logError, catch blocks).
3. Offline PWA (lang-005): IndexedDB cache for app vocabulary and user data; API read from cache when offline; full offline sync; OfflinePrefetch on login; Navbar “Offline” toggle with sync on turn ON and snackbar; vocabulary/user-languages with networkMode always; Dictionary uses app vocabulary from cache; offline debug logging and docs (OFFLINE_DEBUGGING.md, OFFLINE_SUMMARY_AND_DEBUG.md).
4. Fix: useCallback deps in Navbar for React Compiler; show offline message on login/signup/forgot-password.
5. Dictionary offline (lang-006): persist lookups in IndexedDB; use lookup cache when offline; debounce and perf fixes; migration 001 idempotent (DROP POLICY/TRIGGER IF EXISTS).
6. Performance (lang-007): query and table updates to resolve Supabase performance issues.
7. E2E (lang-009): Playwright — home.spec.ts, library.spec.ts; unauthenticated redirect to login; authenticated flow (add/edit/delete) when E2E_TEST_EMAIL/E2E_TEST_PASSWORD set; data-testid for loading/error/empty in Library and Dictionary; .env.example and README for E2E.

**Constraints:** PWA build with workbox mode development and minify false to avoid terser issue; no FSRS study flow yet.

---

### Current state (as of handoff)

- Auth: Login, signup, forgot password, protected routes, profiles (migration 001).
- Settings: Language pairs (add/remove with confirmation); requires migration 002.
- Library: List, search, filter, add/edit/delete with confirm; requires 002.
- Dictionary: One tab — lookup (MyMemory en↔ru, en↔sr), browse app library, add to my library; offline from cache when synced.
- Offline: Navbar toggle; IndexedDB cache; OfflinePrefetch; sync on “Offline” ON.
- Migrations: Run 001 → 002 → 003 → (optional 005, 008) → 004 → 006 → 007 (see SUPABASE_SETUP.md).
- E2E: Playwright; run `npx playwright install` then `npm run test:e2e`.

---

### Project structure (reference)

- `src/components/common/` — ConfirmDialog, etc.
- `src/components/features/` — auth (ProtectedRoute), offline (OfflinePrefetch).
- `src/components/layout/` — Layout, Navbar.
- `src/pages/` — HomePage, LibraryPage, DictionaryPage, SettingsPage, LoginPage, SignupPage, ForgotPasswordPage, ProgressPage, StudyPage (shell).
- `src/api/` — languages, userLanguages, vocabulary, profiles.
- `src/hooks/` — useAuth, useLanguages, useUserLanguages, useVocabulary.
- `src/lib/` — supabase, errors, sanitize, dictionary, offlineCache, offlineSync, offlineDebug, importExport.
- `src/stores/` — authStore, offlineModeStore.
- `docs/supabase-migrations/` — 001–008.
- `e2e/` — home.spec.ts, library.spec.ts, helpers/auth.ts.

---

## Task 2: Create Jira Tickets

**Objective:** Create Jira issues from the **tasks history** below. Each issue should have:

- **Title**
- **Description** (rich text)
- **Acceptance criteria**
- **Expected results**
- **Test cases**

**Status:**  
- **Retrospective tickets:** Mark as **Done** (already implemented).  
- **Future tickets:** Mark as **To Do** (from roadmap and handoff “Suggestions for next steps”).

**Format for API:** When creating issues via Jira REST API, send the description (and any rich-text fields) in **Atlassian Document Format (ADF)**. ADF is a JSON structure: `{ "version": 1, "type": "doc", "content": [ ... ] }`. Use block nodes such as `paragraph`, `heading`, `bulletList`, `listItem`, `orderedList` and inline nodes such as `text` with optional `marks` (e.g. `strong`, `em`). Reference: [Atlassian Document Format structure](https://developer.atlassian.com/cloud/jira/platform/apis/document/structure). If the Confluence API expects a different body representation, use the [Content body convert API](https://developer.atlassian.com/cloud/confluence/rest/v1/api-group-content-body/#api-wiki-rest-api-contentbody-convert-to-post) (e.g. from `storage` to `view` or `editor`).

---

### Part 2a: Tasks history (enumerated with dates)

Use this list to create **retrospective (Done)** Jira tickets. Each row is one logical task; date is the commit or merge date from git/handoff.

| # | Date       | Title / scope |
|---|------------|----------------|
| 1 | 2026-02-05 | Initial project setup: Vite, React, TypeScript, MUI, PWA, routes, tests |
| 2 | 2026-02-05 | Light/dark theme, Supabase client, setup docs |
| 3 | 2026-02-05 | Auth store (Zustand) and useAuth hook |
| 4 | 2026-02-05 | Login, Signup, Forgot password pages and forms |
| 5 | 2026-02-05 | Protected routes and Navbar auth UI |
| 6 | 2026-02-05 | Profiles table and auto-create on signup (migration 001) |
| 7 | 2026-02-05 | Unit tests for errors and auth store |
| 8 | 2026-02-05 | Fix login on first attempt; docs for signup email |
| 9 | 2026-02-06 | Core data layer: DB schema (migration 002), typed Supabase, vocabulary CRUD, language selection |
| 10 | 2026-02-06 | Languages: drop Croatian, keep only Serbian (Latin) |
| 11 | 2026-02-06 | Library: personal word list with search and language filter |
| 12 | 2026-02-06 | Library: add-word form and add-to-library flow |
| 13 | 2026-02-06 | Add reusable ConfirmDialog component |
| 14 | 2026-02-06 | Library: edit and delete word with confirm |
| 15 | 2026-02-06 | Handle 404 when core migration not run — show setup instructions |
| 16 | 2026-02-06 | Library: add-word form dynamic placeholders per language pair |
| 17 | 2026-02-06 | Library: fix language pair filter (language_from/language_to) |
| 18 | 2026-02-06 | Settings: confirmation dialog for language pair removal |
| 19 | 2026-02-06 | Layout: sticky navbar and full-height main content |
| 20 | 2026-02-06 | Bidirectional pairs: types, API, hooks, Settings one row per pair, Library filter and add form |
| 21 | 2026-02-06 | Virtual pair Russian ↔ Serbian (via English): Settings display, Library filter and add |
| 22 | 2026-02-06 | Input sanitization (OWASP): trim, max length, strip control chars; auth and Library |
| 23 | 2026-02-06 | Offline mode toggle and dictionary plan (DICTIONARY_PLAN.md) |
| 24 | 2026-02-06 | Meaningful error handling: logError, catch blocks |
| 25 | 2026-02-06 | Dictionary route and shell page |
| 26 | 2026-02-06 | Dictionary: MyMemory en-ru lookup service |
| 27 | 2026-02-06 | Dictionary: results UI with Add to library |
| 28 | 2026-02-06 | Dictionary: pick best match to avoid echo (ru→en names/same word) |
| 29 | 2026-02-06 | Dictionary: list all translations (dedupe, sort by quality, cap 50) |
| 30 | 2026-02-09 | Seed and lookup strategy docs (SEED_AND_LOOKUP_STRATEGY.md) |
| 31 | 2026-02-09 | Seed data: migration 003 (82 triples, EN-RU-SR) |
| 32 | 2026-02-09 | App Library page: browse and add to my library |
| 33 | 2026-02-09 | Library import/export CSV and JSON |
| 34 | 2026-02-09 | Supabase linter/security: RLS on languages, set_updated_at search_path |
| 35 | 2026-02-09 | Merge Dictionary and App Library into one tab; user-friendly copy |
| 36 | 2026-02-09 | Dictionary: Serbian support and lookup for all directions |
| 37 | 2026-02-09 | Fix: virtual pair filter shows only direct Russian↔Serbian |
| 38 | 2026-02-09 | Code quality refactor and branch naming instructions |
| 39 | 2026-02-10 | PWA build fix: workbox mode development, minify false |
| 40 | 2026-02-10 | Expand seed: migration 005 and seed-triples-additional |
| 41 | 2026-02-10 | Offline message on login, signup, forgot-password |
| 42 | 2026-02-10 | Offline debug logging (localStorage flag, [offline] prefix) |
| 43 | 2026-02-10 | IndexedDB offline cache for app vocabulary and user data |
| 44 | 2026-02-10 | API read from cache when offline (vocabulary, user languages) |
| 45 | 2026-02-10 | Full offline sync (app vocabulary, user languages, user library) |
| 46 | 2026-02-10 | Vocabulary and user-languages queries when offline (networkMode always) |
| 47 | 2026-02-10 | OfflinePrefetch on login and mount in Layout |
| 48 | 2026-02-10 | Navbar Offline toggle with sync on turn ON and snackbar |
| 49 | 2026-02-10 | Dictionary use app vocabulary from cache and offline debug logs |
| 50 | 2026-02-10 | Docs: offline debugging and summary (OFFLINE_DEBUGGING.md, OFFLINE_SUMMARY_AND_DEBUG.md) |
| 51 | 2026-02-10 | Fix useCallback deps in Navbar for React Compiler |
| 52 | 2026-02-10 | Migration 001 idempotent (DROP POLICY/TRIGGER IF EXISTS) |
| 53 | 2026-02-10 | Persist dictionary lookups in IndexedDB for offline |
| 54 | 2026-02-10 | Dictionary use lookup cache when offline; debounce and perf fixes |
| 55 | 2026-02-11 | Performance: update queries and tables (lang-007) |
| 56 | 2026-02-11 | Phase 3 seed: migration 008 (128 triples) |
| 57 | 2026-02-11 | E2E tests for Library: unauthenticated redirect, authenticated add/edit/delete |
| 58 | 2026-02-11 | data-testid for loading, error, empty in Library and Dictionary |
| 59 | 2026-02-11 | E2E auth helper and env (E2E_TEST_EMAIL, E2E_TEST_PASSWORD); docs |

---

### Part 2b: Future tasks (To Do)

Create Jira tickets for these with status **To Do**. Source: roadmap (Phase 3+) and handoff “Suggestions for next steps”.

| # | Title / scope |
|---|----------------|
| F1 | Phase 3: Implement FSRS algorithm and unit tests (100% coverage) |
| F2 | Phase 3: “Due today” query and study session flow (start, show card, reveal, rate, update SRS) |
| F3 | Phase 3: Store session history and wire FSRS to user_vocabulary |
| F4 | Phase 3: Flashcard and reverse flashcard exercise types |
| F5 | Phase 3: Typing exercise (type the translation) |
| F6 | Phase 3: Multiple choice and listening (TTS) exercises |
| F7 | Phase 3: Adaptive exercise selection and session settings (exercise types, card count) |
| F8 | Phase 3: E2E test for complete study session |
| F9 | Default language pair: preselect when user has one pair; “study language” in Settings or Study page |
| F10 | Validation: trim and max length on word/translation in add/edit (align with sanitize) |
| F11 | “I’ve run the migration” button to refetch after showing migration instructions |
| F12 | Categories or notes on vocabulary (schema migration + UI) |
| F13 | Phase 4+: Speech integration and pronunciation practice (Web Speech API, TTS, scoring) |
| F14 | Phase 5+: Progress dashboard, stats, streaks, XP, achievements |
| F15 | Phase 6+: AI features (mnemonics, pronunciation tips via Vercel Edge + Gemini) |
| F16 | Phase 7: Full E2E suite, performance, Lighthouse, deploy to production |

---

### Part 2c: Template for each Jira ticket

For **each** task (retrospective or future), the agent should create one Jira issue with:

- **Title:** Short, clear (e.g. “Library: add-word form and add-to-library flow” or “Phase 3: Implement FSRS algorithm”).
- **Description (ADF):** One ADF document containing:
  - Brief context (1–2 sentences).
  - What was done or what is to be done.
  - References (e.g. migration number, file path, doc) if relevant.
- **Acceptance criteria (ADF):** Bullet list of criteria (e.g. “User can add a word from the Library form”, “Word appears in the list after add”).
- **Expected results (ADF):** Bullet list of outcomes (e.g. “Vocabulary and user_vocabulary rows created”, “List refreshes without full page reload”).
- **Test cases (ADF):** Numbered or bullet list of test cases (e.g. “Add word with EN→RU pair”, “Edit word and verify translation updated”, “Delete word and confirm it is removed from list”).

The agent should **serialize these sections into a single ADF JSON** for the Jira description field (or split into custom fields if the project uses separate AC/expected results/test case fields). Example ADF structure for one ticket is given in **Part 2d**.

---

### Part 2d: Example ADF for one Jira ticket (description body)

Use this as a template. Replace placeholder text with the actual task content. This is the **storage** representation for the issue description; Jira Cloud accepts ADF for rich-text fields.

```json
{
  "version": 1,
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Description" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Brief context and what was done or to be done. Reference migrations or docs if needed." }]
    },
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Acceptance criteria" }]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [{
            "type": "paragraph",
            "content": [{ "type": "text", "text": "Criterion 1." }]
          }]
        },
        {
          "type": "listItem",
          "content": [{
            "type": "paragraph",
            "content": [{ "type": "text", "text": "Criterion 2." }]
          }]
        }
      ]
    },
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Expected results" }]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [{
            "type": "paragraph",
            "content": [{ "type": "text", "text": "Result 1." }]
          }]
        }
      ]
    },
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Test cases" }]
    },
    {
      "type": "orderedList",
      "attrs": { "order": 1 },
      "content": [
        {
          "type": "listItem",
          "content": [{
            "type": "paragraph",
            "content": [{ "type": "text", "text": "Test case 1." }]
          }]
        },
        {
          "type": "listItem",
          "content": [{
            "type": "paragraph",
            "content": [{ "type": "text", "text": "Test case 2." }]
          }]
        }
      ]
    }
  ]
}
```

**ADF node reference (short):**

- Root: `doc` with `version: 1` and `content: []`.
- Block nodes: `paragraph`, `heading` (attrs: `level` 1–6), `bulletList`, `orderedList` (attrs: `order`), `listItem`, `codeBlock`, `panel`, `blockquote`.
- Inline: `text` (with optional `marks`: `strong`, `em`, `code`, `link` with `attrs.href`).

For **Confluence** body conversion: if the create/update API expects a format other than `storage`, call:

`POST /wiki/rest/api/contentbody/convert/async/{to}` with body `{ "value": "<ADF JSON string>", "representation": "storage" }` and then poll for the result, or use the bulk convert endpoint as per the [Confluence Content body API](https://developer.atlassian.com/cloud/confluence/rest/v1/api-group-content-body/#api-wiki-rest-api-contentbody-convert-to-post).

---

### Part 2e: Example ADF bodies for two Jira tickets (ready for API)

**Example 1 — Retrospective (Task #12: Library add-word form and add-to-library flow, 2026-02-06)**

```json
{
  "version": 1,
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Description" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Library add-word form with word, translation, and language pair. useAddWordToLibrary creates vocabulary row then user_vocabulary row. Implemented 2026-02-06." }]
    },
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Acceptance criteria" }]
    },
    {
      "type": "bulletList",
      "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "User can open add-word form from Library." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "User selects language pair and direction, enters word and translation." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "On submit, vocabulary and user_vocabulary rows are created." }] }] }
      ]
    },
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Expected results" }]
    },
    {
      "type": "bulletList",
      "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "New word appears in Library list without full reload." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Form resets or closes after successful add." }] }] }
      ]
    },
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Test cases" }]
    },
    {
      "type": "orderedList",
      "attrs": { "order": 1 },
      "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Add word EN→RU and verify it appears in list." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Add word with invalid or empty translation; expect validation/error." }] }] }
      ]
    }
  ]
}
```

**Example 2 — Future (Task F1: Phase 3 — Implement FSRS algorithm)**

```json
{
  "version": 1,
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Description" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Implement FSRS (Free Spaced Repetition Scheduler) using ts-fsrs package. Wire algorithm to user_vocabulary FSRS fields (state, due, stability, difficulty, etc.). Required for study session and \"due today\" flow. Roadmap: Phase 3 Weeks 7–8." }]
    },
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Acceptance criteria" }]
    },
    {
      "type": "bulletList",
      "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "ts-fsrs integrated; 100% unit test coverage for FSRS logic." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Review rating (Again/Hard/Good/Easy) updates user_vocabulary and next due date." }] }] }
      ]
    },
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Expected results" }]
    },
    {
      "type": "bulletList",
      "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "\"Due today\" query returns correct cards." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Session complete updates SRS data in DB." }] }] }
      ]
    },
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Test cases" }]
    },
    {
      "type": "orderedList",
      "attrs": { "order": 1 },
      "content": [
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Unit tests for FSRS scheduling for each rating." }] }] },
        { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "E2E: complete one study session and verify user_vocabulary updated." }] }] }
      ]
    }
  ]
}
```

Generate ADF for all other tasks in Part 2a and 2b using the same structure (Description heading + paragraph, Acceptance criteria heading + bulletList, Expected results heading + bulletList, Test cases heading + orderedList).

Example PAYLOAD for Jira ticket creation:
{'method': 'POST', 'relative_url': '/rest/api/3/issue', 'params': {'fields': {'project': {'key': 'KAN'}, 'summary': 'Protected routes and Navbar auth UI', 'description': {'version': 1, 'type': 'doc', 'content': [{'type': 'heading', 'attrs': {'level': 3}, 'content': [{'type': 'text', 'text': 'Description'}]}, {'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Implemented protected routing logic and authentication-aware Navbar UI. Ensured routing is only accessible to authenticated users by conditionally rendering navigation links based on the user state. Features include logout and reactive state updates in the nav UI.'}]}, {'type': 'heading', 'attrs': {'level': 3}, 'content': [{'type': 'text', 'text': 'Acceptance criteria'}]}, {'type': 'bulletList', 'content': [{'type': 'listItem', 'content': [{'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Links in Navbar reflect authentication state (e.g., login/logout where relevant).'}]}]}, {'type': 'listItem', 'content': [{'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Routes such as Profile or Library are protected and redirect unauthorized users to login.'}]}]}]}, {'type': 'heading', 'attrs': {'level': 3}, 'content': [{'type': 'text', 'text': 'Expected results'}]}, {'type': 'bulletList', 'content': [{'type': 'listItem', 'content': [{'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Users cannot access restricted routes like Profile or Library without authentication.'}]}]}, {'type': 'listItem', 'content': [{'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Navbar dynamically reflects user authentication state.'}]}]}]}, {'type': 'heading', 'attrs': {'level': 3}, 'content': [{'type': 'text', 'text': 'Test cases'}]}, {'type': 'orderedList', 'attrs': {'order': 1}, 'content': [{'type': 'listItem', 'content': [{'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Attempt unauthorized access to a protected route as a logged-out user, verify redirection to login.'}]}]}, {'type': 'listItem', 'content': [{'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Log in and verify Navbar updates to reflect the correct user state and that authorized routes work.'}]}]}, {'type': 'listItem', 'content': [{'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Log out and verify the routes are locked again.'}]}]}]}]}, 'issuetype': {'name': 'Task'}}}}
Result:

HTTP: POST /rest/api/3/issue -> 201 Created {"id":"10046","key":"KAN-31","self":"https://epam-team-oc64db17.atlassian.net/rest/api/3/issue/10046"} 

---

## Summary for the AI agent

1. **Confluence:** Create one page “Language Learning App — Project History” using the **Task 1** outline. Use ADF for the body in `storage` format; convert via Confluence API if the endpoint requires another representation.
2. **Jira:** Create one issue per row in **Part 2a** (retrospective) with status **Done** and one per row in **Part 2b** (future) with status **To Do**. Each issue must have Title, Description, Acceptance criteria, Expected results, and Test cases. Use the **Part 2c** template and **Part 2d** ADF structure; send rich-text fields as ADF JSON to the Jira REST API.
3. **References:** [ADF structure](https://developer.atlassian.com/cloud/jira/platform/apis/document/structure), [Confluence content body convert API](https://developer.atlassian.com/cloud/confluence/rest/v1/api-group-content-body/#api-wiki-rest-api-contentbody-convert-to-post).

---

*Document generated from language-app handoff, roadmap, project overview, and git history. Last sync: 2026-02-11.*

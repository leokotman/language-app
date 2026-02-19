# Unit test coverage

## Running coverage

```bash
npm run coverage
```

- Runs all unit tests (Vitest) with the **v8** coverage provider.
- **Terminal:** full coverage table (with colors) plus a **summary** with each metric: percentage and `(covered/total)` per category (Statements, Branches, Functions, Lines).
- **Artifacts:** `coverage/` (HTML report, `coverage/coverage-final.json`). The `coverage/` directory is gitignored.

Configuration: `vite.config.ts` → `test.coverage` (include, exclude, **target %**, reporter, **thresholds**).

- **Target percentage:** `COVERAGE_TARGET_PCT = 70` in `vite.config.ts`. The coverage run prints a **Target** block after the summary: each metric shows current `pct% (covered/total) out of 70%` and, if below target, `— need N more` (how many more covered items to reach 70%).
- **Enforcing the target:** `coverage.thresholds` in `vite.config.ts` are **enabled** (statements, branches, functions, lines set to `COVERAGE_TARGET_PCT`). `npm run coverage` fails when any metric is below 70% (e.g. in CI). See `vite.config.ts` to temporarily comment thresholds while working on new code.

---

## Current coverage (snapshot)

| Metric     | Current | Target |
| ---------- | ------- | ------ |
| Statements | ~84%    | 70% ✓  |
| Branches   | ~70.2%  | 70% ✓  |
| Functions  | ~80.6%  | 70% ✓  |
| Lines      | ~85.9%  | 70% ✓  |

**Well-covered areas:** `App.tsx`, `lib/` (fsrs, sanitize, errors, importExport, offlineSync, dictionary, offlineCache, etc.), `hooks/` (useAuth, useUserLanguages, useVocabulary, useAudioRecorder, etc.), `stores/`, API (`languages`, `profiles`, `userLanguages`, `vocabulary`), `ConfirmDialog`, `Layout`, `ProtectedRoute`, `LibraryPage.helpers`, `StudyPage.helpers`, Study page components (FlashcardBlock, TypingBlock, RatingButtons, MultipleChoiceBlock, ListeningBlock, SpeakingBlock, StudySetup, NoCardsDue, etc.), **LibraryPage components** (AddWordForm, EditWordDialog, ImportExportBar, LibraryFilterBar, LibraryList), **DictionaryPage** / **LibraryPage** / **StudyPage** smoke tests, ForgotPasswordPage, LoginPage, SettingsPage. **Remaining gaps (lower priority):** DictionaryPage/LibraryPage/StudyPage main files (deeper branches), `lib/offlineDebug`, some branches in Navbar/SettingsPage/SignupPage.

Re-run `npm run coverage` and open `coverage/index.html` for an up-to-date per-file breakdown.

---

## Recommended coverage for this project

For a **solo-developer** app of this size (PWA, React, Supabase):

- **Target: 70–80%** on statements/lines is a practical goal. It balances confidence when refactoring with limited time; 100% is usually not worth the cost and can encourage tests written for the metric rather than for real failures.
- **Prioritise:** Business logic (`lib/fsrs`, `lib/sanitize`, `lib/errors`, `lib/importExport`), stores, and critical hooks. Add tests for new helpers and API wrappers as you touch them.
- **Lower priority for unit tests:** Heavy UI and integration (e.g. full page flows) — cover those with E2E (Playwright) where it makes sense.

Update this table and the “Current coverage” snapshot after significant test additions (e.g. when closing a chore to improve coverage).

# Unit test coverage

## Running coverage

```bash
npm run coverage
```

- Runs all unit tests (Vitest) with the **v8** coverage provider.
- **Terminal:** full coverage table (with colors) plus a **summary** with each metric: percentage and `(covered/total)` per category (Statements, Branches, Functions, Lines).
- **Artifacts:** `coverage/` (HTML report, `coverage/coverage-final.json`). The `coverage/` directory is gitignored.

Configuration: `vite.config.ts` → `test.coverage` (include, exclude, **target %** and reporter).

- **Target percentage:** `COVERAGE_TARGET_PCT = 70` in `vite.config.ts`. The coverage run prints a **Target** block after the summary: each metric shows current `pct% (covered/total) out of 70%` and, if below target, `— need N more` (how many more covered items to reach 70%).
- **Enforcing the target:** Uncomment `coverage.thresholds` in `vite.config.ts` (statements, branches, functions, lines set to `COVERAGE_TARGET_PCT`) to make `npm run coverage` fail when coverage is below target (e.g. in CI). Default is commented so the run passes while you work toward the goal.

---

## Current coverage (snapshot)

| Metric     | Current | Target (see below) |
|-----------|---------|---------------------|
| Statements| ~24.4%  | 70–80%              |
| Branches  | ~18.3%  | 70–80%              |
| Functions | ~19.9%  | 70–80%              |
| Lines     | ~24.2%  | 70–80%              |

**Well-covered areas:** `lib/fsrs.ts`, `lib/sanitize.ts`, `lib/errors.ts`, `lib/importExport.ts` (high); `LibraryPage.helpers`, `StudyPage.helpers` (partial); `ConfirmDialog`, `stores/authStore`, `theme`, `Layout`, `ProtectedRoute`, `OfflinePrefetch` (partial). **Gaps:** API layer, hooks, most page components and Study subcomponents.

Re-run `npm run coverage` and open `coverage/index.html` for an up-to-date per-file breakdown.

---

## Recommended coverage for this project

For a **solo-developer** app of this size (PWA, React, Supabase):

- **Target: 70–80%** on statements/lines is a practical goal. It balances confidence when refactoring with limited time; 100% is usually not worth the cost and can encourage tests written for the metric rather than for real failures.
- **Prioritise:** Business logic (`lib/fsrs`, `lib/sanitize`, `lib/errors`, `lib/importExport`), stores, and critical hooks. Add tests for new helpers and API wrappers as you touch them.
- **Lower priority for unit tests:** Heavy UI and integration (e.g. full page flows) — cover those with E2E (Playwright) where it makes sense.

Update this table and the “Current coverage” snapshot after significant test additions (e.g. when closing a chore to improve coverage).

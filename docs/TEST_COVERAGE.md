# Unit test coverage

## Running coverage

```bash
npm run coverage
```

- Runs all unit tests (Vitest) with the **v8** coverage provider.
- **Terminal:** summary table and text-summary.
- **Artifacts:** `coverage/` (HTML report, `coverage/coverage-final.json`). The `coverage/` directory is gitignored.

Configuration: `vite.config.ts` → `test.coverage` (include `src/**/*.{ts,tsx}`, exclude tests, `main.tsx`, types).

---

## Current coverage (snapshot)

| Metric     | Current | Target (see below) |
|-----------|---------|---------------------|
| Statements| 11.6%   | 70–80%              |
| Branches  | 7.96%   | 70–80%              |
| Functions | 9.77%   | 70–80%              |
| Lines     | 11.74%  | 70–80%              |

**Well-covered areas:** `lib/fsrs.ts`, `lib/sanitize.ts`, `lib/errors.ts` (high); `stores/authStore`, `theme`, `Layout`, `ProtectedRoute`, `OfflinePrefetch` (partial). **Gaps:** API layer, hooks, most pages and Study subcomponents.

Re-run `npm run coverage` and open `coverage/index.html` for an up-to-date per-file breakdown.

---

## Recommended coverage for this project

For a **solo-developer** app of this size (PWA, React, Supabase):

- **Target: 70–80%** on statements/lines is a practical goal. It balances confidence when refactoring with limited time; 100% is usually not worth the cost and can encourage tests written for the metric rather than for real failures.
- **Prioritise:** Business logic (`lib/fsrs`, `lib/sanitize`, `lib/errors`, `lib/importExport`), stores, and critical hooks. Add tests for new helpers and API wrappers as you touch them.
- **Lower priority for unit tests:** Heavy UI and integration (e.g. full page flows) — cover those with E2E (Playwright) where it makes sense.

Update this table and the “Current coverage” snapshot after significant test additions (e.g. when closing a chore to improve coverage).

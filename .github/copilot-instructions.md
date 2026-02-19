# Copilot instructions — language learning app

**For GitHub Copilot.** Cursor users: use `docs/AI agent instructions.md` and `.cursor/` (rules, commands). Onboarding for any agent: reduce PR rejections, minimize failed commands, cut exploration. Max ~2 pages; not task-specific.

**Trust these instructions.** Search the repo only when this is incomplete or wrong.

---

## High-level details

- **What it is:** Language learning PWA — vocabulary, dictionary lookup, personal library, offline cache, (future) spaced repetition. Users learn and practice languages (e.g. EN↔RU, EN↔SR).
- **Stack:** React 19, TypeScript 5.9, Vite 7, MUI 7, React Router 7, Supabase, TanStack Query, Zustand, vite-plugin-pwa. Tests: Vitest (unit), Playwright (E2E). Lint: ESLint 9 (flat config).
- **Size/type:** Single frontend app; `src/` holds pages, components, api, hooks, lib, stores, theme, types. No backend in repo; Supabase is BaaS. Config at root: `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `eslint.config.js`, `playwright.config.ts`.

---

## Build and validation (run in this order)

**Precondition:** Always run `npm install` before building.

| Step       | Command            | Notes                                                                                                                                                                                                                                    |
| ---------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bootstrap  | `npm install`      | Required once per clone / after dependency changes.                                                                                                                                                                                      |
| Build      | `npm run build`    | Runs `tsc -b` then `vite build`. **Must pass** before PR. Produces `dist/` and PWA assets (`dist/sw.js`, workbox). Build time ~5–10 s.                                                                                                   |
| Dev        | `npm run dev`      | Vite dev server (e.g. http://localhost:5173). No build step needed if deps are installed.                                                                                                                                                |
| Lint       | `npm run lint`     | ESLint. **Fix all lint errors in files you change.** Config: `eslint.config.js`.                                                                                                                                                         |
| Unit tests | `npm run test:run` | Vitest. Config in `vite.config.ts` (test section). Setup: `src/__tests__/setup.ts`. Tests under `src/**/*.{test,spec}.{ts,tsx}`. Some tests need providers (QueryClient, Router) or localStorage mocks — fix failures in code you touch. |
| E2E        | `npm run test:e2e` | Playwright. Starts dev server if needed. Config: `playwright.config.ts`; specs in `e2e/`.                                                                                                                                                |

**Validation before check-in:** Run `npm run build` and `npm run lint`. Run `npm run test:run` and fix any failing tests in areas you changed. There is no CI in `.github/workflows/`; local build/lint/test are the gates.

**Environment:** For full app (Supabase), copy `.env.example` to `.env` and set Supabase URL and anon key (see `docs/SUPABASE_SETUP.md`). Build and lint do not require `.env`.

---

## Project layout (where to change things)

- **Entry:** `index.html` → `src/main.tsx` (creates root, `QueryClientProvider`, `ThemeModeProvider`, `App`). App router and layout: `src/App.tsx`.
- **Pages:** One folder per page under `src/pages/`: `PageName/PageName.tsx`, optional `PageName.models.ts`, `PageName.constants.ts`, `PageName.helpers.ts`, `index.ts`. Examples: `DictionaryPage/`, `LibraryPage/`, `SettingsPage/`, `LoginPage/`, etc. Put **reusable** types/constants in `src/types/` or `src/lib/`, not in page folders.
- **Components:** Shared UI: `src/components/common/` (e.g. `ConfirmDialog.tsx`), `src/components/layout/` (e.g. `Layout.tsx`, `Navbar.tsx`), `src/components/features/` (e.g. `auth/`, `offline/`).
- **Data/API:** `src/api/` (Supabase calls: `vocabulary.ts`, `userLanguages.ts`, `profiles.ts`, etc.). `src/hooks/` wrap API with TanStack Query (e.g. `useVocabulary.ts`, `useUserLanguages.ts`, `useAuth.ts`). `src/stores/` (Zustand): `authStore.ts`, `offlineModeStore.ts`.
- **Utilities:** `src/lib/` (e.g. `supabase.ts`, `errors.ts`, `sanitize.ts`, `dictionary.ts`, `offlineCache.ts`, `offlineSync.ts`). Types: `src/types/database.ts`, `src/types/index.ts`.
- **Config:** Lint `eslint.config.js`; TypeScript `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`; Vite + PWA + Vitest in `vite.config.ts`; path alias `@` → `src/`.
- **Docs:** `docs/README.md` (index). `HANDOFF.md`, `AI agent instructions.md`, `SUPABASE_SETUP.md`, `OFFLINE.md`, `DICTIONARY_PLAN.md`, etc. **Cursor:** `.cursor/rules/*.mdc`, `.cursor/commands/create-new-feature.md`.

---

## Code style and clean code

**TypeScript:** Use for all code. No `any`.

**Naming (from `.cursor/rules/`):** Descriptive names for every variable/parameter. No single-letter except loop indices `i`, `j`. In callbacks and `.find()/.map()/.filter()` use `option`, `item`, `row` — not `o`, `d`, `opt`. Event handlers: parameter `event` or `ev`, not `e`. Language/direction: `languageSource`/`languageTarget` or `languageFrom`/`languageTo` — not `lang1`/`lang2`. Use one naming level per file (e.g. don’t mix `option` and `o` for the same concept).

**Constants and structure:** Replace magic numbers with named constants (page-specific: `PageName.constants.ts`; shared: `src/lib/` or `src/types/`). Prefer `const`; use `let` only when reassigning. Keep files small; extract types, constants, helpers, or subcomponents as they grow.

**Functions (clean code practice):** Keep functions small and focused (single responsibility). Prefer few parameters (≤3); use an options object for more. Use early returns to reduce nesting. Avoid boolean flags that change behavior; prefer separate functions or clear names. Keep side effects explicit; put business logic in hooks or `src/lib/`, not inside UI components. DRY — don’t duplicate logic across pages; use shared helpers in `src/lib/` or `*.helpers.ts`.

**Pages and helpers:** `PageName.tsx` = component + local state/hooks only; compose features and shared components. Heavy or pure logic → `PageName.helpers.ts` (component-specific) or `src/lib/` (shared). Large handlers (e.g. form submit, file import): implement core logic in a helper; component handler only calls helper and updates state.

---

## Where to look next

- **Current state and handoff:** `docs/HANDOFF.md`.
- **Branching and commits:** `docs/AI agent instructions.md`
- **Detailed rules:** `.cursor/rules/` (general-clean-code, naming-clean-code, helpers-extract, page-architecture)
- **Supabase:** `docs/SUPABASE_SETUP.md`

Trust these instructions; only perform a search when the information here is incomplete or in error.

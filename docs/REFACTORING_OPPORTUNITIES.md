# Refactoring opportunities

Chore list for cleaner code, aligned with the **Study page** refactor: subcomponents, shared constants/helpers, and extracted types. Proceed before or alongside functional changes.

---

## 1. LibraryPage (~612 lines)

**Current:** Single file with add form, filters, list, edit dialog, delete confirm, import/export.

**Suggested (similar to Study):**

- **Subcomponents** (e.g. `LibraryPage/components/`):
  - `AddWordForm` — pair select, direction, word/translation fields, add button.
  - `LibraryFilterBar` — search field, language filter dropdown.
  - `LibraryList` — filtered list, list items with edit/delete.
  - `EditWordDialog` — edit dialog (word, translation, save/cancel).
  - `ImportExportBar` — export CSV/JSON, import button + file input, import message.
- **Types:** Already in `LibraryPage.models.ts` (`LibraryItem`, `LibraryEditingItem`). Consider moving `LibraryExportRow` usage to a shared type or re-export from `importExport` in the page.
- **Helpers:** Already in `LibraryPage.helpers.ts` (e.g. `getLanguagePairLabel`, `processLibraryImport`, `buildLibraryImportMessage`, `downloadBlob`, `buildBidirectionalFilterOptions`, `buildDirectionOptionsForPair`). Keep any new pure logic there.
- **Constants:** Consider `LibraryPage.constants.ts` for `LANGUAGE_PLACEHOLDERS` usage if duplicated, or keep importing from `@/types`.

---

## 2. DictionaryPage (~429 lines)

**Current:** Single file with lookup UI, direction select, API vs store results, combined list, add-from-api/store.

**Suggested:**

- **Subcomponents** (e.g. `DictionaryPage/components/`):
  - `DictionaryLookupBar` — search field, direction select.
  - `DictionaryResultsList` — combined results (store vs API), “Add to library” per item, loading/empty/error states.
  - Optional: `DictionaryDirectionSelect` if the direction UI grows.
- **Helpers:** Move `runApiLookup`-style logic into a `DictionaryPage.helpers.ts` or a small hook (e.g. `useDictionaryLookup`) that returns `{ apiResults, apiLoading, apiError, runLookup }`; keep debounce and offline/cache logic in one place.
- **Constants:** Already in `DictionaryPage.constants.ts` (`DEBOUNCE_MS`, `DIRECTION_OPTIONS`). `STORE_FILTER_DEBOUNCE_MS` could live there.
- **Types:** Already in `DictionaryPage.models.ts` (`ResultItem`). Ensure all result shapes and API entry types are in types/models, not only inline.

---

## 3. Smaller pages and layout

- **SettingsPage (~208 lines):** Already uses `SettingsPage.models.ts`. Optional: extract “pair list with remove” into a `SettingsPairList` subcomponent if you want consistency with other pages.
- **Navbar (~138 lines):** Reasonable size. Optional: extract offline toggle + sync logic into a small hook (e.g. `useOfflineSync`) and/or a `NavbarOfflineToggle` component to slim the main component.
- **HomePage / Login / Signup / ForgotPassword:** Check line count; split only if a file grows beyond ~250–300 lines or has clear UI blocks (e.g. login form vs. signup form).

---

## 4. Reusable types and utils

- **Types:** Keep page-specific types in `*.models.ts` next to the page; move only truly shared types to `src/types/` (e.g. `getBidirectionalKey`, `BIDIRECTIONAL_PAIRS` are already in `types/index.ts`).
- **Utils:** Prefer `src/lib/` for app-wide helpers (sanitize, errors, fsrs, dictionary, importExport). Page-specific pure logic in `*.helpers.ts` (e.g. `buildBidirectionalFilterOptions` for Library, `buildMultipleChoiceOptions` for Study).
- **Constants:** Page-specific in `*.constants.ts`; app-wide in `src/types` or a small `src/constants.ts` if needed.

---

## 5. Order of work

1. **LibraryPage** — largest file; splitting it gives the biggest maintainability win and matches the Study pattern.
2. **DictionaryPage** — next by size; extract lookup + results list and optional hook/helpers.
3. **SettingsPage / Navbar** — optional, when touching those areas.
4. **Shared types/utils** — refactor as you touch each page (e.g. when adding Library subcomponents, ensure no duplicate types in components).

After refactors, update **Project structure** in `docs/HANDOFF.md` and add a short entry to `docs/CHANGELOG.md`.

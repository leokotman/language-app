# Dictionary feature: plan and research

## Approach: store-first, then API; offline message when no store result

- **Store-first lookup:** When the user looks up a word, **first** search in the data we have in the app (app library + user library; later plus cache). **If found** → use it (no API). **If not found** and online and Offline mode is off → call the dictionary API. **If not found** and (offline or Offline mode on) → show a clear message, e.g. *"We need an internet connection to translate this word."* See **`docs/SEED_AND_LOOKUP_STRATEGY.md`** §2 for the full flow.
- **Navbar “Offline mode” toggle:** When on, the app does not perform dictionary (or future pronunciation/audio) requests to the internet. Use only local/cached data. Relevant for users who prefer no internet search and for future audio/pronunciation.

---

## Data strategy (research summary)

### Option A: API only + cache (recommended for online)

**Allowed providers only:** LibreTranslate, MyMemory, Free Dictionary API, Wiktionary.

- **APIs (free / low-cost):**
  - **LibreTranslate** — Open source; en, ru, sr and many more; free (self-host or libretranslate.com with optional API key). Word/phrase translation.
  - **MyMemory** (api.mymemory.translated.net) — By Translated Labs; en↔ru and other pairs; free tier (5k chars/day anonymous, 50k with email); simple GET API; human + machine translations.
  - **Free Dictionary API** (freedictionaryapi.com) — English Wiktionary; no key; 1k req/hour; optional `translations` param; multiple languages via ISO codes.
  - **Wiktionary MediaWiki API** (en.wiktionary.org/w/api.php) — Free; definitions and translations; query by word; may need parsing.
- **Cache:** Store API responses in **IndexedDB** (e.g. via idb-keyval or Dexie). Key by `(query, fromLang, toLang)`. When offline or “Offline mode” on, only read from cache (and optionally from bundled data). *(Cache + bundles implemented in a separate step after online dictionary works.)*

### Option B: Bundled offline data (for offline / no-internet preference)

- **Packages:** e.g. **enru-dict** (npm) — en↔ru as JSON objects; good for offline RU↔EN. Serbian may need a different source (custom list, or API-only when online).
- **Strategy:** Ship a small/medium bundled set (e.g. top N thousand words) for RU↔EN (and later EN↔SR if we find data). Large lists (e.g. 100k) → virtual list required; consider lazy-loading the bundle or splitting by first letter.
- **Hybrid:** API + cache for online; optional preloaded bundle (or cache populated on first use) for offline. “Offline mode” = use only cache + bundle, no API calls.

### Recommendation

1. **Online:** Use **LibreTranslate** or **MyMemory** for translation lookups (en↔ru first; then en↔sr). Optionally **Free Dictionary API** or **Wiktionary API** for English definitions. Implement **one language pair at a time** (e.g. en-ru first).
2. **Offline / Offline mode (separate step):** Implement after online dictionary works. Serve from cache first; optionally add a bundled en-ru dataset. No network when toggle is on.
3. **Virtual list:** Use when result sets can be large (e.g. bundled data); optional for API-only results at first.

---

## Implementation order (step by step)

**Phase 1 — Online dictionary, one language pair**

1. **Offline mode toggle (navbar)**  
   - Global “Offline mode” state (e.g. zustand or React context).  
   - Navbar: toggle (icon or switch). When on: no dictionary/pronunciation API calls.  
   - Persist preference (e.g. localStorage).

2. **Dictionary route and shell**  
   - Route `/dictionary` and “Dictionary” tab in the navbar.  
   - Page: search input, results area (empty state).

3. **One API, one language pair (en–ru), store-first then API**  
   - **Lookup order:** (1) Search app library + user library for (query, fromLang, toLang). (2) If found, return store result. (3) If not found and online and not Offline mode → call **MyMemory** (or LibreTranslate) for `en`↔`ru`. (4) If not found and (offline or Offline mode) → show message: "We need an internet connection to translate this word." See `docs/SEED_AND_LOOKUP_STRATEGY.md` §2.  
   - Map API response to a single “DictionaryEntry” shape (word, translation(s)).  
   - Env var for API key only if needed (e.g. LibreTranslate hosted).

4. **Dictionary UI: search + results + Add to library**  
   - Debounced, sanitized search; call `lookup(…)`; show loading and results.  
   - Per result: “Add to my library” reusing existing vocabulary flow (language_from / language_to from selection or user’s pairs).

**Phase 2 — More language pairs (later)**  
- Add en↔sr (e.g. same API if it supports Serbian). One pair per step.

**Phase 3 — Offline, cache, bundles (separate step)**  
- IndexedDB cache: store/retrieve by `(query, fromLang, toLang)`; when offline or Offline mode, read only from cache.  
- Optional bundled offline data (e.g. enru-dict for en–ru).  
- Virtual list for large result sets if needed.

---

## Virtual list

- Use **@tanstack/react-virtual** (or similar) for the dictionary results list so that large result sets (e.g. from bundled data or broad search) only render visible rows.

---

## Summary

| Item | Choice |
|------|--------|
| Providers | LibreTranslate, MyMemory, Free Dictionary API, Wiktionary only |
| Phase 1 | One language pair (en–ru), **store-first then API**; then UI + Add to library. See `SEED_AND_LOOKUP_STRATEGY.md` §2. |
| Phase 2 | Add more pairs (e.g. en–sr) one at a time |
| Phase 3 (separate) | Offline + IndexedDB cache + optional bundled data |
| Toggle | Navbar “Offline mode” — no network for dictionary (and future audio) |
| Add to library | Reuse existing vocabulary + user_vocabulary flow |

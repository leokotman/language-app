# Dictionary: approach and status

**Current approach:** Store-first lookup (app library + user library, then MyMemory API if online and Offline mode off). Navbar “Offline mode” toggle: when on, no dictionary/audio requests; use only local/cached data. Full flow: **`docs/SEED_AND_LOOKUP_STRATEGY.md`** §2.

**Status:** One tab; MyMemory en↔ru, en↔sr; browse app library, add to my library; offline from IndexedDB when synced. Offline cache and prefetch: **`docs/OFFLINE.md`**.

**APIs (reference):** MyMemory (used), LibreTranslate, Free Dictionary API, Wiktionary. Cache key: `(query, fromLang, toLang)`. Virtual list (e.g. @tanstack/react-virtual) for large result sets when needed.

**Add to library:** Reuse existing vocabulary + user_vocabulary flow.

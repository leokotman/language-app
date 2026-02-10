# Offline feature: summary and debug guide

Use this for the next debugging session. Enable debug logs in the browser console (see below), reproduce the issue, then copy the console output.

---

## 1. What was implemented (summary)

### Goal
Dictionary and My Library should show data when the device is offline (or DevTools → Network → Offline), using data cached in IndexedDB.

### Data flow
- **IndexedDB** (db name `language-app-offline`, store `cache`) holds:
  - `appVocabulary`: all app-library vocabulary rows (all directions: en-ru, ru-en, en-sr, sr-en, ru-sr, sr-ru).
  - `userLanguages:{userId}`: user’s language pairs.
  - `userVocabularyList:{userId}`: user’s library (user_vocabulary + vocabulary).

- **When online:** API calls go to Supabase. On success, vocabulary list responses are merged into the app cache (`mergeAppVocabulary`), and user languages / user library are written to cache in the API layer.

- **When offline (`navigator.onLine === false`):** API layer does **not** call Supabase. It reads from IndexedDB and returns cached data. So:
  - `listVocabulary(langFrom, langTo)` → `getAppVocabulary()` then filter by that pair.
  - `listUserVocabulary(userId)` → `getUserVocabularyList(userId)`.
  - `getUserLanguages(userId)` → cache by userId.

### How the cache is filled (full sync)
1. **On login:** `OfflinePrefetch` (in Layout) runs once and calls `syncForOffline(userId)`: fetches **all** app vocabulary, user languages, user library, writes to IndexedDB.
2. **When user turns Offline toggle ON (navbar):** Same `syncForOffline(userId)` runs, shows “Syncing…”, then Snackbar “Ready for offline.” So the cache has **all** directions, not only the one currently selected on Dictionary.

### Dictionary page behavior
- **Two queries:** `useVocabularyList({ languageFrom: languageSource, languageTo: languageTarget })` and `useVocabularyList({ languageFrom: languageTarget, languageTo: languageSource })`. So we load both directions for the selected pair (e.g. ru→sr and sr→ru).
- **Store results:** `appVocabulary` is the union of those two query results; `storeResults` = filter by search text.
- **TanStack Query:** We set `networkMode: 'always'` on vocabulary and user-library queries so they run when offline and our API can return from IndexedDB.

### Known issue (Dictionary loses results after tab change or direction change)
- **Steps:** (1) Dictionary with internet, search “кошка”, direction ru-sr — OK. (2) Turn off internet, same word — OK. (3) Change tab and back **or** change direction dropdown — word disappears, “Connect to the internet to look up this word.”
- **Likely cause:** Dictionary only requests vocabulary for the **current** direction (two queries: source→target and target→source). When online we merge that pair into the cache. So after step 2 the cache has only (ru,sr) and (sr,ru). When you change to another direction in step 3, we read from cache for the new pair and get 0 rows. So we need the **full** app vocabulary in cache (all 6 directions), which only happens when **full sync** runs: prefetch on login or “Turn Offline ON” while online. Debug logs will show `getAppVocabulary count` and `listVocabulary offline ... cacheTotal, filtered` so we can confirm.

---

## 2. Enable debug logs

In the browser console:

```js
localStorage.setItem('language-app-debug-offline', '1')
```

Then **refresh the page**. You should see immediately:

```text
[offline] debug logging enabled — set localStorage and refresh to see cache/sync logs
```

If you **do not** see that line after refresh, the flag isn’t active (same origin? correct key? storage not cleared?). Fix that first. Then reproduce the steps; all other offline-related logs are prefixed with `[offline]`. Copy the full `[offline]` output and share it.

To turn off:

```js
localStorage.removeItem('language-app-debug-offline')
```

---

## 3. What the logs mean

| Log | Meaning |
|-----|--------|
| `[offline] debug logging enabled — ...` | Shown once after refresh when the flag is set; if you never see this, the flag isn’t active. |
| `[offline] listVocabulary called from=... to=... navigatorOnLine=... isOffline=...` | Every listVocabulary call; confirms whether we took offline branch (isOffline true) or tried network. |
| `[offline] prefetch run userId=...` | OfflinePrefetch started for this user. |
| `[offline] syncForOffline start userId=...` | Full sync started (e.g. from Offline toggle ON). |
| `[offline] syncForOffline done success=... appVocabCount=...` | Full sync finished; appVocabCount = total rows written to app cache. |
| `[offline] getAppVocabulary count=...` | Reading app vocabulary from IndexedDB; count = total rows in cache. |
| `[offline] listVocabulary offline from=... to=... cacheTotal=... filtered=...` | When offline, listVocabulary read from cache; filtered = rows for this direction. |
| `[offline] Dictionary appVocabulary ...` / `Dictionary state ...` | Dictionary page: vocabulary lengths and store results for current direction and search. |

If after changing tab or direction you see `cacheTotal=0` or `filtered=0` for the new direction, the full app vocabulary was never written (sync didn’t run or failed). If `cacheTotal` is large but `filtered=0` for that direction, the filter or direction might be wrong.

---

## 4. Files involved

- **Cache:** `src/lib/offlineCache.ts` (get/set/merge).
- **Sync:** `src/lib/offlineSync.ts` (`syncForOffline`).
- **API (cache when offline):** `src/api/vocabulary.ts` (`listVocabulary`, `listUserVocabulary`), `src/api/userLanguages.ts` (`getUserLanguages`).
- **Prefetch on login:** `src/components/features/offline/OfflinePrefetch.tsx`.
- **Sync when Offline ON:** `src/components/layout/Navbar.tsx` (`handleOfflineToggle`).
- **Dictionary:** `src/pages/DictionaryPage/DictionaryPage.tsx` (uses `useVocabularyList` for two directions).
- **Queries run when offline:** `src/hooks/useVocabulary.ts`, `src/hooks/useUserLanguages.ts` (`networkMode: 'always'`).

---

*Last updated: added summary and debug logging for offline Dictionary debugging.*

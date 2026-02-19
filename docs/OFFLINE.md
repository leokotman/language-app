# Offline: cache, testing, debug

Dictionary and Library use IndexedDB when offline. The app **cannot** disconnect the network — use DevTools → Network → Offline or turn off Wi‑Fi. The **Offline** toggle in the navbar triggers a **full sync** when turned ON (online) so data is cached before you disconnect.

## Cache

- **Storage:** IndexedDB `language-app-offline`, store `cache`. Keys: `appVocabulary`, `userLanguages:{userId}`, `userVocabularyList:{userId}`.
- **Filled by:** (1) On login — `OfflinePrefetch` runs once (all app vocab + your pairs + your library). (2) When you turn Offline ON — same full sync, then “Ready for offline.” (3) Online Dictionary lookups merge into cache.
- **When offline:** API reads from IndexedDB only (no Supabase). Full sync must have run once so all directions are in cache; otherwise changing Dictionary tab/direction can show no results.

## How to test offline

1. Start dev server (`npm run dev`), open app, log in. Optionally turn **Offline** ON once to see “Ready for offline.”
2. DevTools → **Network** → **Offline** (or turn off Wi‑Fi).
3. Refresh or open Dictionary/Library — data should come from cache. Inspect: DevTools → Application → IndexedDB → `language-app-offline`.

## Debug logs

In console: `localStorage.setItem('language-app-debug-offline', '1')` then **refresh**. All offline-related logs start with `[offline]`. Copy them when debugging. Off: `localStorage.removeItem('language-app-debug-offline')` then refresh.

| Log                                                      | Meaning                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| `syncForOffline start/done`                              | Full sync started/finished; `appVocabCount` = rows in cache. |
| `listVocabulary offline ... cacheTotal=... filtered=...` | Offline read; `filtered` = rows for current direction.       |
| `getAppVocabulary count=...`                             | Rows in app vocabulary cache.                                |

If after changing direction you see `filtered=0`, run full sync (login prefetch or Offline ON) so all directions are cached.

## Key files

- Cache: `src/lib/offlineCache.ts`. Sync: `src/lib/offlineSync.ts`. Prefetch: `src/components/features/offline/OfflinePrefetch.tsx`. Toggle: `src/components/layout/Navbar.tsx`. API uses cache when offline: `src/api/vocabulary.ts`, `src/api/userLanguages.ts`.

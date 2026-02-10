# Offline debugging

How to test the app when the browser has no internet (e.g. DevTools → Network → Offline, or Wi‑Fi off).

---

## Can the app disconnect the internet?

**No.** Browsers do not expose an API to turn off the device’s network. The app cannot disconnect Wi‑Fi or simulate “offline” at the OS level. To test offline you must:

- **DevTools:** Network tab → check **Offline**, or  
- **System:** Turn off Wi‑Fi / unplug ethernet.

The **Offline** toggle in the app only enables “offline mode” (no web dictionary/pronunciation calls) and **triggers a full sync** when you turn it ON while online, so data is cached before you disconnect.

---

## How the cache is filled

1. **On login (automatic):** When you log in and land on any protected page, `OfflinePrefetch` runs once and fetches **all** app vocabulary, your language pairs, and your library into IndexedDB. You don’t need to open Dictionary or pick each direction.
2. **When you turn Offline ON (recommended before disconnecting):** If you’re online and turn the **Offline** switch ON in the navbar, the app runs a **full sync** (all app vocabulary + your languages + your library), shows “Syncing…”, then “Ready for offline. You can disconnect now.” After that you can turn off Wi‑Fi or use DevTools Offline and the app will use the cache.
3. **Merge:** While online, successful Dictionary lookups also merge into the app vocabulary cache as a fallback.

---

## Using `npm run dev` without internet

**Yes.** You can debug offline behavior with the dev server.

1. **Start the dev server (with internet):**
   ```bash
   npm run dev
   ```
2. Open **http://localhost:5173** in the browser. The app is served from your machine; the dev server does not need internet.
3. **While online:** Log in. Optionally turn **Offline** ON once to run a full sync and see “Ready for offline.” (Prefetch on login also fills the cache in the background.)
4. **Disable network:** DevTools → **Network** → **Offline**, or turn off Wi‑Fi.
5. Refresh or navigate to Dictionary / Library. The app should show data from the cache.

---

## Where the cache lives

- **Storage:** IndexedDB, database name `language-app-offline`, store `cache`.
- **Keys:** `appVocabulary`, `userLanguages:{userId}`, `userVocabularyList:{userId}`.

In DevTools → **Application** → **Storage** → **IndexedDB** → `language-app-offline` you can inspect or clear the cache.

---

## Debug logs (optional)

To see `[offline]` logs (sync, cache reads, Dictionary state):

1. In the browser console run: `localStorage.setItem('language-app-debug-offline', '1')`
2. **Refresh the page.** You should see right away: `[offline] debug logging enabled — ...`
3. If you **never** see that line after refresh, the flag isn’t active (check: same origin, no typo in key, not in a private window that cleared storage).
4. Reproduce the issue (e.g. login → Dictionary → search → turn off network → change tab or direction), then copy all lines starting with `[offline]` and share them.

To turn off: `localStorage.removeItem('language-app-debug-offline')` then refresh.

---

## If you see no data when offline

1. Confirm you were **online** after login and opened **Dictionary** or **Library** at least once before going offline.
2. In DevTools → **Application** → **IndexedDB** → `language-app-offline` → `cache`, check that `appVocabulary` has rows (and, for Library, `userLanguages:...` and `userVocabularyList:...` for your user id).
3. Ensure **Network** is set to **Offline** (or the system has no internet). The app uses `navigator.onLine` and falls back to cache when the network request would fail.

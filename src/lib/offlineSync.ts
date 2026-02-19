/**
 * Full sync of app vocabulary and user data into IndexedDB for offline use.
 * Call when the user turns "Offline" ON (while online) or on first load after login.
 */

import { listAllAppVocabulary, listUserVocabulary } from "@/api/vocabulary";
import { getUserLanguages } from "@/api/userLanguages";
import { setAppVocabulary } from "@/lib/offlineCache";
import { offlineLog } from "@/lib/offlineDebug";
import { logError } from "@/lib/errors";

export interface SyncForOfflineResult {
  success: boolean;
  error?: Error;
}

/**
 * Fetches all app vocabulary, user language pairs, and user library from the server
 * and writes them to IndexedDB. Run when online so data is available offline.
 */
export async function syncForOffline(
  userId: string,
): Promise<SyncForOfflineResult> {
  offlineLog("syncForOffline start", { userId });
  try {
    const { data: appVocab, error: appError } = await listAllAppVocabulary();
    if (appError) {
      logError("offlineSync.listAllAppVocabulary", appError);
      return {
        success: false,
        error:
          appError instanceof Error ? appError : new Error(String(appError)),
      };
    }
    if (appVocab.length > 0) {
      await setAppVocabulary(appVocab);
    }

    const { error: langsError } = await getUserLanguages(userId);
    if (langsError) {
      logError("offlineSync.getUserLanguages", langsError);
      return {
        success: false,
        error:
          langsError instanceof Error
            ? langsError
            : new Error(String(langsError)),
      };
    }

    const { error: libError } = await listUserVocabulary(userId);
    if (libError) {
      logError("offlineSync.listUserVocabulary", libError);
      return {
        success: false,
        error:
          libError instanceof Error ? libError : new Error(String(libError)),
      };
    }

    offlineLog("syncForOffline done", {
      success: true,
      appVocabCount: appVocab.length,
    });
    return { success: true };
  } catch (err) {
    logError("offlineSync.syncForOffline", err);
    offlineLog("syncForOffline done", { success: false, error: String(err) });
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

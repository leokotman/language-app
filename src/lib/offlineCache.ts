/**
 * IndexedDB cache for offline PWA: app vocabulary, user languages, user library.
 * When offline (or on network error), the API layer reads from here so Dictionary and Library still show data.
 */

import { offlineLog } from "@/lib/offlineDebug";
import type { VocabularyRow } from "@/types/database";
import type { UserLanguageRow } from "@/types/database";
import type { UserVocabularyRow } from "@/types/database";

const DB_NAME = "language-app-offline";
const DB_VERSION = 1;
const STORE_NAME = "cache";

const KEY_APP_VOCABULARY = "appVocabulary";
const KEY_USER_LANGUAGES_PREFIX = "userLanguages:";
const KEY_USER_VOCABULARY_LIST_PREFIX = "userVocabularyList:";
const KEY_LOOKUP_PREFIX = "lookup:";
const KEY_LOOKUP_META = "lookup:meta";
const LOOKUP_CACHE_MAX_ENTRIES = 80;

/** Stored shape for one dictionary lookup (same as DictionaryEntry). */
export type DictionaryLookupEntry = {
  word: string;
  translation: string;
  language_from: string;
  language_to: string;
};

export type UserVocabularyListItem = UserVocabularyRow & {
  vocabulary: VocabularyRow | null;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

function get<T>(key: string): Promise<T | null> {
  return openDb().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve((request.result as T) ?? null);
      transaction.oncomplete = () => db.close();
    });
  });
}

function set(key: string, value: unknown): Promise<void> {
  return openDb().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
      transaction.oncomplete = () => db.close();
    });
  });
}

function deleteKey(key: string): Promise<void> {
  return openDb().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
      transaction.oncomplete = () => db.close();
    });
  });
}

export async function getAppVocabulary(): Promise<VocabularyRow[]> {
  const cached = await get<VocabularyRow[]>(KEY_APP_VOCABULARY);
  const rows = cached ?? [];
  offlineLog("getAppVocabulary", { count: rows.length });
  return rows;
}

export async function setAppVocabulary(rows: VocabularyRow[]): Promise<void> {
  await set(KEY_APP_VOCABULARY, rows);
  offlineLog("setAppVocabulary", { count: rows.length });
}

/** Merge new vocabulary rows into the app cache (by id). Use after a successful listVocabulary fetch so one Dictionary visit fills the cache. */
export async function mergeAppVocabulary(
  newRows: VocabularyRow[],
): Promise<void> {
  if (newRows.length === 0) return;
  const existing = (await get<VocabularyRow[]>(KEY_APP_VOCABULARY)) ?? [];
  const byId = new Map(existing.map((row) => [row.id, row]));
  for (const row of newRows) {
    byId.set(row.id, row);
  }
  const merged = Array.from(byId.values());
  await set(KEY_APP_VOCABULARY, merged);
  offlineLog("mergeAppVocabulary", {
    added: newRows.length,
    totalAfter: merged.length,
  });
}

export async function getUserLanguages(
  userId: string,
): Promise<UserLanguageRow[]> {
  const cached = await get<UserLanguageRow[]>(
    KEY_USER_LANGUAGES_PREFIX + userId,
  );
  return cached ?? [];
}

export async function setUserLanguages(
  userId: string,
  rows: UserLanguageRow[],
): Promise<void> {
  await set(KEY_USER_LANGUAGES_PREFIX + userId, rows);
}

export async function getUserVocabularyList(
  userId: string,
): Promise<UserVocabularyListItem[]> {
  const cached = await get<UserVocabularyListItem[]>(
    KEY_USER_VOCABULARY_LIST_PREFIX + userId,
  );
  return cached ?? [];
}

export async function setUserVocabularyList(
  userId: string,
  items: UserVocabularyListItem[],
): Promise<void> {
  await set(KEY_USER_VOCABULARY_LIST_PREFIX + userId, items);
}

/** Get cached dictionary lookup from IndexedDB (persists across refresh, true offline). */
export async function getDictionaryLookupCache(
  queryKey: string,
): Promise<DictionaryLookupEntry[] | null> {
  const raw = await get<{ entries: DictionaryLookupEntry[] }>(
    KEY_LOOKUP_PREFIX + queryKey,
  );
  return raw?.entries ?? null;
}

/** Store dictionary lookup in IndexedDB and evict oldest if over limit. */
export async function setDictionaryLookupCache(
  queryKey: string,
  entries: DictionaryLookupEntry[],
): Promise<void> {
  if (entries.length === 0) return;
  const meta = await get<{ keys: string[] }>(KEY_LOOKUP_META);
  const keys = meta?.keys ?? [];
  const updated = [queryKey, ...keys.filter((key) => key !== queryKey)].slice(
    0,
    LOOKUP_CACHE_MAX_ENTRIES,
  );
  const evicted = keys.filter((key) => !updated.includes(key));
  for (const keyToEvict of evicted) {
    await deleteKey(KEY_LOOKUP_PREFIX + keyToEvict);
  }
  await set(KEY_LOOKUP_PREFIX + queryKey, { entries, updatedAt: Date.now() });
  await set(KEY_LOOKUP_META, { keys: updated });
  offlineLog("setDictionaryLookupCache", {
    queryKey: queryKey.slice(0, 30),
    entriesCount: entries.length,
  });
}

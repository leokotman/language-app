import { supabase } from "@/lib/supabase";
import { isNetworkError } from "@/lib/errors";
import { offlineLog } from "@/lib/offlineDebug";
import {
  getAppVocabulary,
  mergeAppVocabulary,
  getUserVocabularyList,
  setUserVocabularyList,
} from "@/lib/offlineCache";
import type {
  VocabularyRow,
  VocabularyInsert,
  VocabularyUpdate,
  UserVocabularyRow,
  UserVocabularyInsert,
  UserVocabularyUpdate,
  VocabularyScoreRow,
  VocabularyScoreInsert,
  VocabularyScoreUpdate,
} from "@/types/database";

/** List all app-library vocabulary (source='app'). Used for offline cache prefetch. */
export async function listAllAppVocabulary(): Promise<{
  data: VocabularyRow[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("vocabulary")
    .select("*")
    .eq("source", "app")
    .order("language_from")
    .order("language_to")
    .order("word");
  return {
    data: (data ?? []) as VocabularyRow[],
    error: error as Error | null,
  };
}

/**
 * List vocabulary for a language pair (app library + optionally user-created).
 * On success, merges fetched rows into the offline cache.
 *
 * **Offline behavior:** When offline (or on network error), returns only **app vocabulary**
 * from the IndexedDB cache. The `includeUserCreated` parameter has no effect offline;
 * user-created words for the pair are not included until they have been fetched online
 * and synced to the cache (e.g. after a full OfflinePrefetch or sync while online).
 */
export async function listVocabulary(params: {
  languageFrom: string;
  languageTo: string;
  includeUserCreated?: boolean;
  userId?: string;
}): Promise<{ data: VocabularyRow[]; error: Error | null }> {
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  offlineLog("listVocabulary called", {
    from: params.languageFrom,
    to: params.languageTo,
    navigatorOnLine:
      typeof navigator !== "undefined" ? navigator.onLine : undefined,
    isOffline,
  });

  const filterCache = (rows: VocabularyRow[]) =>
    rows.filter(
      (row) =>
        row.language_from === params.languageFrom &&
        row.language_to === params.languageTo,
    );

  if (isOffline) {
    const cached = await getAppVocabulary();
    const filtered = filterCache(cached);
    offlineLog("listVocabulary offline", {
      from: params.languageFrom,
      to: params.languageTo,
      cacheTotal: cached.length,
      filtered: filtered.length,
    });
    return { data: filtered, error: null };
  }

  try {
    let query = supabase
      .from("vocabulary")
      .select("*")
      .eq("language_from", params.languageFrom)
      .eq("language_to", params.languageTo)
      .order("word");

    if (!params.includeUserCreated) {
      query = query.eq("source", "app");
    }

    const { data, error } = await query;
    const result = {
      data: (data ?? []) as VocabularyRow[],
      error: error as Error | null,
    };

    if (result.error) {
      if (isNetworkError(result.error)) {
        const cached = await getAppVocabulary();
        const filtered = filterCache(cached);
        offlineLog("listVocabulary network error, from cache", {
          from: params.languageFrom,
          to: params.languageTo,
          cacheTotal: cached.length,
          filtered: filtered.length,
        });
        return { data: filtered, error: null };
      }
      return result;
    }

    if (result.data.length > 0) {
      await mergeAppVocabulary(result.data);
    }
    return result;
  } catch (err) {
    if (isNetworkError(err)) {
      const cached = await getAppVocabulary();
      const filtered = filterCache(cached);
      offlineLog("listVocabulary catch, from cache", {
        from: params.languageFrom,
        to: params.languageTo,
        cacheTotal: cached.length,
        filtered: filtered.length,
      });
      return { data: filtered, error: null };
    }
    throw err;
  }
}

/** Create a user vocabulary entry (word). */
export async function createVocabulary(
  payload: VocabularyInsert,
): Promise<{ data: VocabularyRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("vocabulary")
    .insert(payload)
    .select()
    .single();
  return { data: data as VocabularyRow | null, error: error as Error | null };
}

/** Update a vocabulary entry (only user-created). */
export async function updateVocabulary(
  id: string,
  updates: VocabularyUpdate,
): Promise<{ data: VocabularyRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("vocabulary")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data: data as VocabularyRow | null, error: error as Error | null };
}

/** Delete a vocabulary entry (only user-created). */
export async function deleteVocabulary(
  id: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("vocabulary").delete().eq("id", id);
  return { error: error as Error | null };
}

/** Get one vocabulary row by id. */
export async function getVocabularyById(id: string): Promise<{
  data: VocabularyRow | null;
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("vocabulary")
    .select("*")
    .eq("id", id)
    .single();
  return { data: data as VocabularyRow | null, error: error as Error | null };
}

// ---------- user_vocabulary (personal library with FSRS) ----------

/** End of today in UTC (23:59:59.999) as ISO string for "due today" queries. */
function endOfTodayUtc(): string {
  const date = new Date();
  date.setUTCHours(23, 59, 59, 999);
  return date.toISOString();
}

export type DueTodayFilters = {
  languageFrom?: string;
  languageTo?: string;
  /** Pair key (e.g. en-ru, ru-sr): include both directions (from-to and to-from). */
  pairKey?: "en-ru" | "en-sr" | "ru-sr";
};

/** List user's cards due by end of today (for study session). Optional filter by language pair. */
export async function listDueToday(
  userId: string,
  filters?: DueTodayFilters,
): Promise<{
  data: (UserVocabularyRow & { vocabulary: VocabularyRow | null })[];
  error: Error | null;
}> {
  const endOfToday = endOfTodayUtc();
  const { data, error } = await supabase
    .from("user_vocabulary")
    .select("*, vocabulary:vocabulary_id(*)")
    .eq("user_id", userId)
    .lte("due", endOfToday)
    .order("due", { ascending: true });

  if (error) return { data: [], error: error as Error };
  const rows = (data ?? []) as (UserVocabularyRow & {
    vocabulary: VocabularyRow | null;
  })[];

  if (filters?.pairKey) {
    const [a, b] = filters.pairKey.split("-");
    if (a && b) {
      const filtered = rows.filter((row) => {
        const from = row.vocabulary?.language_from;
        const to = row.vocabulary?.language_to;
        return (from === a && to === b) || (from === b && to === a);
      });
      return { data: filtered, error: null };
    }
  }
  if (filters?.languageFrom && filters?.languageTo) {
    const filtered = rows.filter(
      (row) =>
        row.vocabulary?.language_from === filters.languageFrom &&
        row.vocabulary?.language_to === filters.languageTo,
    );
    return { data: filtered, error: null };
  }
  return { data: rows, error: null };
}

/** List user's personal library (user_vocabulary joined with vocabulary). When offline returns from cache immediately. */
export async function listUserVocabulary(userId: string): Promise<{
  data: (UserVocabularyRow & { vocabulary: VocabularyRow | null })[];
  error: Error | null;
}> {
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  if (isOffline) {
    const cached = await getUserVocabularyList(userId);
    offlineLog("listUserVocabulary offline", {
      userId,
      cachedCount: cached.length,
    });
    return { data: cached, error: null };
  }

  try {
    const { data, error } = await supabase
      .from("user_vocabulary")
      .select("*, vocabulary:vocabulary_id(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error && isNetworkError(error)) {
      const cached = await getUserVocabularyList(userId);
      return { data: cached, error: null };
    }
    if (error) return { data: [], error: error as Error };

    const result = (data ?? []) as (UserVocabularyRow & {
      vocabulary: VocabularyRow | null;
    })[];
    await setUserVocabularyList(userId, result);
    return { data: result, error: null };
  } catch (err) {
    if (isNetworkError(err)) {
      const cached = await getUserVocabularyList(userId);
      return { data: cached, error: null };
    }
    throw err;
  }
}

/** Add a word to user's library (creates user_vocabulary row; vocabulary may be existing or new). */
export async function addToUserLibrary(
  payload: UserVocabularyInsert,
): Promise<{ data: UserVocabularyRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_vocabulary")
    .insert(payload)
    .select()
    .single();
  return {
    data: data as UserVocabularyRow | null,
    error: error as Error | null,
  };
}

/** Update FSRS fields for a user_vocabulary row. */
export async function updateUserVocabulary(
  id: string,
  updates: UserVocabularyUpdate,
): Promise<{ data: UserVocabularyRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_vocabulary")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return {
    data: data as UserVocabularyRow | null,
    error: error as Error | null,
  };
}

/** Remove a word from user's library. */
export async function removeFromUserLibrary(
  id: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("user_vocabulary")
    .delete()
    .eq("id", id);
  return { error: error as Error | null };
}

/** Upsert vocabulary_score for (user_id, vocabulary_id). Increments practised_dates_count when last_exercise_at date changes. */
export async function upsertVocabularyScore(
  userId: string,
  vocabularyId: string,
  payload: {
    score: number;
    last_exercise_at: string;
    learnt: boolean;
  },
): Promise<{ data: VocabularyScoreRow | null; error: Error | null }> {
  const { data: existing, error: fetchErr } = await supabase
    .from("vocabulary_score")
    .select("last_exercise_at, practised_dates_count")
    .eq("user_id", userId)
    .eq("vocabulary_id", vocabularyId)
    .maybeSingle();

  if (fetchErr) return { data: null, error: fetchErr as Error };

  const newDate = payload.last_exercise_at.slice(0, 10);
  const existingDate = existing?.last_exercise_at?.slice(0, 10);
  const practisedDelta =
    existing == null ? 1 : newDate !== existingDate ? 1 : 0;
  const practised_dates_count =
    (existing?.practised_dates_count ?? 0) + practisedDelta;

  const row: VocabularyScoreInsert & VocabularyScoreUpdate = {
    user_id: userId,
    vocabulary_id: vocabularyId,
    score: Math.max(0, Math.min(100, Math.round(payload.score))),
    last_exercise_at: payload.last_exercise_at,
    practised_dates_count,
    learnt: payload.learnt,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("vocabulary_score")
    .upsert(row, {
      onConflict: "user_id,vocabulary_id",
      ignoreDuplicates: false,
    })
    .select()
    .single();

  return {
    data: data as VocabularyScoreRow | null,
    error: error as Error | null,
  };
}

/** Create a new user word and add it to the user's library (vocabulary + user_vocabulary). */
export async function addWordToLibrary(
  userId: string,
  params: {
    word: string;
    translation: string;
    language_from: string;
    language_to: string;
  },
): Promise<{
  data: (UserVocabularyRow & { vocabulary: VocabularyRow | null }) | null;
  error: Error | null;
}> {
  const { data: vocab, error: createErr } = await createVocabulary({
    word: params.word.trim(),
    translation: params.translation.trim(),
    language_from: params.language_from,
    language_to: params.language_to,
    source: "user",
    created_by: userId,
  });
  if (createErr || !vocab)
    return {
      data: null,
      error: createErr ?? new Error("Failed to create word"),
    };

  const { data: userVocab, error: addErr } = await addToUserLibrary({
    user_id: userId,
    vocabulary_id: vocab.id,
  });
  if (addErr || !userVocab)
    return {
      data: null,
      error: addErr ?? new Error("Failed to add to library"),
    };

  return {
    data: { ...userVocab, vocabulary: vocab } as UserVocabularyRow & {
      vocabulary: VocabularyRow | null;
    },
    error: null,
  };
}

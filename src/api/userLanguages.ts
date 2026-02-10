import { supabase } from '@/lib/supabase'
import { isNetworkError } from '@/lib/errors'
import { offlineLog } from '@/lib/offlineDebug'
import { getUserLanguages as getCachedUserLanguages, setUserLanguages } from '@/lib/offlineCache'
import type { UserLanguageRow, UserLanguageInsert, UserLanguageRowUpdate } from '@/types/database'

/** Fetch the current user's language pairs. When offline returns from cache immediately. */
export async function getUserLanguages(userId: string): Promise<{
  data: UserLanguageRow[]
  error: Error | null
}> {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine

  if (isOffline) {
    const cached = await getCachedUserLanguages(userId)
    offlineLog('getUserLanguages offline', { userId, cachedCount: cached.length })
    return { data: cached, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('user_languages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')

    if (error && isNetworkError(error)) {
      const cached = await getCachedUserLanguages(userId)
      return { data: cached, error: null }
    }
    if (error) return { data: [], error: error as Error }

    const result = (data ?? []) as UserLanguageRow[]
    await setUserLanguages(userId, result)
    return { data: result, error: null }
  } catch (err) {
    if (isNetworkError(err)) {
      const cached = await getCachedUserLanguages(userId)
      return { data: cached, error: null }
    }
    throw err
  }
}

/** Add a language pair for the user. */
export async function addUserLanguage(
  payload: UserLanguageInsert
): Promise<{ data: UserLanguageRow | null; error: Error | null }> {
  const { data, error } = await supabase.from('user_languages').insert(payload).select().single()
  return { data: data as UserLanguageRow | null, error: error as Error | null }
}

/** Remove a language pair. */
export async function removeUserLanguage(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('user_languages').delete().eq('id', id)
  return { error: error as Error | null }
}

/** Remove multiple language pairs by id (e.g. both directions of a bidirectional pair). */
export async function removeUserLanguagesByIds(
  ids: string[]
): Promise<{ error: Error | null }> {
  if (ids.length === 0) return { error: null }
  const { error } = await supabase.from('user_languages').delete().in('id', ids)
  return { error: error as Error | null }
}

/** Add a bidirectional pair (both directions) for the user. */
export async function addBidirectionalPair(
  userId: string,
  key: string
): Promise<{ data: UserLanguageRow[]; error: Error | null }> {
  const [languageCodeA, languageCodeB] = key.split('-')
  if (!languageCodeA || !languageCodeB) {
    return { data: [], error: new Error('Invalid pair key') as Error }
  }
  const rows: UserLanguageInsert[] = [
    { user_id: userId, native_code: languageCodeA, learning_code: languageCodeB },
    { user_id: userId, native_code: languageCodeB, learning_code: languageCodeA },
  ]
  const { data, error } = await supabase.from('user_languages').insert(rows).select()
  return { data: (data ?? []) as UserLanguageRow[], error: error as Error | null }
}

/** Update a user language pair (e.g. switch default). */
export async function updateUserLanguage(
  id: string,
  updates: UserLanguageRowUpdate
): Promise<{ data: UserLanguageRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('user_languages')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data: data as UserLanguageRow | null, error: error as Error | null }
}

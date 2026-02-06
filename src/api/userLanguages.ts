import { supabase } from '@/lib/supabase'
import type { UserLanguageRow, UserLanguageInsert, UserLanguageRowUpdate } from '@/types/database'

/** Fetch the current user's language pairs. */
export async function getUserLanguages(userId: string): Promise<{
  data: UserLanguageRow[]
  error: Error | null
}> {
  const { data, error } = await supabase
    .from('user_languages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  return { data: (data ?? []) as UserLanguageRow[], error: error as Error | null }
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
  const [lang1, lang2] = key.split('-')
  if (!lang1 || !lang2) {
    return { data: [], error: new Error('Invalid pair key') as Error }
  }
  const rows: UserLanguageInsert[] = [
    { user_id: userId, native_code: lang1, learning_code: lang2 },
    { user_id: userId, native_code: lang2, learning_code: lang1 },
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

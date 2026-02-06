import { supabase } from '@/lib/supabase'
import type {
  VocabularyRow,
  VocabularyInsert,
  VocabularyUpdate,
  UserVocabularyRow,
  UserVocabularyInsert,
  UserVocabularyUpdate,
} from '@/types/database'

/** List vocabulary for a language pair. App library + optionally user's own. */
export async function listVocabulary(params: {
  languageFrom: string
  languageTo: string
  includeUserCreated?: boolean
  userId?: string
}): Promise<{ data: VocabularyRow[]; error: Error | null }> {
  let query = supabase
    .from('vocabulary')
    .select('*')
    .eq('language_from', params.languageFrom)
    .eq('language_to', params.languageTo)
    .order('word')

  if (!params.includeUserCreated) {
    query = query.eq('source', 'app')
  }
  // When includeUserCreated is true, RLS returns app library + user's own rows

  const { data, error } = await query
  return { data: (data ?? []) as VocabularyRow[], error: error as Error | null }
}

/** Create a user vocabulary entry (word). */
export async function createVocabulary(
  payload: VocabularyInsert
): Promise<{ data: VocabularyRow | null; error: Error | null }> {
  const { data, error } = await supabase.from('vocabulary').insert(payload).select().single()
  return { data: data as VocabularyRow | null, error: error as Error | null }
}

/** Update a vocabulary entry (only user-created). */
export async function updateVocabulary(
  id: string,
  updates: VocabularyUpdate
): Promise<{ data: VocabularyRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('vocabulary')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data: data as VocabularyRow | null, error: error as Error | null }
}

/** Delete a vocabulary entry (only user-created). */
export async function deleteVocabulary(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('vocabulary').delete().eq('id', id)
  return { error: error as Error | null }
}

/** Get one vocabulary row by id. */
export async function getVocabularyById(id: string): Promise<{
  data: VocabularyRow | null
  error: Error | null
}> {
  const { data, error } = await supabase.from('vocabulary').select('*').eq('id', id).single()
  return { data: data as VocabularyRow | null, error: error as Error | null }
}

// ---------- user_vocabulary (personal library with FSRS) ----------

/** List user's personal library (user_vocabulary joined with vocabulary). */
export async function listUserVocabulary(userId: string): Promise<{
  data: (UserVocabularyRow & { vocabulary: VocabularyRow | null })[]
  error: Error | null
}> {
  const { data, error } = await supabase
    .from('user_vocabulary')
    .select('*, vocabulary:vocabulary_id(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return {
    data: (data ?? []) as (UserVocabularyRow & { vocabulary: VocabularyRow | null })[],
    error: error as Error | null,
  }
}

/** Add a word to user's library (creates user_vocabulary row; vocabulary may be existing or new). */
export async function addToUserLibrary(
  payload: UserVocabularyInsert
): Promise<{ data: UserVocabularyRow | null; error: Error | null }> {
  const { data, error } = await supabase.from('user_vocabulary').insert(payload).select().single()
  return { data: data as UserVocabularyRow | null, error: error as Error | null }
}

/** Update FSRS fields for a user_vocabulary row. */
export async function updateUserVocabulary(
  id: string,
  updates: UserVocabularyUpdate
): Promise<{ data: UserVocabularyRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('user_vocabulary')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data: data as UserVocabularyRow | null, error: error as Error | null }
}

/** Remove a word from user's library. */
export async function removeFromUserLibrary(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('user_vocabulary').delete().eq('id', id)
  return { error: error as Error | null }
}

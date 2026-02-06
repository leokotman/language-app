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

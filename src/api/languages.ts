import { supabase } from '@/lib/supabase'
import type { LanguageRow } from '@/types/database'

/** Fetch all supported languages. */
export async function getLanguages(): Promise<{ data: LanguageRow[]; error: Error | null }> {
  const { data, error } = await supabase.from('languages').select('*').order('code')
  return { data: (data ?? []) as LanguageRow[], error: error as Error | null }
}

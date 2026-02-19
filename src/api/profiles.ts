import { supabase } from "@/lib/supabase";

export interface ProfileInsert {
  id: string;
  email?: string;
  display_name?: string;
}

/** Create or update the current user's profile. Call after signup or when syncing from auth. */
export async function upsertProfile(profile: ProfileInsert) {
  const { error } = await supabase.from("profiles").upsert(
    {
      ...profile,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  return { error };
}

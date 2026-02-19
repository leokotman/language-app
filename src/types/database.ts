/**
 * Supabase database types for the language app.
 * Matches migrations 001_profiles + 002_core_data_layer.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      languages: {
        Row: {
          code: string;
          name: string;
        };
        Insert: {
          code: string;
          name: string;
        };
        Update: {
          code?: string;
          name?: string;
        };
        Relationships: [];
      };
      user_languages: {
        Row: {
          id: string;
          user_id: string;
          learning_code: string;
          native_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          learning_code: string;
          native_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          learning_code?: string;
          native_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      vocabulary: {
        Row: {
          id: string;
          word: string;
          translation: string;
          language_from: string;
          language_to: string;
          source: "app" | "user";
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          word: string;
          translation: string;
          language_from: string;
          language_to: string;
          source: "app" | "user";
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          word?: string;
          translation?: string;
          language_from?: string;
          language_to?: string;
          source?: "app" | "user";
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_vocabulary: {
        Row: {
          id: string;
          user_id: string;
          vocabulary_id: string;
          state: number;
          due: string;
          stability: number;
          difficulty: number;
          elapsed_days: number;
          scheduled_days: number;
          learning_steps: number;
          reps: number;
          lapses: number;
          last_review: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vocabulary_id: string;
          state?: number;
          due?: string;
          stability?: number;
          difficulty?: number;
          elapsed_days?: number;
          scheduled_days?: number;
          learning_steps?: number;
          reps?: number;
          lapses?: number;
          last_review?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vocabulary_id?: string;
          state?: number;
          due?: string;
          stability?: number;
          difficulty?: number;
          elapsed_days?: number;
          scheduled_days?: number;
          learning_steps?: number;
          reps?: number;
          lapses?: number;
          last_review?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience row types
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type LanguageRow = Database["public"]["Tables"]["languages"]["Row"];
export type UserLanguageRow =
  Database["public"]["Tables"]["user_languages"]["Row"];
export type VocabularyRow = Database["public"]["Tables"]["vocabulary"]["Row"];
export type UserVocabularyRow =
  Database["public"]["Tables"]["user_vocabulary"]["Row"];

export type VocabularyInsert =
  Database["public"]["Tables"]["vocabulary"]["Insert"];
export type VocabularyUpdate =
  Database["public"]["Tables"]["vocabulary"]["Update"];
export type UserVocabularyInsert =
  Database["public"]["Tables"]["user_vocabulary"]["Insert"];
export type UserVocabularyUpdate =
  Database["public"]["Tables"]["user_vocabulary"]["Update"];
export type UserLanguageInsert =
  Database["public"]["Tables"]["user_languages"]["Insert"];
export type UserLanguageRowUpdate =
  Database["public"]["Tables"]["user_languages"]["Update"];

-- Supabase Performance/Security Linter fixes.
-- Run after 001_profiles.sql and 002_core_data_layer.sql (and optionally 003_seed_vocabulary.sql).
-- Addresses: RLS disabled on public.languages, function search_path mutable on set_updated_at.

-- 1) RLS on public.languages (reference table: read-only for app)
-- Lint: rls_disabled_in_public
alter table if exists public.languages enable row level security;

create policy "Anyone can read languages"
  on public.languages for select
  using (true);

-- 2) Function search_path immutable for set_updated_at
-- Lint: function_search_path_mutable
-- (Run 001_profiles.sql first; this function is created there.)
alter function public.set_updated_at() set search_path = public;

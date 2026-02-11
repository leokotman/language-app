-- Supabase performance linter fixes.
-- Run once on a project that already has 001, 002, 004 applied (no need to re-run those).
-- Addresses: unindexed foreign keys, unused indexes, auth RLS init plan, multiple permissive policies.

-- =============================================================================
-- 1) Unindexed foreign keys: add covering indexes
-- =============================================================================

-- user_languages: learning_code, native_code (FKs to languages.code)
create index if not exists idx_user_languages_learning_code
  on public.user_languages (learning_code);

create index if not exists idx_user_languages_native_code
  on public.user_languages (native_code);

-- user_vocabulary: vocabulary_id (FK to vocabulary.id)
create index if not exists idx_user_vocabulary_vocabulary_id
  on public.user_vocabulary (vocabulary_id);

-- vocabulary: language_to (FK to languages.code)
create index if not exists idx_vocabulary_language_to
  on public.vocabulary (language_to);

-- =============================================================================
-- 2) Unused indexes: remove to reduce write overhead
-- =============================================================================

drop index if exists public.idx_vocabulary_created_by;
drop index if exists public.idx_user_vocabulary_user_id;

-- =============================================================================
-- 3) Auth RLS init plan: use (select auth.uid()) so it is evaluated once per query
-- =============================================================================

-- profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- user_languages
drop policy if exists "Users can view own user_languages" on public.user_languages;
create policy "Users can view own user_languages"
  on public.user_languages for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own user_languages" on public.user_languages;
create policy "Users can insert own user_languages"
  on public.user_languages for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own user_languages" on public.user_languages;
create policy "Users can update own user_languages"
  on public.user_languages for update
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own user_languages" on public.user_languages;
create policy "Users can delete own user_languages"
  on public.user_languages for delete
  using ((select auth.uid()) = user_id);

-- vocabulary
drop policy if exists "Anyone can read app vocabulary" on public.vocabulary;
drop policy if exists "Users can read own user vocabulary" on public.vocabulary;
-- Single SELECT policy: app vocabulary OR own user vocabulary (fixes multiple permissive + auth init)
create policy "Read app or own user vocabulary"
  on public.vocabulary for select
  using (
    source = 'app'
    or (source = 'user' and created_by = (select auth.uid()))
  );

drop policy if exists "Users can insert user vocabulary" on public.vocabulary;
create policy "Users can insert user vocabulary"
  on public.vocabulary for insert
  with check (source = 'user' and created_by = (select auth.uid()));

drop policy if exists "Users can update own user vocabulary" on public.vocabulary;
create policy "Users can update own user vocabulary"
  on public.vocabulary for update
  using (source = 'user' and created_by = (select auth.uid()));

drop policy if exists "Users can delete own user vocabulary" on public.vocabulary;
create policy "Users can delete own user vocabulary"
  on public.vocabulary for delete
  using (source = 'user' and created_by = (select auth.uid()));

-- user_vocabulary
drop policy if exists "Users can view own user_vocabulary" on public.user_vocabulary;
create policy "Users can view own user_vocabulary"
  on public.user_vocabulary for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own user_vocabulary" on public.user_vocabulary;
create policy "Users can insert own user_vocabulary"
  on public.user_vocabulary for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own user_vocabulary" on public.user_vocabulary;
create policy "Users can update own user_vocabulary"
  on public.user_vocabulary for update
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own user_vocabulary" on public.user_vocabulary;
create policy "Users can delete own user_vocabulary"
  on public.user_vocabulary for delete
  using ((select auth.uid()) = user_id);

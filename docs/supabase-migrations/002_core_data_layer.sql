-- Core data layer: languages, user_languages, vocabulary, user_vocabulary.
-- Run in Supabase Dashboard → SQL Editor after 001_profiles.sql.
-- Supports language pairs: EN↔RU, EN↔SR (Serbian in Latin script).

-- Reference: supported languages
create table if not exists public.languages (
  code text primary key,
  name text not null
);

insert into public.languages (code, name) values
  ('en', 'English'),
  ('ru', 'Russian'),
  ('sr', 'Serbian (Latin)')
on conflict (code) do nothing;

-- User's chosen language pairs (e.g. learning Russian with native English)
create table if not exists public.user_languages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  learning_code text not null references public.languages (code),
  native_code text not null references public.languages (code),
  created_at timestamptz default now() not null,
  unique (user_id, learning_code, native_code),
  check (learning_code <> native_code)
);

create index idx_user_languages_user_id on public.user_languages (user_id);

alter table public.user_languages enable row level security;

create policy "Users can view own user_languages"
  on public.user_languages for select
  using (auth.uid() = user_id);

create policy "Users can insert own user_languages"
  on public.user_languages for insert
  with check (auth.uid() = user_id);

create policy "Users can update own user_languages"
  on public.user_languages for update
  using (auth.uid() = user_id);

create policy "Users can delete own user_languages"
  on public.user_languages for delete
  using (auth.uid() = user_id);

-- Vocabulary: app library + user-created words (word/translation pair per language pair)
create table if not exists public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  translation text not null,
  language_from text not null references public.languages (code),
  language_to text not null references public.languages (code),
  source text not null check (source in ('app', 'user')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz default now() not null,
  check (language_from <> language_to)
);

create index idx_vocabulary_lang_pair on public.vocabulary (language_from, language_to);
create index idx_vocabulary_created_by on public.vocabulary (created_by);

alter table public.vocabulary enable row level security;

-- Everyone can read app library; users can read their own user-created words
create policy "Anyone can read app vocabulary"
  on public.vocabulary for select
  using (source = 'app');

create policy "Users can read own user vocabulary"
  on public.vocabulary for select
  using (source = 'user' and created_by = auth.uid());

create policy "Users can insert user vocabulary"
  on public.vocabulary for insert
  with check (source = 'user' and created_by = auth.uid());

create policy "Users can update own user vocabulary"
  on public.vocabulary for update
  using (source = 'user' and created_by = auth.uid());

create policy "Users can delete own user vocabulary"
  on public.vocabulary for delete
  using (source = 'user' and created_by = auth.uid());

-- User's personal library: links user to vocabulary with FSRS state (ts-fsrs Card fields)
create table if not exists public.user_vocabulary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vocabulary_id uuid not null references public.vocabulary (id) on delete cascade,
  state smallint not null default 0,
  due timestamptz not null default now(),
  stability double precision not null default 0,
  difficulty double precision not null default 0,
  elapsed_days integer not null default 0,
  scheduled_days integer not null default 0,
  learning_steps integer not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  last_review timestamptz,
  created_at timestamptz default now() not null,
  unique (user_id, vocabulary_id)
);

create index idx_user_vocabulary_user_id on public.user_vocabulary (user_id);
create index idx_user_vocabulary_due on public.user_vocabulary (user_id, due);

alter table public.user_vocabulary enable row level security;

create policy "Users can view own user_vocabulary"
  on public.user_vocabulary for select
  using (auth.uid() = user_id);

create policy "Users can insert own user_vocabulary"
  on public.user_vocabulary for insert
  with check (auth.uid() = user_id);

create policy "Users can update own user_vocabulary"
  on public.user_vocabulary for update
  using (auth.uid() = user_id);

create policy "Users can delete own user_vocabulary"
  on public.user_vocabulary for delete
  using (auth.uid() = user_id);

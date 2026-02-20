-- Vocabulary score: one row per (user, vocabulary) for progress and notifications.
-- Direction is implied by vocabulary (language_from, language_to).
-- Run after 002_core_data_layer.sql (and 001). Order: 001 → 002 → … → 007 → 009.

create table if not exists public.vocabulary_score (
  user_id uuid not null references auth.users (id) on delete cascade,
  vocabulary_id uuid not null references public.vocabulary (id) on delete cascade,
  score smallint not null default 0 check (score >= 0 and score <= 100),
  last_exercise_at timestamptz not null default now(),
  practised_dates_count integer not null default 0 check (practised_dates_count >= 0),
  learnt boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  primary key (user_id, vocabulary_id)
);

create index idx_vocabulary_score_user_id on public.vocabulary_score (user_id);
create index idx_vocabulary_score_last_exercise on public.vocabulary_score (user_id, last_exercise_at desc);

alter table public.vocabulary_score enable row level security;

create policy "Users can view own vocabulary_score"
  on public.vocabulary_score for select
  using (auth.uid() = user_id);

create policy "Users can insert own vocabulary_score"
  on public.vocabulary_score for insert
  with check (auth.uid() = user_id);

create policy "Users can update own vocabulary_score"
  on public.vocabulary_score for update
  using (auth.uid() = user_id);

create policy "Users can delete own vocabulary_score"
  on public.vocabulary_score for delete
  using (auth.uid() = user_id);

comment on table public.vocabulary_score is 'Derived score and last-exercise per (user, vocabulary). Updated after each study session. Formula C: 0–50 learning, 50–100 learnt.';

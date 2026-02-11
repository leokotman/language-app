-- Query performance: indexes for app vocabulary and user_vocabulary queries.
-- Run after 006_performance_fixes.sql.
--
-- Context: In Supabase "Query performance", many long-running queries are platform
-- internals (pg_timezone_names, dashboard schema CTEs, backups, set_config, etc.)
-- and cannot be changed. This migration adds indexes only for our app's queries:
--
-- 1) listVocabulary(lang_from, lang_to, source?) ORDER BY word
-- 2) listAllAppVocabulary() → WHERE source='app' ORDER BY language_from, language_to, word
-- 3) listUserVocabulary(userId) → WHERE user_id=? ORDER BY created_at DESC

-- Vocabulary: filter by language pair + source, order by word (Library / Dictionary)
create index if not exists idx_vocabulary_lang_source_word
  on public.vocabulary (language_from, language_to, source, word);

-- Vocabulary: filter by source, order by language_from, language_to, word (offline prefetch)
create index if not exists idx_vocabulary_source_lang_word
  on public.vocabulary (source, language_from, language_to, word);

-- user_vocabulary: filter by user_id, order by created_at DESC (personal library list)
create index if not exists idx_user_vocabulary_user_created_at
  on public.user_vocabulary (user_id, created_at desc);

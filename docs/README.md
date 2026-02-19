# Docs index

**Start here:** `HANDOFF.md` (current state, next steps) and `AI agent instructions.md` (git workflow, when to load what).

| Doc                             | Purpose                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| **HANDOFF.md**                  | Current state, session summary, suggestions, priority. Update after each session.     |
| **AI agent instructions.md**    | Git workflow, context to load, feature workflow, code style. Main entry for AI.       |
| **SUPABASE_SETUP.md**           | One-time: env, migrations order, run 001→002→…→007.                                   |
| **CHANGELOG.md**                | Release history. Use script or GitHub Action to append (see CHANGELOG_AUTOMATION.md). |
| **CHANGELOG_AUTOMATION.md**     | How to run `npm run changelog` and how the update-changelog workflow works.           |
| **OFFLINE.md**                  | Offline cache, how to test offline, debug logs.                                       |
| **INPUT_SANITIZATION.md**       | Sanitize all user text; limits and usage.                                             |
| **SEED_AND_LOOKUP_STRATEGY.md** | Aligned triples (EN/RU/SR), store-first lookup.                                       |
| **DICTIONARY_PLAN.md**          | Dictionary approach and implementation status.                                        |
| **TECH_EVALUATION.md**          | One-time tech assessment; reference for order of work.                                |
| **archive/**                    | Old exports (roadmap, structure); load only when needed.                              |

**Cursor:** `.cursor/rules/` (code style, page layout), `.cursor/commands/create-new-feature.md` (workflow for new features).

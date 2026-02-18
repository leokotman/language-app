# AI agent instructions

You are a senior engineer working on a language learning PWA (React, TypeScript, Supabase). Keep this file short; current state and next steps live in **`docs/HANDOFF.md`**, release history in **`docs/CHANGELOG.md`**.

---

## Git workflow

- **Branch per feature/fix.** From `main` when starting a session (after user merged and pulled); otherwise from the **most recent branch**. Next task number from HANDOFF §4 or §6.
- **Branch name:** `{type}/{project_code}-{task_number}{sep}{title}` — e.g. `feat/lang-014-tts-listening`. Type: `feat`, `fix`, `chore`, `hotfix`, `release`. Project code + zero-padded number **required** (commit-msg hook adds scope).
- **Commits:** Conventional style; one logical change per commit. Hook adds scope from branch name.
- **After push:** Ask user to open PR, or continue with next feature from latest branch. Do not assume `main` is up to date.

## Context to load

**Always:** `docs/HANDOFF.md` (state, summary, next steps, priority), `docs/SUPABASE_SETUP.md` when touching DB/migrations.

**When summarizing work:** Update `docs/CHANGELOG.md`; see `docs/CHANGELOG_AUTOMATION.md` for script and Action.

**When needed:** `docs/CHANGELOG.md`, `docs/CHANGELOG_AUTOMATION.md`, `docs/TECH_EVALUATION.md`, `docs/archive/` (historical roadmap, structure, overview).

## Features from HANDOFF

When the user says **proceed with plans** or **implement next from HANDOFF** (or builds a feature from §4 Suggestions / §5 Priority): follow **`.cursor/commands/create-new-feature.md`** step by step. Use feature name and requirements from HANDOFF or the message. Reply with "Step N️⃣ started" / "Step N️⃣ finished". For small tasks (e.g. trim/max length, "I've run the migration" button), apply only the steps that fit.

## Code & work style

1. **Cursor rules:** `.cursor/rules/` — naming, helpers, page layout, clean code. Follow them for matching files.
2. **Commits:** One change per commit; message describes that single change.
3. TypeScript only; no `any`. Security, errors, performance, a11y, mobile-friendly where relevant.
4. **After commits:** Update HANDOFF (session summary, current state, suggestions/priority). On release/milestone, update CHANGELOG.
5. When in doubt, ask.

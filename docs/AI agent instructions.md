# AI agent instructions

You are a senior software engineer with a passion for building user-friendly and efficient web applications. You are currently working on a language learning app that allows users to learn and practice languages.

## Git workflow (branching, commits, push, PR)

Follow this workflow so every feature/fix is traceable.

### 1. Branch naming and creation

- **Create a new branch for each feature or fix.** Before creating a new branch, **check git status and branch history** to see which branch is the most recent (e.g. `git branch -v` or `git for-each-ref --sort=-committerdate refs/heads/`), then create the new branch **from that most recent branch**. Use `main` only when the user has merged the previous PR and pulled `main`, or when starting the first feature in a session.
- **Branch name format** (must match `.git/hooks/commit-msg` so commit messages get the scope):
  - `{type}/{project_code}-{task_number}{separator}{task-title}`
  - **Type:** one of `feat`, `chore`, `fix`, `hotfix`, `release`.
  - **Project code:** letters only (e.g. `lang`, `prj`).
  - **Task number:** zero-padded from `001`, increment by 1 for each new branch (e.g. `001`, `002`, `003`).
  - **Separator** between `{project_code}-{task_number}` and task title: one of `-`, `_`, `--`, `__`.
  - **Task title:** short kebab-case description (e.g. `add-seeds`, `fix-infinite-loop`).

**Examples:** `feat/lang-001-add-seeds`, `fix/lang-002-fix-loop`, `chore/lang-003-update-deps`.

When starting the first feature in a session, create from `main` (e.g. `feat/lang-001-add-seeds`). For each next feature/fix, **identify the most recent branch** (by checking branch list / commit dates), then create the new branch from that one (e.g. from `feat/lang-001-add-seeds` create `feat/lang-002-another-feature`).

### 2. Commits in the branch

- Make commits with conventional-commit style; the **commit-msg hook** will add the scope from the branch name.
- Use: `git commit -m 'feat: update seeds'` (or `git ci -m 'feat: update seeds'` if aliased). The hook rewrites it to e.g. `feat(lang-001): update seeds` when on `feat/lang-001-add-seeds`.
- One logical change per commit; keep messages focused (see “Code & work style” below).

### 3. Push and PR — ask the user

- **Push the branch** with `git push -u origin <branch>` (or the user's usual push command). There is no automatic PR creation.
- **Then either:**
  - **Ask the user to review the PR** (they will create/open the PR manually, review, and merge into `main` when ready), or
  - **Proceed with the next feature:** check which branch is most recent (e.g. `git branch -v` or sort by committer date), create the new branch **from that branch** (not necessarily the one you're on, not `main` unless it's up to date), increment the task number, and continue work.
- Do not assume `main` is up to date. Prefer creating the next branch from the **most recent branch** (by checking git status/branch list) unless the user has merged and pulled `main`.

**Suggested local alias (for maintainer):** `git config --global alias.pr 'pull --rebase'` — after merging a PR, run `git checkout main && git pr` to update `main`, then new branches can be created from `main` again if desired.

## Context for next iterations

**This file is the main entry point.** When continuing work on the project, the user can point you to this file only. You should then load the following docs for full context:

- **Handoff** — `docs/HANDOFF_SESSION_SUMMARY.md`: what was done last, current state, known issues, and suggested next steps.
- **Roadmap** — `docs/ai-chat-code-2026-02-05T16-38-08-153Z-updated-roadmap.txt`: phased plan (weeks/milestones).
- **Project overview** — `docs/ai-chat-code-2026-02-05T16-45-46-372Z-project-overview-for-ai.txt`: spec, stack, constraints.
- **Project structure** — `docs/ai-chat-code-2026-02-05T16-39-52-440Z-project-structure(updated)).txt`: folder and file layout.

Project setup details:
- Supabase: `docs/SUPABASE_SETUP.md`
- Previous steps and open issues: `docs/HANDOFF_SESSION_SUMMARY.md`

## Code & work style

1. **Clean code and structure:** Follow the **Cursor rules** in `.cursor/rules/` when editing matching files: they define naming (descriptive names, no single-letter variables except loop `i`/`j`), extraction of helpers into `*.helpers.ts`, and page layout (one folder per page with `PageName.tsx`, `*.models.ts`, `*.constants.ts`, `*.helpers.ts`; barrel `index.ts` for `@/pages/PageName`). In addition, prefer readable names over cryptic ones; keep functions small and focused.
2. **Commits: one logical change per commit; one change per commit message.** Prefer several small, focused commits over one large commit. Each commit does exactly one thing (e.g. “Add dynamic placeholders for add-word form” or “Fix library filter by language pair”). The commit message must describe that single change: avoid "X and Y" or "X, Y" in the subject — if there are two changes, make two commits. A commit may touch multiple files as long as they implement that one change. This keeps history readable and makes reverts and code review easier.
3. Use frontend and backend best practices.
4. Use TypeScript for all code: no `any` types.
5. Always think about secure connection to the API and database, and safe handling of users’ data.
6. Consider edge cases and errors, and how to handle them.
7. Always think about performance and scalability.
8. Where possible, suggest mobile-friendly components and UI.
9. Use a11y best practices where possible and needed (texts, user interactions, layout changes).
10. **Handoff updates:** After each commit (or after a batch of commits in one session), update `docs/HANDOFF_SESSION_SUMMARY.md`: (a) append the new commit(s) to the "Commits" / session list, (b) update "Current state" so it accurately describes what exists in the repo, (c) update "Session summary (latest)" with what was just done, (d) adjust "Suggestions for next steps" if priorities or status changed. This keeps the next session or agent from missing recent work.
11. In case of any doubt about the solution — ask before proceeding.

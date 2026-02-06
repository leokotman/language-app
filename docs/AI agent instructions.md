# AI agent instructions

You are a senior software engineer with a passion for building user-friendly and efficient web applications. You are currently working on a language learning app that allows users to learn and practice languages.

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

1. **Commits: one logical change per commit; one change per commit message.** Prefer several small, focused commits over one large commit. Each commit does exactly one thing (e.g. “Add dynamic placeholders for add-word form” or “Fix library filter by language pair”). The commit message must describe that single change: avoid "X and Y" or "X, Y" in the subject — if there are two changes, make two commits. A commit may touch multiple files as long as they implement that one change. This keeps history readable and makes reverts and code review easier.
2. Use frontend and backend best practices.
3. Use TypeScript for all code: no `any` types.
4. Always think about secure connection to the API and database, and safe handling of users’ data.
5. Consider edge cases and errors, and how to handle them.
6. Always think about performance and scalability.
7. Where possible, suggest mobile-friendly components and UI.
8. Use a11y best practices where possible and needed (texts, user interactions, layout changes).
9. After each commit, update the handoff summary so it reflects the completed steps.
10. In case of any doubt about the solution — ask before proceeding.

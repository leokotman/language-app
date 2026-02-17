# Changelog automation

The repo can update `docs/CHANGELOG.md` from commits in two ways: a **local script** (before or after merge) and an optional **GitHub Action** (on merge to `main`).

---

## Do I need to set up anything on GitHub?

**No.** As soon as the file `.github/workflows/update-changelog.yml` is in your repo and pushed to GitHub, GitHub Actions picks it up automatically. You don’t create the workflow in the GitHub UI — the YAML file *is* the workflow. Merge or push it to `main` once, and from then on every push to `main` (including every PR merge) will run it.

---

## 1. Script (run locally)

**Generate changelog entries** from commits on your branch (vs `main`):

```bash
node scripts/changelog-from-branch.mjs
```

- Uses `main..HEAD` by default. Pass a base ref to change it:  
  `node scripts/changelog-from-branch.mjs origin/main`
- Output is **Keep a Changelog** style (Added / Fixed / Changed) from conventional commit subjects (`feat(lang-012): ...`, `fix: ...`, etc.).
- **Paste** the output into `docs/CHANGELOG.md` under `## [Unreleased]`, or use append mode (see below).

**Append directly** into `docs/CHANGELOG.md` under `## [Unreleased]`:

```bash
node scripts/changelog-from-branch.mjs --append
```

Optional base ref:  
`node scripts/changelog-from-branch.mjs --append origin/main`

**Explicit commit range** (e.g. for CI or after a merge):

```bash
node scripts/changelog-from-branch.mjs --range <from-ref> <to-ref> [--append]
```

Example (commits just merged to main):

```bash
node scripts/changelog-from-branch.mjs --range main~1 main --append
```

---

## 2. GitHub Action (on merge to main)

Workflow: **`.github/workflows/update-changelog.yml`**

- **Trigger:** Every **push to `main`**. When you merge a PR into `main`, GitHub does a push to `main` — so the workflow runs automatically after each merge. No extra trigger or “on PR merge” setting is needed.
- **Skips:** When the push was made by `github-actions[bot]` (avoids loop after the workflow pushes the CHANGELOG update).
- **Does:** Takes the commits in that push (`event.before..event.after`), formats them, and **appends** under `## [Unreleased]` in `docs/CHANGELOG.md`, then commits and pushes with message `chore: update CHANGELOG [skip ci]`.

**Requirements:**

- `docs/CHANGELOG.md` must exist and contain a line `## [Unreleased]`.
- Commits should follow conventional style (`feat:`, `fix:`, `chore:`, etc.) so they map to Added / Fixed / Changed.

**Merge style:** If you use **Squash and merge**, the single squashed commit message is what gets parsed — use a conventional message (e.g. `feat(lang-012): add flashcard`) when squashing for a clean CHANGELOG line. With a normal **Merge commit**, the merge commit message (e.g. "Merge PR #14") is used and may appear as a generic "Changed" entry.

**To disable:** Remove or disable the workflow in `.github/workflows/update-changelog.yml`.

---

## 3. Suggested workflow

- **Before merging a PR:** Run `node scripts/changelog-from-branch.mjs` and paste the block into the PR description or into `CHANGELOG.md` in the same PR.
- **After merging:** If the Action is enabled, it will append the merged commits to `[Unreleased]` automatically. Otherwise, run the script with `--range main~1 main --append` (or the correct refs) and push.

When you cut a release, rename `[Unreleased]` to e.g. `[0.2.0] - 2026-02-17` and add a new empty `## [Unreleased]` section.

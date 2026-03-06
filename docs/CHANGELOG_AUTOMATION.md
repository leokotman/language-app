# Changelog automation

**Script (local):** `npm run changelog` prints Keep-a-Changelog-style entries from commits on your branch (vs `main`). `npm run changelog:append` appends them under `## [Unreleased]` in `docs/CHANGELOG.md`. Optional base: `node scripts/changelog-from-branch.mjs origin/main [--append]`. To turn existing plain `(#NN)` and "Merge pull request #NN" lines into PR links in the whole file, run once: `node scripts/changelog-from-branch.mjs --linkify-existing`.

**Links:** Each entry is written with clickable links when the repo URL is available: any `(#NN)` in the commit message becomes a link to the PR (e.g. `([#32](https://github.com/owner/repo/pull/32))`), and a commit link is appended (e.g. `([d1bb15b](https://github.com/owner/repo/commit/...))`). The script uses `GITHUB_REPOSITORY` in CI (set by GitHub Actions) or infers the repo from `git remote get-url origin` when run locally.

**GitHub Action:** `.github/workflows/update-changelog.yml` runs on every push to `main`. Appends that push’s commits under `## [Unreleased]`, then commits and pushes with `[skip ci]`. Requires `## [Unreleased]` in CHANGELOG. Squash-merge: use a conventional message (e.g. `feat(lang-012): add flashcard`) or include the PR number (e.g. `KAN-42: home page real data (#32)`) for a clean line with PR link. To disable: remove or disable the workflow file.

**Release:** Rename `[Unreleased]` to e.g. `[0.2.0] - 2026-02-18` and add a new `## [Unreleased]` section.

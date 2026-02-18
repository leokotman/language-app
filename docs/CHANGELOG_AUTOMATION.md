# Changelog automation

**Script (local):** `npm run changelog` prints Keep-a-Changelog-style entries from commits on your branch (vs `main`). `npm run changelog:append` appends them under `## [Unreleased]` in `docs/CHANGELOG.md`. Optional base: `node scripts/changelog-from-branch.mjs origin/main [--append]`.

**GitHub Action:** `.github/workflows/update-changelog.yml` runs on every push to `main`. Appends that push’s commits under `## [Unreleased]`, then commits and pushes with `[skip ci]`. Requires `## [Unreleased]` in CHANGELOG. Squash-merge: use a conventional message (e.g. `feat(lang-012): add flashcard`) for a clean line. To disable: remove or disable the workflow file.

**Release:** Rename `[Unreleased]` to e.g. `[0.2.0] - 2026-02-18` and add a new `## [Unreleased]` section.

# Changelog

All notable changes to the Language App are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Fix/lang 018 multiple choice same language (#24)


### Changed

- add TTS voices limitations and guidance (TTS_VOICES.md)

### Changed

- Chore/lang 017 increase coverage (#23)

### Changed

- Chore/lang 016 coverage improvements (#22)

### Changed

- Add CodeQL analysis workflow configuration

### Changed

- **lang-016:** add test coverage config, script, and docs
- **lang-016:** test: add unit tests for importExport, LibraryPage.helpers, StudyPage.helpers, ConfirmDialog
- **lang-016:** refactor: split LibraryPage and DictionaryPage into subcomponents
- **lang-016:** add coverage target %, custom reporter, and unit tests for errors, auth, theme, ProtectedRoute
- Merge pull request #21 from leokotman/chore/lang-016-coverage-refactor

### Changed

- **hooks:** document useCallback empty deps in useAudioRecorder
- **study:** add EXERCISE_TYPE_SUBTITLES for card header
- **study:** add StudyPage layout components (SignInAlert, StudyLoading, NoCardsDue, StudySetup, SessionComplete)
- **study:** add StudyPage card block components and index
- **study:** refactor StudyPage to use subcomponents, condition constants, and memoized handlers
- Merge pull request #20 from leokotman/chore/refactor-study-page

### Added

- **lang-015:** feat(study): add speaking exercise with record, play back, and self-rate
- **lang-015:** docs: update HANDOFF for lang-015 (speaking recording, next STT)

### Changed

- **lang-015:** add SPEECH_PLAN doc, reference in AI instructions; fix package.json indent
- Merge pull request #19 from leokotman/feat/lang-015-speaking-recording

### Added

- **lang-014:** feat(study): add reverse multiple choice and listening (TTS) exercise types
- **lang-014:** docs: update HANDOFF for lang-014 (session summary, priority)

### Changed

- Merge pull request #18 from leokotman/feat/lang-014-reverse-multiple-choice-tts

### Changed

- **lang-014:** slim and consolidate docs and cursor instructions
- Merge pull request #17 from leokotman/chore/lang-014-docs-slim-and-consolidate

### Added

- **lang-013:** add data-testid to Study page for E2E
- **lang-013:** add E2E tests for study session flow
- **lang-013:** docs: update HANDOFF with lang-013 and next task number
- **lang-013:** docs: update HANDOFF with lang-013 study E2E fixes

### Fixed

- **lang-013:** show Session complete view after last card instead of setup
- **lang-013:** study E2E resilient loop, wait for Reveal first, 60s timeout

### Changed

- Merge pull request #16 from leokotman/feat/lang-013-e2e-study-session

### Fixed

- github action

(Entries are added here by the changelog script or the GitHub Action on merge to `main`.)

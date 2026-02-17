#!/usr/bin/env node
/**
 * Generate changelog entries from commits on the current branch (vs main) or a range.
 * Usage:
 *   node scripts/changelog-from-branch.mjs [baseRef]
 *   node scripts/changelog-from-branch.mjs --append [baseRef]
 *   node scripts/changelog-from-branch.mjs --range <fromRef> <toRef> [--append]
 * Default baseRef: main. With --range: use explicit from..to (e.g. for GitHub Actions on push).
 * With --append: insert entries into docs/CHANGELOG.md under ## [Unreleased].
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

const args = process.argv.slice(2)
const append = args.includes('--append')
const rangeIdx = args.indexOf('--range')
let baseRef = 'main'
let headRef = 'HEAD'
if (rangeIdx !== -1) {
  baseRef = args[rangeIdx + 1] ?? 'main'
  headRef = args[rangeIdx + 2] ?? 'HEAD'
} else {
  const rest = args.filter((a) => a !== '--append')
  baseRef = rest[0] || 'main'
  headRef = 'HEAD'
}

// Conventional commit type -> Keep a Changelog section
const TYPE_TO_SECTION = {
  feat: 'Added',
  fix: 'Fixed',
  chore: 'Changed',
  docs: 'Changed',
  refactor: 'Changed',
  perf: 'Changed',
  test: 'Changed',
  build: 'Changed',
  ci: 'Changed',
}

function getCommits(base, head) {
  const out = execSync(`git log ${base}..${head} --format=%s`, {
    cwd: repoRoot,
    encoding: 'utf-8',
  })
  return out
    .trim()
    .split('\n')
    .filter(Boolean)
    .reverse()
}

function parseSubject(subject) {
  // feat(lang-012): add flashcard  OR  fix: something
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/)
  if (!match) return { type: 'other', scope: null, description: subject }
  const [, type, scope, description] = match
  return { type, scope, description }
}

function formatEntries(commits) {
  const bySection = {}
  for (const subject of commits) {
    const { type, scope, description } = parseSubject(subject)
    const section = TYPE_TO_SECTION[type] || 'Changed'
    if (!bySection[section]) bySection[section] = []
    const scopePrefix = scope ? `**${scope}:** ` : ''
    bySection[section].push(`- ${scopePrefix}${description}`)
  }
  const order = ['Added', 'Fixed', 'Changed']
  const lines = []
  for (const section of order) {
    if (bySection[section]?.length) {
      lines.push(`### ${section}`)
      lines.push('')
      for (const entry of bySection[section]) lines.push(entry)
      lines.push('')
    }
  }
  if (lines.length === 0) lines.push('- (no conventional commits in range)', '')
  return lines.join('\n')
}

function main() {
  const commits = getCommits(baseRef, headRef)
  const markdown = formatEntries(commits)

  if (!append) {
    console.log(`\nChangelog entries (${baseRef}..${headRef}, ${commits.length} commit(s)):\n`)
    console.log(markdown)
    return
  }

  const changelogPath = join(repoRoot, 'docs', 'CHANGELOG.md')
  let content
  try {
    content = readFileSync(changelogPath, 'utf-8')
  } catch (e) {
    console.error('docs/CHANGELOG.md not found. Create it with an ## [Unreleased] section.')
    process.exit(1)
  }

  const unreleased = '## [Unreleased]'
  const idx = content.indexOf(unreleased)
  if (idx === -1) {
    console.error('docs/CHANGELOG.md must contain ## [Unreleased]')
    process.exit(1)
  }

  const insertPoint = idx + unreleased.length
  const before = content.slice(0, insertPoint)
  const after = content.slice(insertPoint)
  const newContent = before + '\n\n' + markdown.trim() + '\n' + after
  writeFileSync(changelogPath, newContent)
  console.log(`Appended ${commits.length} commit(s) to docs/CHANGELOG.md under [Unreleased].`)
}

main()

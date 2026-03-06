#!/usr/bin/env node
/**
 * Generate changelog entries from commits on the current branch (vs main) or a range.
 * Usage:
 *   node scripts/changelog-from-branch.mjs [baseRef]
 *   node scripts/changelog-from-branch.mjs --append [baseRef]
 *   node scripts/changelog-from-branch.mjs --range <fromRef> <toRef> [--append]
 *   node scripts/changelog-from-branch.mjs --linkify-existing
 * Default baseRef: main. With --range: use explicit from..to (e.g. for GitHub Actions on push).
 * With --append: insert entries into docs/CHANGELOG.md under ## [Unreleased].
 * With --linkify-existing: rewrite docs/CHANGELOG.md so every (#NN) and "Merge pull request #NN" become PR links.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

const args = process.argv.slice(2);
const append = args.includes("--append");
const linkifyExisting = args.includes("--linkify-existing");
const rangeIdx = args.indexOf("--range");
let baseRef = "main";
let headRef = "HEAD";
if (rangeIdx !== -1) {
  baseRef = args[rangeIdx + 1] ?? "main";
  headRef = args[rangeIdx + 2] ?? "HEAD";
} else {
  const rest = args.filter((a) => a !== "--append");
  baseRef = rest[0] || "main";
  headRef = "HEAD";
}

// Conventional commit type -> Keep a Changelog section
const TYPE_TO_SECTION = {
  feat: "Added",
  fix: "Fixed",
  chore: "Changed",
  docs: "Changed",
  refactor: "Changed",
  perf: "Changed",
  test: "Changed",
  build: "Changed",
  ci: "Changed",
};

function getRepoBaseUrl() {
  if (process.env.GITHUB_REPOSITORY) {
    return `https://github.com/${process.env.GITHUB_REPOSITORY}`;
  }
  const out = execSync("git remote get-url origin", {
    cwd: repoRoot,
    encoding: "utf-8",
  });
  const url = out.trim();
  const match = url.match(/github\.com[:/]([^/]+\/[^/.]+)(?:\.git)?$/);
  return match ? `https://github.com/${match[1]}` : null;
}

function getCommits(base, head) {
  const out = execSync(
    `git log ${base}..${head} --format=%H%x09%s`,
    { cwd: repoRoot, encoding: "utf-8" },
  );
  return out
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf("\t");
      const sha = tab === -1 ? line : line.slice(0, tab);
      const subject = tab === -1 ? "" : line.slice(tab + 1);
      return { sha, shortSha: sha.slice(0, 7), subject };
    })
    .reverse();
}

function parseSubject(subject) {
  // feat(lang-012): add flashcard  OR  fix: something
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
  if (!match) return { type: "other", scope: null, description: subject };
  const [, type, scope, description] = match;
  return { type, scope, description };
}

function linkifyDescription(description, repoBaseUrl) {
  if (!repoBaseUrl) return description;
  return description.replace(
    /\(#(\d+)\)/g,
    (_, n) => `([#${n}](${repoBaseUrl}/pull/${n}))`,
  );
}

function formatEntries(commits, repoBaseUrl) {
  const bySection = {};
  for (const { sha, shortSha, subject } of commits) {
    const { type, scope, description } = parseSubject(subject);
    const section = TYPE_TO_SECTION[type] || "Changed";
    if (!bySection[section]) bySection[section] = [];
    const scopePrefix = scope ? `**${scope}:** ` : "";
    const linkified = linkifyDescription(description, repoBaseUrl);
    const commitLink = repoBaseUrl
      ? ` ([${shortSha}](${repoBaseUrl}/commit/${sha}))`
      : "";
    bySection[section].push(`- ${scopePrefix}${linkified}${commitLink}`);
  }
  const order = ["Added", "Fixed", "Changed"];
  const lines = [];
  for (const section of order) {
    if (bySection[section]?.length) {
      lines.push(`### ${section}`);
      lines.push("");
      for (const entry of bySection[section]) lines.push(entry);
      lines.push("");
    }
  }
  if (lines.length === 0)
    lines.push("- (no conventional commits in range)", "");
  return lines.join("\n");
}

function linkifyExistingChangelog(repoBaseUrl) {
  const changelogPath = join(repoRoot, "docs", "CHANGELOG.md");
  let content = readFileSync(changelogPath, "utf-8");
  // (#NN) -> ([#NN](url)) only when not already a link (avoid double-wrap)
  content = content.replace(
    /\(#(\d+)\)(?!\])/g,
    (_, n) => `([#${n}](${repoBaseUrl}/pull/${n}))`,
  );
  // "Merge pull request #NN from" -> "Merge pull request [#NN](url) from"
  content = content.replace(
    /Merge pull request #(\d+) from/g,
    (_, n) => `Merge pull request [#${n}](${repoBaseUrl}/pull/${n}) from`,
  );
  writeFileSync(changelogPath, content);
  console.log("Linkified existing PR references in docs/CHANGELOG.md.");
}

function main() {
  if (linkifyExisting) {
    const repoBaseUrl = getRepoBaseUrl();
    if (!repoBaseUrl) {
      console.error("Could not determine repo URL (git remote or GITHUB_REPOSITORY).");
      process.exit(1);
    }
    linkifyExistingChangelog(repoBaseUrl);
    return;
  }

  const commits = getCommits(baseRef, headRef);
  const repoBaseUrl = getRepoBaseUrl();
  const markdown = formatEntries(commits, repoBaseUrl);

  if (!append) {
    console.log(
      `\nChangelog entries (${baseRef}..${headRef}, ${commits.length} commit(s)):\n`,
    );
    console.log(markdown);
    return;
  }

  const changelogPath = join(repoRoot, "docs", "CHANGELOG.md");
  let content;
  try {
    content = readFileSync(changelogPath, "utf-8");
  } catch (e) {
    console.error(
      "docs/CHANGELOG.md not found. Create it with an ## [Unreleased] section.",
    );
    process.exit(1);
  }

  const unreleased = "## [Unreleased]";
  const idx = content.indexOf(unreleased);
  if (idx === -1) {
    console.error("docs/CHANGELOG.md must contain ## [Unreleased]");
    process.exit(1);
  }

  const insertPoint = idx + unreleased.length;
  const before = content.slice(0, insertPoint);
  const after = content.slice(insertPoint);
  const newContent = before + "\n\n" + markdown.trim() + "\n" + after;
  writeFileSync(changelogPath, newContent);
  console.log(
    `Appended ${commits.length} commit(s) to docs/CHANGELOG.md under [Unreleased].`,
  );
}

main();

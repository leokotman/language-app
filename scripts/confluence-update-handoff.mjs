#!/usr/bin/env node
/**
 * Push section 2 of the Confluence "Project History" page from a local Markdown file.
 * Usage: node scripts/confluence-update-handoff.mjs [path/to/file.md]
 * If no path given, uses docs/SESSION_SUMMARY.md. Section 1 (project history) is left unchanged.
 * Requires: ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN in .env
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
config({ path: resolve(root, '.env') });

const SITE = 'https://epam-team-oc64db17.atlassian.net';
const CONFLUENCE_PAGE_ID = '2162689';
const DEFAULT_INPUT = resolve(root, 'docs', 'SESSION_SUMMARY.md');
// Must match the Confluence page heading for section 2 (HTML-encoded)
const SESSION_SECTION_MARKER = '<h2>2. Session summary &amp; handoff (full)</h2>';

const email = process.env.ATLASSIAN_EMAIL;
const token = process.env.ATLASSIAN_API_TOKEN;
if (!email || !token) {
  console.error('Missing ATLASSIAN_EMAIL or ATLASSIAN_API_TOKEN in .env');
  process.exit(1);
}

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`,
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Markdown to Confluence storage HTML (headings, lists, tables, bold, code) */
function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let inList = false;
  let inTable = false;
  let tableRows = [];

  const flushList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };
  const flushTable = () => {
    if (!inTable || tableRows.length === 0) return;
    out.push('<table><tbody>');
    tableRows.forEach((row, idx) => {
      const tag = idx === 0 && row.some(c => /^[*#]?\s*[A-Za-z]/.test(c)) ? 'th' : 'td';
      const cells = row.map(c => `<${tag}>${escapeHtml(c.trim())}</${tag}>`).join('');
      out.push('<tr>' + cells + '</tr>');
    });
    out.push('</tbody></table>');
    tableRows = [];
    inTable = false;
  };

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('### ')) {
      flushList();
      flushTable();
      out.push('<h3>' + escapeHtml(t.slice(4)) + '</h3>');
      continue;
    }
    if (t.startsWith('# ') || t.startsWith('## ')) {
      flushList();
      flushTable();
      out.push('<h2>' + escapeHtml(t.replace(/^#+\s*/, '')) + '</h2>');
      continue;
    }
    if (/^\|.+\|$/.test(t)) {
      flushList();
      const cells = t.split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
      if (cells.length) {
        inTable = true;
        tableRows.push(cells);
      }
      continue;
    }
    if (inTable) flushTable();
    if (t.startsWith('- ') || t.startsWith('* ')) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      const content = t.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      out.push('<li>' + escapeHtml(content) + '</li>');
      continue;
    }
    if (t === '---') {
      flushList();
      flushTable();
      out.push('<hr/>');
      continue;
    }
    if (t === '') {
      flushList();
      flushTable();
      continue;
    }
    flushList();
    flushTable();
    const para = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');
    out.push('<p>' + escapeHtml(para) + '</p>');
  }
  flushList();
  flushTable();
  return out.join('\n');
}

async function main() {
  const inputPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : DEFAULT_INPUT;
  let mdContent;
  try {
    mdContent = readFileSync(inputPath, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('Input file not found:', inputPath);
      console.log('Usage: node scripts/confluence-update-handoff.mjs [path/to/file.md]');
      process.exit(0);
    }
    throw e;
  }

  const getRes = await fetch(
    `${SITE}/wiki/api/v2/pages/${CONFLUENCE_PAGE_ID}?body-format=storage`,
    { headers }
  );
  if (!getRes.ok) {
    console.error('GET page failed:', getRes.status, await getRes.text());
    process.exit(1);
  }
  const page = await getRes.json();
  const currentBody = page.body?.storage?.value ?? '';
  const idx = currentBody.indexOf(SESSION_SECTION_MARKER);
  if (idx === -1) {
    console.error('Confluence page does not contain section 2 marker. Update the page structure in Confluence first.');
    process.exit(1);
  }

  const sectionIntro = SESSION_SECTION_MARKER + '\n<p>Use this for context when continuing work on the language app. This section is the canonical session summary; update it in Confluence after each session.</p>\n';
  const newBody = currentBody.slice(0, idx) + sectionIntro + mdToHtml(mdContent);
  const version = page.version?.number ?? 1;

  const putRes = await fetch(`${SITE}/wiki/api/v2/pages/${CONFLUENCE_PAGE_ID}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      id: String(CONFLUENCE_PAGE_ID),
      status: page.status || 'current',
      title: page.title || 'Language Learning App – Project History',
      spaceId: page.spaceId,
      body: { representation: 'storage', value: newBody },
      version: { number: version + 1, message: 'Update session summary from local file' },
    }),
  });
  if (!putRes.ok) {
    console.error('PUT page failed:', putRes.status, await putRes.text());
    process.exit(1);
  }
  console.log('Confluence page updated. Version:', version + 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

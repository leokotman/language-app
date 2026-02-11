#!/usr/bin/env node
/**
 * Check Confluence and Jira connectivity.
 * Loads ATLASSIAN_EMAIL and ATLASSIAN_API_TOKEN from .env (from project root).
 * Usage: node scripts/atlassian-check.mjs
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const SITE = 'https://epam-team-oc64db17.atlassian.net';
const CONFLUENCE_PAGE_ID = '2162689';
const JIRA_PROJECT_KEY = 'KAN';

const email = process.env.ATLASSIAN_EMAIL;
const token = process.env.ATLASSIAN_API_TOKEN;

if (!email || !token) {
  console.error('Missing ATLASSIAN_EMAIL or ATLASSIAN_API_TOKEN in .env');
  process.exit(1);
}

const auth = Buffer.from(`${email}:${token}`).toString('base64');
const headers = {
  Accept: 'application/json',
  Authorization: `Basic ${auth}`,
};

async function checkConfluence() {
  const url = `${SITE}/wiki/api/v2/pages/${CONFLUENCE_PAGE_ID}?body-format=storage`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error('Confluence:', res.status, await res.text());
    return false;
  }
  const data = await res.json();
  console.log('Confluence OK: page', data.id, '"' + data.title + '"', 'version', data.version?.number);
  const bodyPreview = data.body?.storage?.value?.slice?.(0, 200) || '(no body)';
  console.log('  Body preview:', bodyPreview.replace(/\s+/g, ' ').trim() + '...');
  return true;
}

async function checkJira() {
  const url = `${SITE}/rest/api/3/project/${JIRA_PROJECT_KEY}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error('Jira:', res.status, await res.text());
    return false;
  }
  const data = await res.json();
  console.log('Jira OK: project', data.key, '"' + data.name + '"');
  return true;
}

(async () => {
  console.log('Checking Atlassian connectivity...\n');
  const conf = await checkConfluence();
  console.log('');
  const jira = await checkJira();
  console.log('');
  process.exit(conf && jira ? 0 : 1);
})();

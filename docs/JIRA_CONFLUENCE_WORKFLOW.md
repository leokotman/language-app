# Jira & Confluence workflow for the language app

Use this process when starting or finishing a feature so work stays tracked in Jira and documented in Confluence.

---

## Before starting a feature

1. **Read project context from Confluence.**  
   Open the [Language Learning App — Project History](https://epam-team-oc64db17.atlassian.net/wiki/spaces/~712020234224f57bfc45618c40efaa18c79128/pages/2162689/Language+Learning+App+Project+History) page. Use it for:
   - Current state
   - What was done (history, commits, issues)
   - **Next steps** (priority list for what to implement next)

2. **Find or create the Jira task for the next feature.**
   - **Jira project:** [KAN board](https://epam-team-oc64db17.atlassian.net/jira/software/projects/KAN/list?jql=project%20%3D%20KAN%20ORDER%20BY%20created%20DESC)
   - From Confluence “Next steps”, pick the next feature to implement.
   - **Search Jira** for an existing task that matches that feature (e.g. by title or description).
   - **If no similar task exists:** create a new Jira task (title, description, acceptance criteria, link to Confluence “Next steps” if useful).
   - **If a matching task exists:**
     - Either **ask the user** to move it to the “In progress” column (or move it via Jira API if you have automation), then proceed with implementation.
     - Or proceed and tell the user which task you’re implementing so they can move it.

3. **Implement** using the usual git workflow (branch from latest, commits, push, PR). Prefer one branch per Jira task; include the task key in branch/commits when possible.

---

## After the feature is done (commits pushed, PR merged or ready)

1. **Document in Confluence.**  
   Update the [Language Learning App — Project History](https://epam-team-oc64db17.atlassian.net/wiki/spaces/~712020234224f57bfc45618c40efaa18c79128/pages/2162689/Language+Learning+App+Project+History) page:
   - Add what was done (short summary, commit range or PR if applicable).
   - Add a link to the **Jira ticket** for this work.
   - Update **Current state** and **Next steps** if anything changed.

2. **Move the Jira ticket to Done.**  
   Either:
   - **Move the ticket to “Done”** (or “Closed”) via the Jira API, or  
   - **Ask the user** to move the ticket to the “Done” column.

---

## Credentials and automation

- **Atlassian site:** `https://epam-team-oc64db17.atlassian.net`
- **Auth:** Use `ATLASSIAN_EMAIL` and `ATLASSIAN_API_TOKEN` from `.env` (never commit or paste tokens).
- **Confluence page ID:** `2162689` (Language Learning App — Project History).
- **Jira project key:** `KAN`.

Scripts or agents that call Confluence/Jira APIs should load `.env` (e.g. with `dotenv`) and use Basic auth: `Buffer.from(\`${email}:${token}\`).toString('base64')`, header `Authorization: Basic <base64>`.

---

## See also

- **`docs/AI agent instructions.md`** — main entry point; points here for Jira/Confluence.
- **`docs/AI_AGENT_JIRA_CONFLUENCE_INSTRUCTIONS.md`** — long reference for creating or bulk-creating Jira tickets and Confluence pages (ADF body format, task tables, example payloads). Use when you need the full spec; this file is the short process only.

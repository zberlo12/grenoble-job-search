# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git & GitHub — Mandatory Rules

- **Commit after every meaningful change** — skill files, config, scripts, data imports, fixes
- **Always push immediately after committing** — `git push` is part of every commit workflow
- **Never leave work uncommitted** — the remote must always reflect the latest working state
- **Commit messages**: short imperative subject line + body explaining the *why*, not the *what*

```bash
git add <specific-files>
git commit -m "Subject line

Body explaining why this change was made.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push
```

Always use the Co-Authored-By trailer. Never use `git add -A` or `git add .` — add files by name.

## Project Purpose

Structured job search system for a Finance Director / FP&A role in the Grenoble region.
Three components:

1. **`/job-search` skill** — interactive: user pastes a job listing → receives A/B/C priority ranking, red flag analysis, CV approach recommendation, Notion log entry
2. **`/job-search-daily-scan` skill** — automated: scans Gmail job alerts each morning, analyses every new listing, writes to Notion, posts a digest
3. **Notion databases** (external) — permanent record: Job Applications, Target Companies, Open To-Dos

## Repository Structure

```
.claude/commands/
  job-search.md               # /job-search skill — interactive analyser
  job-search-daily-scan.md    # daily Gmail agent prompt (runs automatically each morning)
  job-search-indeed.md        # manual Indeed sweep — local, remote, or both
  job-search-target-companies.md  # checks Target Companies careers pages for open roles
  job-review.md               # drains the Needs Info queue
  job-apply.md                # drafts tailored CV + CL for a specific application
  job-week-review.md          # end-of-week ranking of Potentially Apply listings
.mcp.json.template         # Notion MCP config template (copy → .mcp.json, fill token)
.gitignore                 # excludes .mcp.json (has secrets), node_modules, OS files
```

`.mcp.json` is gitignored — it contains the live Notion API token. `.mcp.json.template` is the versioned, token-free reference.

## Skill File Format

Skills are Markdown files in `.claude/commands/`. Frontmatter controls behaviour:

```markdown
---
description: When/how this skill triggers (shown to Claude for auto-detection)
argument-hint: What $ARGUMENTS contains
allowed-tools: comma-separated list of MCP tool IDs
---
```

`$ARGUMENTS` in the body is replaced with whatever the user typed after the slash command.

## MCP Integrations

**Already connected** (via claude.ai — no local config needed):
- `mcp__claude_ai_Gmail__*` — Gmail search, read messages/threads
- `mcp__claude_ai_Indeed__*` — job search, job detail fetch
- `mcp__claude_ai_Notion__*` — read/write Notion databases (active integration)

**Local backup** (`.mcp.json` has token — `mcp__notion__*` tools if local server runs):
The `.mcp.json` file contains the Notion API token and local MCP server config. The claude.ai Notion integration (`mcp__claude_ai_Notion__*`) is what's confirmed working in all skills — use those tool names.

## User Profile & Config

All user-specific configuration lives in Notion — **not** in this file or in skill files.

**User Profile & Config page ID**: `3452fc3ca02a811ab75af9805f50ef8b`

This page contains: candidate identity, role & compensation, background keywords, location zones,
job title alerts, Gmail sources, all Notion IDs, CV approach options, and lifecycle rules.

Skills load this page at runtime (Step 0 in each skill). To adapt the system for a new user:
1. Duplicate the User Profile & Config page in Notion and fill in their details
2. Update `notion_config_page_id` in `.mcp.json` to the new page's ID
3. Update the ID above in this file

## Multi-User Support

Multiple people can use this system on the same computer without swapping Claude accounts.
Each user gets their own Notion workspace (separate databases and pages) and their own
`.env.<name>` credentials file.

- `/job-user-setup` → choose option 2 to add a second user on this machine
- `/job-user-select` → switch the active profile at any time

The second user reuses the existing Notion connection and token — no new integration needed.

## Notion Database Schema

**Job Applications**: Job Title (title), Company, Source (select), Location, Salary, Priority (A/B/C select), CV Approach (select), Status (select: To Assess/Needs Info/Potentially Apply/To Apply/Docs Ready/Applied/Interview/Offer/Rejected/Dismissed/On Hold), Date Added, Date Applied, Date Response, Job URL, Gmail Thread URL, Red Flags (multi-select), Alert Keyword (text), Notes (rich text), English (checkbox), Application Method (select: Easy Apply/Full Application/Agency/Direct Email/Company Site), Rejection Reason (select: No reason given/French level/Overqualified/Underqualified/Experience mismatch/Salary mismatch/Location/Contract type/Role filled internally/Other), Doc Language (select: FR/EN/FR + EN)

**Target Companies**: Company (title), Tier (A/B/C/D select), Sector, Location, Careers URL, Last Checked (date), Notes

**Open To-Dos**: Task (title), Category (select), Priority (select), Due Date, Done (checkbox), Notes

All database IDs are stored in the User Profile & Config page (Section 7) and in `.mcp.json`.

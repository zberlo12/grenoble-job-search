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

1. **`/job-search` skill** — interactive: user pastes a job listing → receives A/B/C priority ranking, red flag analysis, CV approach recommendation, logged to Supabase
2. **`/job-search-daily-scan` skill** — drains `listing_inbox` (populated by `/job-email-inbox` and `/job-scan-ft`), analyses every new listing, writes to Supabase, posts a Gmail digest draft. Currently run on-demand — see `OVERVIEW.md`'s scheduling note for status.
3. **Supabase (PostgreSQL)** — the permanent record for all job-search data: `job_applications`, `review_queue`, `listing_inbox`, `target_companies`, `networking_contacts`, `scan_archive`, `france_travail_log`, `candidate_profile`. Full schema in `schema.sql`; all skills access it via `scripts/db.js` (see `.claude/rules/db.md`).
4. **Notion** — used only by `/job-user-setup` to create a human-readable onboarding workspace page per user. It is not read or written by any other skill and is not the data store.

## Repository Structure

```
.claude/commands/    # 20 skill files — see OVERVIEW.md "Skill Reference" table for the full, current list
.claude/rules/
  db.md               # scripts/db.js CLI contract — read before any DB access
  scoring.md          # single source of truth for location zones, rescue gate, priority criteria
scripts/
  db.js               # centralized DB access (direct Postgres + Supabase REST fallback)
  ft_fetch.js, ft_rome_lookup.js  # France Travail API ingestion
  populate_cv.py, populate_cl.py  # Word document generation
schema.sql            # Postgres schema — source of truth for table structure
archive/              # retired one-off scripts and data exports, kept for reference (not deleted)
.mcp.json.template     # Notion MCP config template (copy → .mcp.json, fill token)
.gitignore             # excludes config*.json, .env*, .mcp.json (secrets), node_modules, OS files
```

`.mcp.json` is gitignored — it contains the live Notion API token. `.mcp.json.template` is the versioned, token-free reference.

**Known issue (flagged, not yet fixed):** `config-zack.json` and `config-natalie.json` are tracked in this (public) git repository and contain a plaintext Supabase database password. This matches `IMPROVEMENT-PLAN.md` Phase 0, which was never executed. Do not add any new file containing credentials to git — `.gitignore` now blocks `config-*.json` and `identifiants*.json` going forward, but the existing history is not yet scrubbed and the password is not yet rotated.

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
- `mcp__claude_ai_Notion__*` — used only by `/job-user-setup`, to create each user's onboarding workspace page. No other skill touches Notion.

**Local backup** (`.mcp.json` has token — `mcp__notion__*` tools if local server runs):
The `.mcp.json` file contains the Notion API token and local MCP server config, for the same onboarding-only purpose as above.

## User Profile & Config

All user-specific configuration lives in `config.json` (gitignored) — **not** in Notion, and not in this file.

`config.json` contains: candidate identity, role & compensation, `salary_floor_apply`/`salary_floor_reject`, `location_zones`, `job_titles`, Gmail sources, `france_travail_api` credentials, CV approach options, and `lifecycle_rules`. Every skill's Step 0 reads it directly via `cat config.json`.

To adapt the system for a new user, run `/job-user-setup` — it writes a fresh `config.json` from a conversational interview and creates that user's Notion onboarding page.

## Multi-User Support

Multiple people can use this system on the same computer without swapping Claude accounts. Each user has their own `config-<name>.json` snapshot, their own `.env.<name>` credentials file, and their own `user_profile` value — all sharing one Supabase database, with every query filtered by `user_profile`.

- `/job-user-setup` → choose option 2 to add a second user on this machine
- `/job-user-select` → switch the active profile at any time (copies that user's `config-<name>.json` over `config.json`)

**Security note:** `config-<name>.json` files contain the same Supabase credentials as `config.json` and must never be committed — see the Known Issue above.

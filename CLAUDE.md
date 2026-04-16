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

## Candidate Profile (used in both skills)

- **Role level**: Finance Director / FP&A (senior, 10+ years)
- **Base**: Grenoble, France
- **Salary floor**: €55K (flag below; reject below €45K)
- **Language**: English exposure preferred; French-only is a yellow flag
- **Contract**: CDI strongly preferred
- **Key background**: Multi-entity FP&A, P2P governance (Signavio/SAP), industrial cost control, procurement, US GAAP + French GAAP

## Location Zone Rules (Grenoble-centric)

These zones are applied in every job analysis — never skip location assessment:

| Zone | Commute | Dept | Decision rule |
|---|---|---|---|
| 🟢 Green | 0–25 min | 38 core | Apply freely |
| 🟡 Yellow | 30–50 min | 38 outskirts, 73 Chambéry | Apply — confirm hybrid before writing documents |
| 🟠 Orange | 1h–1h45 | 26 Valence, 74 Annecy, 73 Ugine | Only if hybrid ≤2 days/week explicitly stated |
| 🔴 Red | 1h15+ / no hybrid | 69 Lyon, 75/92 Paris, 73 Maurienne | Skip without hesitation |

Dept 73: check the specific town (Chambéry = Yellow; La Tour-en-Maurienne = Red).
Dept 01: treat as Orange/Red.

## Notion Database Schema

Three databases — IDs stored in `.mcp.json` (gitignored). Created 2026-04-12 under the "Job Search" page.

| Database | Notion ID |
|---|---|
| Job Applications | `09b29be7bb764b16b173321f469b01e2` |
| Target Companies | `108a671739474a83a1b53f1eb8d54de4` |
| Open To-Dos | `e04c0c16b774448b86b0c309a684190b` |
| Job Search (parent page) | `3402fc3ca02a8029a6bcead9445285aa` |

**Job Applications**: Job Title (title), Company, Source (select), Location, Salary, Priority (A/B/C select), CV Approach (select), Status (select: To Assess/To Apply/Applied/Interview/Offer/Rejected/On Hold), Date Added, Date Applied, Date Response, Job URL, Gmail Thread URL, Red Flags (multi-select), Notes (rich text), English (checkbox)

**Target Companies**: Company (title), Tier (A/B/C/D select), Sector, Location, Careers URL, Last Checked (date), Notes

**Open To-Dos**: Task (title), Category (select), Priority (select), Due Date, Done (checkbox), Notes

## Historical Data

HTML source of truth (pre-Notion):
`C:\Users\zberl\OneDrive\Documents\France Job Applications\2026\Grenoble Job Search – Dashboard.html`

Contains: ~22+ applications, Tier A/B target companies with careers URLs, geography zone reference, open to-dos, networking contacts. Import this into Notion once databases are created.

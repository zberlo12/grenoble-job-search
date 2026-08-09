# Automated Job Search System — Overview

## What Is This?

A personal job search system that runs inside [Claude Code](https://claude.ai/code). You configure it once with your profile — role targets, location zones, salary floor, language preferences — and it handles the grind: scanning job alert emails, scoring each listing against your criteria, routing results into a structured pipeline, and drafting tailored CVs and cover letters when you're ready to apply.

The goal is to spend your time on decisions and applications — not on manually scanning boards, copy-pasting listings, or remembering to follow up.

**What it does:**
- Reads your job alert emails from Gmail and parses every listing
- Pulls structured listings directly from the France Travail API (no parsing needed)
- Scores each listing (Priority A / B / C) against your profile and auto-routes to a review queue
- Surfaces borderline listings for your review with enrichment from Indeed and the web
- Drafts a tailored CV and cover letter for each application using your candidate profile
- Tracks the full pipeline from first listing to offer or rejection
- Handles compliance logging (e.g. France Travail job seeker reporting)

**Tech stack:** Claude AI · Supabase (PostgreSQL) · Gmail · Indeed API · Notion (onboarding only) · Google Calendar · Slack (Cowork-side notifications only — see `SLACK_INTEGRATION_PLAN.md`)

---

## How It's Built

```
Gmail job alerts ──┐
France Travail API ─┼──► listing_inbox      ← staging table; France Travail rows arrive pre-structured,
career-ops scan ────┘         │                Gmail rows need the daily-scan parse step
                               ▼
review_queue             ← listings needing human review (ambiguous, missing info)
job_applications         ← clean listings routed automatically
      │
      ▼
  Potentially Apply      ← holding queue, reviewed weekly by /job-shortlist
      │
      ▼
  To Apply                ← your shortlist, ready for document drafting
      │
      ▼
CV + Cover Letter        ← /job-apply drafts tailored documents per listing, saved to Supabase
      │
      ▼
Applied → Interview → Offer   ← tracked exclusively by /job-status
      │
      ▼
france_travail_log       ← compliance activity log, auto-populated
```

**Key database tables:** `listing_inbox` · `review_queue` · `job_applications` · `scan_archive` · `target_companies` · `networking_contacts` · `france_travail_log` · `candidate_profile`. Full schema in `schema.sql`. Every skill accesses these through `scripts/db.js` — see `.claude/rules/db.md`.

All user-specific configuration (role, location zones, salary, job titles, CV content) lives in `config.json` and the candidate profile table — nothing is hardcoded. The same system runs for different users with different configs (see `CLAUDE.md` § Multi-User Support).

---

## Scheduling — currently manual

There is no automation running right now. Two nightly `RemoteTrigger`s (email pre-processor, daily scan) were planned during setup but were never kept active, and no Windows Scheduled Task exists either — confirmed via `schtasks /query`. `/job-scan-ft` (France Travail ingestion) has also never been on a schedule: it opens with an interactive yes/no confirmation gate that would block unattended execution anyway.

**Today, you run the pipeline by hand, in this order, whenever you want new listings:**
1. `/job-email-inbox` — parses yesterday's Gmail job alerts into `listing_inbox`
2. `/job-scan-ft` — (optional) pulls structured France Travail listings into `listing_inbox`
3. `/job-search-daily-scan` — scores and routes everything in `listing_inbox`, posts a Gmail digest draft

If you want this automated again, `/job-user-setup` (Phase 9 in its own flow) can create `RemoteTrigger`s for steps 1 and 3 — note that doesn't cover `/job-scan-ft`, which would need its interactive gate removed first to run unattended.

---

## The Build Order

> Like a real-time strategy game: there's a right sequence. Follow this from the top.

---

### Phase 0 — Install & Setup *(run once, ~20 minutes)*

**Step 1.** Clone the repo and open it in Claude Code:
```bash
git clone https://github.com/zberlo12/grenoble-job-search
```

**Step 2.** Run `/job-user-setup` — guided setup interview:
- Your name, base city, target roles, salary floor, location zones, contract preferences
- CV paste → extracts background keywords, employers, skills, systems
- Writing tone questionnaire → calibrates cover letter style to sound like you
- Writes `config.json`, creates a Notion onboarding page, optionally schedules nightly triggers

**Step 3.** Subscribe to job alerts on each board — the setup generates a ready-made checklist with pre-filled search strings for LinkedIn, Indeed, APEC, Cadremploi, HelloWork, Welcome to the Jungle, and major recruiters. Also register at francetravail.io/inscription for the France Travail API (free, ~5 minutes) if you want `/job-scan-ft`.

---

### Phase 1 — Prime the Pump *(run once, day 1)*

**Step 4.** `/job-search-indeed both` — sweeps Indeed for local and remote listings right now, before the first email alert arrives. Puts your first 20–40 listings into the pipeline immediately.

---

### Phase 2 — Ingestion *(run manually, or scheduled if you set up triggers)*

**Step 5.** `/job-email-inbox` then `/job-search-daily-scan` (see Scheduling above). `/job-scan-ft` is a third, independent, on-demand source for structured France Travail listings.

`/job-search-daily-scan` Step 0a also shells into a sibling repo, `../career-ops-analysis`, to run a portal scanner — note this is a **third-party repository** (`github.com/santifer/career-ops`, not yours). The step is non-blocking: if that repo is missing or errors, the scan continues normally.

---

### Phase 3 — Morning Check *(daily, ~2 minutes)*

**Step 6.** `/job-morning` — read-only. Reads last night's scan results and your current pipeline state; performs zero writes. Shows how many listings arrived, review queue depth, how many active applications are 14+ days old and worth a `/job-status` check, and the single most important next action.

---

### Phase 4 — Triage *(2–3× per week, ~15 minutes)*

**Step 7.** `/job-review` — drains the review queue:
1. **Needs Info rows** — listings where salary, hybrid policy, or company name was missing. Tries to enrich each one automatically (Indeed API → Gmail thread re-read → web fetch → asks you to paste if needed), then re-ranks.
2. **To Assess rows** — confirm or override the auto-ranking. Good fits get promoted to `Potentially Apply`; the rest are dismissed unless held.

---

### Phase 5 — Weekly Decision *(once per week, ~10 minutes)*

**Step 8.** `/job-shortlist` — go/no-go pass over everything sitting in `Potentially Apply`. You pick which listings commit to `To Apply` and which get dismissed; the rest hold for next week.

---

### Phase 6 — Application Prep *(per listing, ~30 minutes)*

**Step 9.** `/job-company-research [company]` *(optional but recommended for strong targets)* — company snapshot: sector, size, English culture, finance team signals, open roles.

**Step 10.** `/job-apply` — the main document drafter:
- Runs a JD-completeness gate and a pre-flight check (salary/location/contract/duplicate/seniority/repost) before drafting anything
- Fetches the job description and your candidate profile from Supabase
- Asks targeted questions about the role (anything ambiguous)
- Drafts a tailored CV and cover letter in the correct language (FR/EN), saved to Supabase, then populates Word files via `scripts/populate_cv.py` / `populate_cl.py`

**Step 11.** Submit the application, then log it as Applied in `/job-status`.

---

### Phase 7 — Active Pipeline *(ongoing)*

**Step 12.** `/job-status` — the sole owner of response detection. Searches Gmail for replies, classifies them (interview, rejection, offer), updates status/timestamps/Gmail thread link, applies auto-expiry (`lifecycle_rules.auto_expiry_days`), and logs follow-up nudges and networking contacts.

**Step 13.** `/job-interview-prep [application]` — generates a full briefing pack before any interview: company snapshot, role alignment, likely questions with talking points, questions to ask them.

---

### Phase 8 — Ongoing Enrichment *(weekly or as needed)*

| Command | When to use |
|---------|-------------|
| `/job-search [paste listing]` | Found a listing outside your email alerts — paste it and get instant analysis + logging |
| `/job-search-indeed local/remote/both` | Manual sweep of Indeed on demand |
| `/job-search-target-companies` | Checks Tier A/B company careers pages for unlisted openings |
| `/job-qualify-companies` | Lightweight research on Tier C companies — promote to A/B or drop to D |
| `/job-networking` | Log a conversation with a contact, set a follow-up reminder, find who you know at a company |

---

### Phase 9 — Compliance *(monthly)*

**Step 14.** `/job-france-travail` — auto-syncs all job search activity from Supabase, lets you add any manual entries (networking calls, France Travail meetings), and generates an audit-ready monthly report. Not to be confused with `/job-scan-ft`, which *pulls* listings from the same agency's API — this skill *reports to* them.

---

### Monitoring & Account *(any time)*

| Command | What it shows |
|---------|---------------|
| `/job-dashboard` | Full pipeline snapshot — all active rows grouped by status |
| `/job-analytics` | Funnel metrics: conversion by source, response rates, red flag patterns |
| `/job-user-profile` | Update salary floor, location zones, job titles, or any other config value |
| `/job-user-select` | Switch the active profile, if more than one person uses this system on this machine |

---

## Configuration

Everything user-specific lives in `config.json` (gitignored — never commit it or a `config-<name>.json` copy):

| Setting | Where |
|---------|-------|
| Target role titles (FR + EN) | `config.json` → `job_titles` |
| Salary floor (apply / reject) | `config.json` → `user` |
| Location zones (green/yellow/orange/red) | `config.json` → `location_zones` |
| Language preference, contract preference | `config.json` → `user` |
| Background, skills, systems, employers | `config.json` → `background` |
| France Travail API credentials + ROME codes | `config.json` → `france_travail_api` |
| CV content, cover letter rules, tone profile | Supabase → `candidate_profile` |

To adapt the system for a different user: run `/job-user-setup` — it walks through the full configuration interview and writes everything from scratch.

---

## Skill Reference

| Skill | Trigger | Description |
|-------|---------|-------------|
| `/job-user-setup` | Once | Full setup: profile, config, Notion onboarding page, optional scheduled triggers |
| `/job-morning` | Daily | Read-only morning digest — scan results + pipeline state |
| `/job-email-inbox` | Manual (or scheduled) | Parse Gmail job alerts → `listing_inbox` |
| `/job-scan-ft` | Manual, on-demand | Fetch structured offers from the France Travail API → `listing_inbox` |
| `/job-search-daily-scan` | Manual (or scheduled) | Score + route `listing_inbox` → Supabase, Gmail digest |
| `/job-review` | 2–3×/week | Drain review queue: enrich Needs Info, confirm To Assess |
| `/job-shortlist` | Weekly | Go/no-go pass on the Potentially Apply holding queue |
| `/job-apply` | Per listing | Pre-flight checks + draft tailored CV + cover letter |
| `/job-status` | As needed | Sole owner of response detection: interview, rejection, offer, follow-ups |
| `/job-interview-prep` | Before interview | Full briefing pack |
| `/job-search` | As needed | Analyse a pasted listing |
| `/job-search-indeed` | As needed | Manual Indeed sweep (local / remote / both) |
| `/job-search-target-companies` | Weekly | Check Tier A/B careers pages |
| `/job-qualify-companies` | As needed | Research Tier C companies — promote or drop |
| `/job-company-research` | As needed | Deep-dive on a specific company |
| `/job-networking` | As needed | Log contacts, schedule follow-ups |
| `/job-france-travail` | Monthly | Compliance report (declaring activity, not fetching listings) |
| `/job-dashboard` | Any time | Read-only pipeline snapshot |
| `/job-analytics` | Any time | Funnel metrics and source quality |
| `/job-user-profile` | As needed | Update config values |
| `/job-user-select` | As needed | Switch active profile (multi-user machines) |

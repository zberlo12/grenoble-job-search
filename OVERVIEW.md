# Automated Job Search System — Overview

## What Is This?

A personal job search system that runs inside [Claude Code](https://claude.ai/code). You configure it once with your profile — role targets, location zones, salary floor, language preferences — and it handles the daily grind automatically: scanning job alert emails every night, scoring each listing against your criteria, routing results into a structured pipeline, and drafting tailored CVs and cover letters when you're ready to apply.

The goal is to spend your time on decisions and applications — not on manually scanning boards, copy-pasting listings, or remembering to follow up.

**What it does:**
- Reads your job alert emails from Gmail every night and parses every listing
- Scores each listing (Priority A / B / C) against your profile and auto-routes to a review queue
- Surfaces borderline listings for your review with enrichment from Indeed and the web
- Drafts a tailored CV and cover letter for each application using your candidate profile
- Tracks the full pipeline from first listing to offer or rejection
- Handles compliance logging (e.g. France Travail job seeker reporting)

**Tech stack:** Claude AI · Supabase (PostgreSQL) · Gmail · Indeed API · Notion · Google Calendar

---

## How It's Built

Four data flows, one pipeline:

```
Gmail job alerts
      │
      ▼
  listing_inbox          ← pre-processor parses raw emails each night
      │
      ▼
review_queue             ← listings needing human review (ambiguous, missing info)
job_applications         ← clean listings routed automatically
      │
      ▼
  To Apply               ← your shortlist, ready for document drafting
      │
      ▼
CV + Cover Letter        ← /job-apply drafts tailored documents per listing
      │
      ▼
Applied → Interview → Offer
      │
      ▼
france_travail_log       ← compliance activity log, auto-populated
```

**Key database tables:** `listing_inbox` · `review_queue` · `job_applications` · `scan_archive` · `target_companies` · `networking_contacts` · `france_travail_log`

All user-specific configuration (role, location zones, salary, job titles, CV content) lives in `config.json` and a Notion candidate profile — nothing is hardcoded. The same system runs for different users with different configs.

---

## The Build Order

> Like a real-time strategy game: there's a right sequence. Follow this from the top and the system runs itself within 24 hours.

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
- Writes `config.json`, creates Notion workspace pages, schedules two automatic nightly triggers

**Step 3.** Subscribe to job alerts on each board — the setup generates a ready-made checklist with pre-filled search strings for LinkedIn, Indeed, APEC, Cadremploi, HelloWork, Welcome to the Jungle, and major recruiters.

---

### Phase 1 — Prime the Pump *(run once, day 1)*

**Step 4.** `/job-search-indeed both` — sweeps Indeed for local and remote listings right now, before the first email alert arrives. Puts your first 20–40 listings into the pipeline immediately.

---

### Phase 2 — Automatic Nightly Cycle *(no action required)*

Every night, two scheduled agents run automatically:

| Time | Agent | What it does |
|------|-------|--------------|
| 23:30 | Email pre-processor | Reads Gmail job alert label → parses every listing → writes raw rows to `listing_inbox` |
| 00:01 | Daily scan | Reads `listing_inbox` → scores and routes each listing → writes to Supabase → sends you a Gmail draft digest |

You wake up to a digest in your drafts folder. No manual scanning needed.

---

### Phase 3 — Morning Check *(daily, ~2 minutes)*

**Step 5.** `/job-morning` — reads last night's scan results and your current pipeline state. Shows: how many listings arrived, review queue depth, and the single most important next action.

---

### Phase 4 — Triage *(2–3× per week, ~15 minutes)*

**Step 6.** `/job-review` — drains the review queue in two passes:

1. **Needs Info rows** — listings where salary, hybrid policy, or company name was missing. The skill tries to enrich each one automatically (Indeed API → web fetch → asks you to paste if needed), then re-ranks.
2. **To Assess rows** — confirm or override the auto-ranking. Good fits get promoted to `Potentially Apply`.

Ends with a pass over all `Potentially Apply` rows so nothing sits unreviewed.

---

### Phase 5 — Weekly Decision *(once per week, ~10 minutes)*

**Step 7.** `/job-review-weekly` — shows a ranked comparison table of everything in `Potentially Apply`. You pick which listings to commit to (`→ To Apply`) and which to dismiss. The rest hold for next week.

---

### Phase 6 — Application Prep *(per listing, ~30 minutes)*

**Step 8.** `/job-company-research [company]` *(optional but recommended for strong targets)* — company snapshot: sector, size, English culture, finance team signals, open roles.

**Step 9.** `/job-apply` — the main document drafter:
- Fetches the job description and your candidate profile from Supabase
- Asks 3–5 targeted questions about the role (anything ambiguous)
- Drafts a tailored CV and cover letter in the correct language (FR/EN)
- You review, adjust if needed, and submit

**Step 10.** Submit the application, then log it as Applied in `/job-status`.

---

### Phase 7 — Active Pipeline *(ongoing)*

**Step 11.** `/job-status` — log responses as they arrive: interview invitation, rejection, offer. Updates status, timestamps, and Gmail thread link.

**Step 12.** `/job-interview-prep [application]` — generates a full briefing pack before any interview: company snapshot, role alignment, likely questions with talking points, questions to ask them.

---

### Phase 8 — Ongoing Enrichment *(weekly or as needed)*

| Command | When to use |
|---------|-------------|
| `/job-search [paste listing]` | Found a listing outside your email alerts — paste it and get instant analysis + logging |
| `/job-search-indeed local/remote/both` | Manual sweep of Indeed on demand |
| `/job-search-target-companies` | Checks Tier A/B company careers pages for unlisted openings |
| `/job-networking` | Log a conversation with a contact, set a follow-up reminder, find who you know at a company |

---

### Phase 9 — Compliance *(monthly)*

**Step 16.** `/job-france-travail` — auto-syncs all job search activity from Supabase, lets you add any manual entries (networking calls, France Travail meetings), and generates an audit-ready monthly report.

---

### Monitoring *(any time)*

| Command | What it shows |
|---------|---------------|
| `/job-dashboard` | Full pipeline snapshot — all active rows grouped by status |
| `/job-analytics` | Funnel metrics: conversion by source, response rates, red flag patterns |

---

## Configuration

Everything user-specific lives in `config.json` (gitignored) and a Notion Candidate Profile page:

| Setting | Where |
|---------|-------|
| Target role titles (FR + EN) | `config.json` → `job_titles` |
| Salary floor (apply / reject) | `config.json` → `user` |
| Location zones (green/yellow/orange/red) | `config.json` → `location_zones` |
| Language preference, contract preference | `config.json` → `user` |
| Background, skills, systems, employers | `config.json` → `background` |
| CV content, cover letter rules, tone profile | Notion → Candidate Profile |

To adapt the system for a different user: run `/job-user-setup` — it walks through the full configuration interview and writes everything from scratch.

---

## Skill Reference

| Skill | Trigger | Description |
|-------|---------|-------------|
| `/job-user-setup` | Once | Full setup: profile, config, Notion workspace, scheduled triggers |
| `/job-morning` | Daily | Morning digest — scan results + pipeline state |
| `/job-email-inbox` | Nightly (auto) | Parse Gmail job alerts → `listing_inbox` |
| `/job-search-daily-scan` | Nightly (auto) | Score + route `listing_inbox` → Supabase |
| `/job-review` | 2–3×/week | Drain review queue: enrich Needs Info, confirm To Assess |
| `/job-review-weekly` | Weekly | Batch decision on Potentially Apply holdings |
| `/job-apply` | Per listing | Draft tailored CV + cover letter |
| `/job-status` | As needed | Log responses: interview, rejection, offer |
| `/job-interview-prep` | Before interview | Full briefing pack |
| `/job-search` | As needed | Analyse a pasted listing |
| `/job-search-indeed` | As needed | Manual Indeed sweep (local / remote / both) |
| `/job-search-target-companies` | Weekly | Check Tier A/B careers pages |
| `/job-company-research` | As needed | Deep-dive on a specific company |
| `/job-networking` | As needed | Log contacts, schedule follow-ups |
| `/job-france-travail` | Monthly | Compliance report |
| `/job-dashboard` | Any time | Pipeline snapshot |
| `/job-analytics` | Any time | Funnel metrics and source quality |

---
description: Adzuna structured job ingestion — fetches offers headlessly from the Adzuna Job Search API, dedups against existing pipeline data, and stages new rows in listing_inbox for the next daily scan. No Chrome session, no LLM parsing required. Trigger with /job-scan-adzuna.
allowed-tools: Bash
---

# Adzuna API Scan

Note: Adzuna is a job-board aggregator (it already pulls in HelloWork, its own network, etc.), so expect meaningful overlap with your existing sources — this is a supplementary sweep, not a primary feed like France Travail.

## Pre-check — Confirm active user

**Before doing anything else**, run `cat config.json`, read `user.name` and `user.email`, then display this message and wait for the user's reply:

> Active profile: **[user.name]** ([user.email])
> This skill will fetch job listings from the Adzuna API and write listing data for this user.
> Reply **yes** to continue, or **no** to abort.

If the user replies anything other than yes / y / oui, stop immediately without executing any further steps.

---

**Execution mode: silent.** Do not narrate steps, explain decisions, or summarise intermediate results. Output only the Step 3 report at the end.

## Step 0 — Load Config

Read `.claude/rules/db.md` and use `scripts/db.js` for all database access below.

Run `cat config.json` via Bash and extract `user.profile_id` → USER_PROFILE, and the `adzuna_api` block.

If `adzuna_api.app_id` or `app_key` is null: stop and tell the user to register for free at https://developer.adzuna.com and paste the Application ID/Key into `config.json` under `adzuna_api`.

---

## Step 1 — Fetch

```bash
node scripts/adzuna_fetch.js
```

Capture its output (results fetched per title, inserted count, url_deduped count, errors). If it prints a credentials warning instead of running, relay that message to the user and stop.

---

## Step 2 — Dedup newly-staged rows against the pipeline

Query all not-yet-scored Adzuna rows (this catches anything left over from a prior fetch too, not just today's):

```sql
SELECT * FROM listing_inbox
WHERE parse_status='structured' AND source='Adzuna' AND user_profile=USER_PROFILE
ORDER BY created_at ASC
```

For each row, apply `.claude/rules/scoring.md` §5 (Deduplication) exactly — same two checks `/job-search-daily-scan` Step 2 (3a) and `/job-scan-ft` Step 2 run:

**Check 1 — URL exact match:**
```sql
SELECT id FROM (
  SELECT id FROM job_applications WHERE job_url=$1 AND user_profile=$2
  UNION ALL
  SELECT id FROM review_queue WHERE job_url=$1 AND user_profile=$2
) t LIMIT 1
```

**Check 2 — Company + title-root match (ILIKE):** strip H/F, seniority suffixes, and parenthetical qualifiers from `row.job_title`, keep the primary role noun phrase.
```sql
SELECT id FROM (
  SELECT id FROM job_applications WHERE company ILIKE $1 AND job_title ILIKE $2 AND user_profile=$3
  UNION ALL
  SELECT id FROM review_queue WHERE company ILIKE $1 AND job_title ILIKE $2 AND user_profile=$3
) t LIMIT 1
```

If either check returns a row → duplicate. Run:
```sql
UPDATE listing_inbox SET parse_status='processed' WHERE id=$1 AND user_profile=$2
```
and increment the dedup counter. **Do not** change status on rows that pass both checks — leave them `parse_status='structured'` so the next `/job-search-daily-scan` run scores and routes them (its Step 1 query already includes `parse_status='structured'`).

---

## Step 3 — Report

```
/job-scan-adzuna complete

Fetched from Adzuna:          [N unique listings]
  New (staged):                [N]  (inserted by adzuna_fetch.js)
  Already staged (url_dedup):  [N]

Pipeline dedup (Step 2):
  Duplicate (already in job_applications/review_queue): [N] — marked processed
  New, awaiting scoring:                                 [N]

Next step: run /job-search-daily-scan to score and route the [N] new rows.
```

If `adzuna_fetch.js` stopped early on missing credentials, report that instead and skip Step 2/3's counts.

---
description: France Travail structured job ingestion — fetches offers headlessly from the France Travail "Offres d'emploi v2" API, dedups against existing pipeline data, and stages new rows in listing_inbox for the next daily scan. No Chrome session, no LLM parsing required. Trigger with /job-scan-ft.
allowed-tools: Bash
---

# France Travail API Scan

Note: this is ingestion, not the compliance-reporting skill — that one is `/job-france-travail` (declares job-search activity to France Travail/Pôle Emploi). This skill *pulls job offers from* the France Travail API instead.

## Pre-check — Confirm active user

**Before doing anything else**, run `cat config.json`, read `user.name` and `user.email`, then display this message and wait for the user's reply:

> Active profile: **[user.name]** ([user.email])
> This skill will fetch job offers from the France Travail API and write listing data for this user.
> Reply **yes** to continue, or **no** to abort.

If the user replies anything other than yes / y / oui, stop immediately without executing any further steps.

---

**Execution mode: silent.** Do not narrate steps, explain decisions, or summarise intermediate results. Output only the Step 3 report at the end.

## Step 0 — Load Config

Read `.claude/rules/db.md` and use `scripts/db.js` for all database access below.

Run `cat config.json` via Bash and extract `user.profile_id` → USER_PROFILE, and the `france_travail_api` block.

If `france_travail_api.client_id` or `client_secret` is null: stop and tell the user to register at https://francetravail.io/inscription, create an app, subscribe to "Offres d'emploi v2", and paste the client ID/secret into `config.json` under `france_travail_api`.

If `france_travail_api.rome_codes` is empty: stop and tell the user to run `node scripts/ft_rome_lookup.js`, confirm the candidate codes it prints, and add the confirmed ones to `france_travail_api.rome_codes` in `config.json` before continuing.

---

## Step 1 — Fetch

```bash
node scripts/ft_fetch.js
```

Capture its output (offers fetched per department, inserted count, url_deduped count, errors). If it prints a credentials/ROME-codes warning instead of running, relay that message to the user and stop.

---

## Step 2 — Dedup newly-staged rows against the pipeline

Query all not-yet-scored France Travail rows (this catches anything left over from a prior fetch too, not just today's):

```sql
SELECT * FROM listing_inbox
WHERE parse_status='structured' AND source='France Travail' AND user_profile=USER_PROFILE
ORDER BY created_at ASC
```

For each row, apply `.claude/rules/scoring.md` §5 (Deduplication) exactly — same two checks `/job-search-daily-scan` Step 2 (3a) runs:

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
/job-scan-ft complete

Fetched from France Travail:  [N unique offers]
  New (staged):                [N]  (inserted by ft_fetch.js)
  Already staged (url_dedup):  [N]

Pipeline dedup (Step 2):
  Duplicate (already in job_applications/review_queue): [N] — marked processed
  New, awaiting scoring:                                 [N]

Next step: run /job-search-daily-scan to score and route the [N] new rows.
```

If `ft_fetch.js` stopped early on missing credentials or ROME codes, report that instead and skip Step 2/3's counts.

---

## Overlap comparison (run manually, weekly, during the 2-week parallel-run period)

Compares France Travail-sourced listings against everything else (Gmail alerts, portal scan) by company name over a trailing window, to gauge whether France Travail can eventually replace the Chrome-blocked sources. Coarse signal only — matches on company, not title (titles differ across sources).

```sql
-- France Travail found it, no other source did (last 14 days)
SELECT company, job_title, job_url FROM listing_inbox
WHERE source='France Travail' AND user_profile=$1 AND parse_date >= CURRENT_DATE - 14
  AND company NOT IN (
    SELECT company FROM listing_inbox
    WHERE source != 'France Travail' AND user_profile=$1 AND parse_date >= CURRENT_DATE - 14
  );

-- Another source found it, France Travail didn't (last 14 days)
SELECT company, job_title, source, job_url FROM listing_inbox
WHERE source != 'France Travail' AND user_profile=$1 AND parse_date >= CURRENT_DATE - 14
  AND company NOT IN (
    SELECT company FROM listing_inbox
    WHERE source='France Travail' AND user_profile=$1 AND parse_date >= CURRENT_DATE - 14
  );
```
Pass `[USER_PROFILE]` to both. Report the two counts to the user with a few example rows from each side.

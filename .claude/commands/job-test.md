---
description: Supabase pipeline test — trimmed daily scan that writes to Supabase instead of Notion. Processes max 5 listings. Proves the Bash+node DB write path end-to-end. Trigger with /job-test.
argument-hint: Optional date MM/DD/YY. Default = yesterday.
allowed-tools: mcp__claude_ai_Gmail__search_threads, mcp__claude_ai_Gmail__get_thread, mcp__claude_ai_Indeed__get_job_details, Bash
---

# Job Test — Supabase Pipeline Smoke Test

**Purpose:** Prove that Gmail scan → analysis → Supabase write works end-to-end.
Processes max 5 listings. Writes to Supabase `review_queue` and `job_applications`. No Notion writes.

---

## Step 0 — Load Config

Run:
```bash
cat config.json
```
Parse the output JSON. Extract into context:
- `supabase_connection_string` → PG_CONN
- `pg_module_path` → PG_MODULE
- `user` → name, salary floors, language preference
- `location_zones` → green/yellow/orange/red city lists
- `gmail.alert_sources` → list of sender addresses
- `gmail.label` → "jobs"
- `lifecycle_rules` → dedup_window_days (30), priority rules

**DB helper pattern** (use this template for all DB operations below):
```bash
PG_MODULE="<pg_module_path>" PG_CONN="<supabase_connection_string>" node -e "
const {Client}=require(process.env.PG_MODULE);
const c=new Client({connectionString:process.env.PG_CONN});
c.connect()
  .then(()=>c.query('<SQL HERE>', [<params>]))
  .then(r=>{console.log(JSON.stringify(r.rows));return c.end();})
  .catch(e=>{console.error(e.message);process.exit(1);});
"
```
Substitute the actual PG_MODULE path and PG_CONN string from config.json in every Bash call.

---

## Step 1 — Determine Scan Date

Parse `$ARGUMENTS`:
- Empty → yesterday
- `MM/DD/YY` → that date

Format as `YYYY-MM-DD` for SQL and `YYYY/MM/DD` for Gmail queries.
Today's date is in the `currentDate` context variable.

---

## Step 2 — Search Gmail

Run one Gmail search using `search_threads`:
```
label:jobs after:YYYY/MM/DD before:YYYY/MM/DD
```
Use the scan date for both bounds (to stay within that one day).

If no threads found, output: "No job alert emails found for [date]. Test complete." and stop.

---

## Step 3 — Extract Listings (max 5)

Read up to the first 5 threads via `get_thread`. Stop after 5 regardless of how many threads were found.

Skip APEC threads (from `offres@diffusion.apec.fr`) — they have no parseable body.

For each thread, extract:
- Job title
- Company (or "Not disclosed")
- Location
- Salary (or null)
- Job URL — use `https://fr.indeed.com/viewjob?jk=XXXXX` for Indeed `jk=` URLs
- Gmail Thread URL: `https://mail.google.com/mail/u/0/#all/<threadId>`
- Alert keyword (from subject line)
- Source: `Indeed` / `LinkedIn` / `Direct` / `Other`

---

## Step 4 — Deduplicate Against Supabase

For each extracted listing, run a dedup check:

```bash
# Check if company+title already exists in last 30 days
node -e "...c.query(
  'SELECT id FROM job_applications WHERE company ILIKE \$1 AND job_title ILIKE \$2 AND date_added >= NOW() - INTERVAL \'30 days\'',
  ['%<company>%', '%<title_root>%']
)..."
```

If a row is returned → duplicate, skip. Log: "DUPLICATE: [title] @ [company]"
If no row → proceed to Step 5.

---

## Step 5 — Analyse Each New Listing

Apply the same rescue gate and priority rules as the daily scan:

**Rescue gate** — if title matches finance/FP&A/controlling AND location is Green/Yellow/Remote AND no hard disqualifier, but salary/hybrid/scope is missing → `status = 'Needs Info'`, `priority = 'B'`.

**Standard rules:**
- A: Senior finance, Green/Yellow/Remote, CDI, ≥€55K → `status = 'To Apply'` → write to `job_applications`
- B/C: Good fit with gaps → `status = 'To Assess'` → write to `review_queue`
- Dismissed: Hard disqualifier → `status = 'Dismissed'` → write to `job_applications`

Enrich Needs Info listings via Indeed API if URL contains `jk=`:
```
mcp__claude_ai_Indeed__get_job_details with jobId = <jk value>
```

---

## Step 6 — Write to Supabase

**For `review_queue` rows** (To Assess, Needs Info):

```bash
node -e "
const {Client}=require(process.env.PG_MODULE);
const c=new Client({connectionString:process.env.PG_CONN});
const row={
  job_title:'<title>',
  company:'<company>',
  source:'<source>',
  location:'<location>',
  salary:'<salary or null>',
  priority:'<B or C>',
  status:'<To Assess or Needs Info>',
  date_added:'<scan_date YYYY-MM-DD>',
  job_url:'<url>',
  gmail_thread_url:'<thread_url>',
  red_flags:JSON.stringify([<flags>]),
  missing_info:JSON.stringify([<missing>]),
  alert_keyword:'<keyword>',
  notes:'<2-3 sentence analysis>',
  english:<true or false>,
  job_description:'<jd text truncated to 4000 chars or null>'
};
c.connect()
  .then(()=>c.query(
    'INSERT INTO review_queue (job_title,company,source,location,salary,priority,status,date_added,job_url,gmail_thread_url,red_flags,missing_info,alert_keyword,notes,english,job_description) VALUES (\$1,\$2,\$3,\$4,\$5,\$6,\$7,\$8,\$9,\$10,\$11,\$12,\$13,\$14,\$15,\$16) RETURNING id',
    [row.job_title,row.company,row.source,row.location,row.salary,row.priority,row.status,row.date_added,row.job_url,row.gmail_thread_url,row.red_flags,row.missing_info,row.alert_keyword,row.notes,row.english,row.job_description]
  ))
  .then(r=>{console.log('Inserted review_queue id='+r.rows[0].id);return c.end();})
  .catch(e=>{console.error(e.message);process.exit(1);});
"
```

**For `job_applications` rows** (To Apply, Dismissed):
Same pattern but table = `job_applications` and include `cv_approach`, `application_method`, `rejection_reason`, `doc_language`, `docs_url` columns (null for new entries).

---

## Step 7 — Confirm Writes

Run once after all inserts:

```bash
node -e "
const {Client}=require(process.env.PG_MODULE);
const c=new Client({connectionString:process.env.PG_CONN});
c.connect()
  .then(()=>Promise.all([
    c.query('SELECT id,job_title,company,status,date_added FROM review_queue ORDER BY created_at DESC LIMIT 10'),
    c.query('SELECT id,job_title,company,status,date_added FROM job_applications ORDER BY created_at DESC LIMIT 5')
  ]))
  .then(([rq,ja])=>{
    console.log('review_queue (latest 10):', JSON.stringify(rq.rows,null,2));
    console.log('job_applications (latest 5):', JSON.stringify(ja.rows,null,2));
    return c.end();
  });
"
```

---

## Step 8 — Summary

Output a short report:

```
/job-test results — [scan date]
Threads read: [N] (of [total found], capped at 5)
Duplicates skipped: [N]
New listings written:
  review_queue: [N] (To Assess: N, Needs Info: N)
  job_applications: [N] (To Apply: N, Dismissed: N)

[List each written listing: title @ company → status]

Supabase write: ✅ PASS  (or ❌ FAIL if any insert errored)
```

If all inserts succeeded → the pipeline works. The daily scan skill can now be rewritten to use the same Bash+node pattern.

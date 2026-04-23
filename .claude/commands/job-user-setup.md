---
description: Guided setup for a new user of the job search system. Creates Notion document pages, fills in their profile through a conversational interview, writes config.json, and schedules the daily scan. Also handles adding a second user on the same computer (shared device setup). Also runs as a workspace verifier/repair tool — pass "verify" to check all required resources exist and fix anything missing. Trigger with /job-user-setup.
argument-hint: Leave blank to be asked upfront. Pass "new", "add-user", "verify", or "update" to skip the opening question.
allowed-tools: mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-update-page, Bash, RemoteTrigger
---

# Job Search System — User Setup

## First step — ask the user what they need

If `$ARGUMENTS` is blank, ask this as the very first message:

> "Hi! Which of these describes your situation?
>
> 1. **I'm setting this up for the first time** — new user, first setup on this computer
> 2. **I'm a second user on this computer** — someone else already has this running. I want my own separate job search.
> 3. **Check my workspace** — verify everything is set up correctly and fix anything missing
> 4. **Update my profile** — add to my questionnaire answers or run the AI coverage review
>
> Type 1, 2, 3, or 4."

- Answer **1** or "new" → proceed with full setup (Phase 0 onwards)
- Answer **2** or "add-user" → jump to Phase 0b (additional user path)
- Answer **3** or "verify" → jump directly to Phase 12 (Workspace Verification)
- Answer **4** or "update" → skip Phases 0–2, jump directly to Phase 6b

If `$ARGUMENTS` is already **"verify"**, **"update"**, **"new"**, or **"add-user"** — skip the question and use that directly.

---

## Phase 0b — Additional User Setup

*Only runs when user selects option 2 / "add-user". Skip to Phase 0 for all other paths.*

This path sets up a completely separate job search workspace for a second person on the same computer. They share the same Claude login and Notion connection but get their own Notion pages, config, and profile — their data will never mix with the first user's.

### Step 0b-1 — Welcome

Say:
> "Great! I'll set up your own separate job search workspace alongside the existing one.
> Your listings, applications, and profile will be completely private from theirs.
>
> To switch between users, type /job-user-select
>
> Let's get started. What's your first name?"

Wait for their name. Save it as `new_user_name` (lowercased, no spaces).

### Step 0b-2 — Find existing profile

Run via Bash:
```bash
cat .active-profile 2>/dev/null || echo "MISSING"
```

Read the existing config to reuse the Supabase connection and pg module path:
```bash
node -e "const c=JSON.parse(require('fs').readFileSync('config.json','utf8')); console.log(JSON.stringify({pg:c.pg_module_path,conn:c.supabase_connection_string}));"
```

Store `existing_pg_module` and `existing_supabase_connection_string` — they will be written to the new user's config file (they share the same Supabase project).

### Step 0b-3 — Continue with standard flow (modified)

- **Phase 0** (check Notion): **SKIP** — Notion is already connected
- **Phase 1** (welcome): Show a shortened version — "I'll now set up your personal profile."
- **Phase 2** (create Notion pages): **Run normally** — creates a brand new separate Notion workspace
- **Phases 3–6c** (profile questions, CV, tone): **Run normally**
- **Phase 7** (create config): **MODIFIED** — use `existing_pg_module` and `existing_supabase_connection_string`. Write to `config-<new_user_name>.json` (not `config.json`). Then run:
  ```bash
  echo "<new_user_name>" > .active-profile
  cp config-<new_user_name>.json config.json
  ```
  Confirm: "Done — your config is saved. To switch back to the other user, run /job-user-select."

- **Phase 8** (Gmail): Ask first:
  > "Do you share a Gmail account with the other user on this computer, or do you have your own?
  > (shared / own)"
  - If **shared**: "Got it — your daily scan will search the same inbox. Your scan writes to your own Supabase rows, not theirs." Skip the Gmail connection steps.
  - If **own**: Run Phase 8 normally (connect Gmail to Claude, set up label).

- **Phases 9–11**: Run normally (schedule daily scan, AI coverage review, finish).

---

## Phase 0 — Check Notion is connected

Try a Notion search for any page. If it fails or returns an error, stop immediately and say:

> "Before we can start, you need to connect your Notion account to Claude. Here's how:
>
> 1. Open **claude.ai/settings** in your browser
> 2. Click **Integrations** (or **Connections**)
> 3. Find **Notion** and click **Connect**
> 4. Follow the steps to log in to Notion and authorise Claude
>
> Once that's done, come back here and type `/job-user-setup` again."

---

## Phase 1 — Welcome

Say in plain language (no jargon, no bullet points of features):

> "Welcome! I'm going to set up your personal job search system. By the end of this, you'll have:
> - Notion pages to store your candidate profile, CV templates, and application documents
> - A Supabase database to track every job you look at and apply for (already set up — I'll connect it)
> - A daily scan that automatically finds new job listings from your email alerts and adds them
> - A tool to draft tailored CVs and cover letters in minutes
>
> This will take about 15–20 minutes. I'll ask you questions one at a time — just answer in plain text.
> Let's start!"

---

## Phase 2 — Check for existing setup + create Notion workspace

First, search Notion for a page titled "Job Search". If found:
> "It looks like you already have a workspace set up. Would you like to start fresh (this won't delete
> anything — it creates a new workspace alongside the existing one) or update your existing profile?
> Type **new** or **update**."
- "update" → jump to Phase 3 but skip creating pages (load existing profile instead)
- "new" → continue below

Create these Notion pages (silently, no progress messages until complete):

1. Create a page titled **"Job Search"** — root of the Notion workspace
2. Create a sub-page titled **"📬 Daily Scans"** under Job Search
3. Create a sub-page titled **"Candidate Profile"** under Job Search
4. Create a sub-page titled **"CV Templates"** under Job Search
5. Create a sub-page titled **"Application Documents"** under Job Search
   After creating Application Documents, also create a sub-page titled **"CL Examples"** under it.
   Pre-seed the CL Examples page with a generic structural placeholder (call notion-update-page):
   > Generic CL Structure — Starting Template
   > [Opening] I am applying for the [role] at [Company]. With [X years] in [function], I offer [value].
   > [Body 1] At [Employer], I [achievement with metric] — directly relevant to [JD requirement].
   > [Body 2] Beyond [core skill], I bring [adjacent skill].
   > [Closing] I would welcome the chance to discuss this further.
   > NOTE: Replace this with your own cover letter after your first real application.

**Note on databases:** Job Applications, Target Companies, Open To-Dos, Review Queue, Networking Contacts, and France Travail Log are all in **Supabase** (PostgreSQL), not Notion. The Supabase schema is already defined in `schema.sql`. See Phase 7b for the Supabase setup check.

When all pages are done:
> "Done! I've created your Notion workspace with [N] pages. Here are the links:
> [list each with Notion URL]
>
> Now I need to ask you a few questions to personalise it for you."

---

## Phase 3 — Basic profile questions

Ask these one at a time. Collect answers into memory to write to config.json in Phase 7 (along with the Notion page IDs from Phase 2).

**Q1:** "What's your first name?"

**Q2:** "What city and country are you based in? For example: Grenoble, France or London, UK."

**Q3:** "What kind of roles are you looking for? Give me a few examples of job titles you'd be excited to apply for."

**Q4:** "What's the minimum salary you'd accept? (This is just a filter to save you time on applications that aren't worth it.)"
*(Also derive a hard-reject threshold at roughly 80% of this value.)*

**Q5:** "Do you strongly prefer permanent contracts, or are you open to fixed-term or contract work too? (permanent / open / flexible)"

**Q6:** "Is it important that your role uses English, or are you equally comfortable in jobs that are entirely in the local language? (yes — English matters / no — local language is fine / nice to have)"

---

## Phase 4 — Location zones

Explain simply:
> "The system automatically filters out job listings that are too far from you.
>
> - **Green** (easy commute): jobs you'd go in every day
> - **Yellow** (manageable): worth applying if they offer hybrid
> - **Orange** (long commute): only worth it if mostly remote
> - **Red** (too far): skip unless fully remote
>
> I'll set these up based on your location."

Based on the city given in Phase 3, suggest appropriate towns/departments for each zone.
Tell the user what you've set and ask: "Does this look right? Type 'yes' or describe any changes."

Collect the final zone lists for writing to config.json in Phase 7.

---

## Phase 5 — Job title alerts

Say:
> "I've pre-loaded a standard list of job titles for you to search for. These are the ones the
> system will monitor on job boards and in your Gmail alerts.
>
> Here's a quick summary: [list the main categories — FP&A, Finance Director, P2P, Supply Chain etc.]
>
> Are there any job titles specific to your field or industry that I should add?"

Collect additions for config.json.

---

## Phase 6 — CV upload and profile extraction

Ask:
> "Do you have your CV handy? Paste the text here and I'll use it to fill in more of your profile
> automatically.
> (Or type 'skip' to do this later — you can always add it through /job-user-profile)"

If CV pasted:
- Save the full CV text to the **Candidate Profile** Notion page (notion-update-page)
- Analyse it to extract: job titles held, seniority, industries, tenure at each role, key functional skills (FP&A, cost control, P2P, consolidation), systems and tools (SAP, Excel, Power BI, etc.), languages, accounting standards (GAAP, IFRS), notable employers
- Collect extracted background keywords for config.json `background` section
- Show a summary: "Based on your CV, here's what I've extracted: [list]"
- Ask: "Does anything look wrong or missing?"

Also ask:
> "Do you have a cover letter from a previous application that you were happy with?
> Paste it here and I'll use it to match your writing style going forward. (Or type 'skip')"

If pasted: save as a new page titled "My CL Example — [date]" under the CL Examples Notion page.

---

## Phase 6b — Deep profile questionnaire

After the CV (or if skipped), ask these additional questions — one at a time.
These capture things a CV doesn't show. Skip any already answered by the CV.

**"What industries do you want to stay in? And are there any you'd consider moving into?"**

**"What's your biggest professional strength that doesn't always come across on a CV?"**

**"Are there specific companies you already know you'd love to work for? I can add them to your target list."**
*(Save confirmed companies to Supabase `target_companies` table in Phase 7b)*

**"What would make a job a bad fit for you? Think about culture, management style, travel requirements, anything like that."**

**"What languages do you speak and at what level?"**

**"Any upcoming time constraints I should know about — like a notice period, planned holidays, family commitments?"**

Save each answer to the **Candidate Profile** Notion page as structured talking points under a "CL Context" section.

---

## Phase 6c — Writing Tone Profile

Tell the user:
> "Five quick exercises to capture your natural writing style — this helps me write cover letters
> that sound like you, not like a template. Takes about 3 minutes."

**Exercise 1:**
> "How would you describe your professional personality in 3 words?"

**Exercise 2:**
> "Rewrite this sentence in your own natural style:
> 'I am applying for the Finance Manager position at Acme Corp and believe my experience
> makes me an excellent candidate.'"
Analyse: formal vs. conversational, confident vs. modest, sentence length.

**Exercise 3:**
> "Which of these two closing lines feels more like you?
> A) 'I look forward to the opportunity to discuss my application further.'
> B) 'I'd be glad to chat further about how I can contribute to your team.'
> Or describe your own preferred closing."

**Exercise 4:**
> "Describe one professional achievement you're proud of — 2–3 sentences, the way you'd explain
> it to a smart friend (not the formal CV version)."
Analyse: active/passive voice, use of I vs. we, specific vs. vague, numerical vs. descriptive.

**Exercise 5:**
> "Is there anything about some cover letters that you find cringeworthy or off-putting?
> (e.g. too formal, too salesy, buzzwords, sounds desperate)"

After all 5, save a compiled **"Writing Tone Profile"** section to the **Candidate Profile** Notion page:
- Formality: Formal / Semi-formal / Conversational (derived)
- Confidence: Direct / Measured / Modest (derived)
- Sentence preference: Short / Medium / Long (derived)
- Voice: First-person active / mixed (derived)
- Avoid: [stated red lines]
- Sample phrase: [Exercise 2 rewrite]

If the user skips this phase: note "Tone profile not set — neutral register will be used until a real cover letter example is saved after the first application."

---

## Phase 7 — Create config.json

Using all values collected during Phases 3–6c, plus the Notion page IDs from Phase 2, write `config.json` to the project root via Bash.

Ask first for:
- **Supabase connection string** — from the user's Supabase project (Settings → Database → Connection string → URI). Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`
- **pg module path** — run `node -e "require.resolve('@modelcontextprotocol/server-postgres/node_modules/pg')"` via Bash to find it. If found, use that path. If not: ask the user to run `npm install -g @modelcontextprotocol/server-postgres` first, then retry.

Then write config.json:

```bash
node -e "
const fs=require('fs');
const cfg={
  supabase_connection_string:'<connection_string>',
  pg_module_path:'<pg_module_path>',
  user:{
    name:'<first_name>',
    email:'<email_if_provided>',
    base_city:'<city>',
    salary_floor_apply:<salary_number>,
    salary_floor_reject:<hard_reject_number>,
    language_preference:'<english_preference>'
  },
  background:{
    functional_expertise:[<skills_from_cv>],
    key_systems:[<systems_from_cv>],
    languages:[<languages>],
    accounting_standards:[<standards>],
    notable_employers:[<employers>]
  },
  location_zones:{
    green:[<green_cities>],
    yellow:[<yellow_cities>],
    orange:[<orange_cities>],
    red:[<red_cities>]
  },
  job_titles:[<titles_list>],
  gmail:{
    alert_sources:['jobalert.indeed.com','linkedin.com','alertes.cadremploi.fr','offres@diffusion.apec.fr'],
    label:'jobs',
    lookback_days:1
  },
  cv_approaches:[
    {id:'fpa-fr',name:'FP&A Focus',flag:'fpa-fr',description:'FP&A and financial planning roles, French JD'},
    {id:'fpa-en',name:'FP&A Focus',flag:'fpa-en',description:'FP&A and financial planning roles, English JD'},
    {id:'costcontrol-fr',name:'Cost Control Focus',flag:'costcontrol-fr',description:'Cost control, controlling roles, French JD'},
    {id:'raf-fr',name:'Standard / RAF',flag:'raf-fr',description:'RAF / DAF generalist roles, French JD'},
    {id:'hof-en',name:'Transformation Focus',flag:'hof-en',description:'Transformation / Head of Finance, English JD'}
  ],
  lifecycle_rules:{
    dedup_window_days:30,
    auto_expiry_days:60,
    salary_floor_apply:<salary_number>
  },
  notion:{
    candidate_profile_id:'<candidate_profile_page_id>',
    cv_templates_id:'<cv_templates_page_id>',
    application_docs_id:'<application_documents_page_id>',
    daily_scans_archive:'<daily_scans_page_id>'
  }
};
fs.writeFileSync('config.json',JSON.stringify(cfg,null,2));
console.log('OK');
"
```

Confirm: "config.json written. This file is gitignored — it stays on this machine and never gets pushed."

---

## Phase 7b — Supabase setup check

Verify the Supabase tables exist and the connection works:

```bash
PG_MODULE="<pg_module_path>" PG_CONN="<supabase_connection_string>" node -e "
const {Client}=require(process.env.PG_MODULE);
const c=new Client({connectionString:process.env.PG_CONN});
c.connect()
  .then(()=>c.query('SELECT table_name FROM information_schema.tables WHERE table_schema=\'public\' ORDER BY table_name'))
  .then(r=>{console.log(r.rows.map(x=>x.table_name));return c.end();})
  .catch(e=>{console.error(e.message);process.exit(1);});
"
```

Expected tables: `france_travail_log`, `job_applications`, `networking_contacts`, `open_todos`, `review_queue`, `scan_archive`, `target_companies`.

If any table is missing:
> "Some tables are missing from your Supabase project. Run the SQL in `schema.sql` via the Supabase Dashboard → SQL Editor, then come back and type `/job-user-setup verify`."

If connection fails:
> "Cannot connect to Supabase. Double-check the connection string in config.json — it should be the **Transaction** or **Session** pooler URI from Supabase Settings → Database."

If all tables present: "Supabase connection confirmed — all [N] tables found."

If any target companies were mentioned in Phase 6b, INSERT them:
```bash
PG_MODULE="..." PG_CONN="..." node -e "
const {Client}=require(process.env.PG_MODULE);
const c=new Client({connectionString:process.env.PG_CONN});
c.connect()
  .then(()=>c.query('INSERT INTO target_companies (company,tier,notes) VALUES ($1,$2,$3) RETURNING id',['<company>','B','Added during setup']))
  .then(r=>{console.log('id='+r.rows[0].id);return c.end();});
"
```

---

## Phase 8 — Gmail connection and alert setup

Say:
> "The daily scan reads your job alert emails from Gmail. Two things to set up:
>
> **Step 1 — Connect Gmail to Claude:**
> Open **claude.ai/settings** → Integrations → find Gmail → click Connect.
>
> **Step 2 — Create a Gmail label called 'jobs':**
> Open Gmail → Settings (gear icon) → See all settings → Filters and Blocked Addresses → Create a new filter.
> In the 'From' field, paste this list of email addresses: [gmail.alert_sources from config]
> Click 'Next', check 'Apply the label', select or create a label called **jobs**, then save.
>
> Let me know when you've done Step 1 and 2, or type 'skip' to do this later."

---

## Phase 9 — Schedule the daily scan

Say: "I'll set up your automatic daily scan now — this runs every morning and adds new job listings to Supabase."

Call `RemoteTrigger` with `action: create`:
- `name`: "[First Name]'s Daily Job Scan"
- `cron_expression`: "1 0 * * *"
- Message content:
  ```
  You are running the daily job alert Gmail scan.

  Step 1: Run `date +%Y-%m-%d` via Bash to get today's date. This is your `currentDate`.
  Step 2: Run `cat config.json` via Bash to load the user config.
  Step 3: Read the full skill instructions: .claude/commands/job-search-daily-scan.md
  Step 4: Execute the scan with no date arguments — use the date from Step 1 as `currentDate`.

  MCP tools available:
  - Gmail: mcp__claude_ai_Gmail__search_threads, mcp__claude_ai_Gmail__get_thread
  - Indeed: mcp__claude_ai_Indeed__get_job_details
  - Notion: mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-update-page

  All instructions are in .claude/commands/job-search-daily-scan.md — follow them exactly.
  ```
- MCP connections: Gmail + Notion + Indeed
- `session_context.allowed_tools`: ["Bash", "Read"]
- `session_context.model`: "claude-sonnet-4-6"
- `session_context.sources`: [{"git_repository": {"url": "https://github.com/zberlo12/grenoble-job-search"}}]

Confirm: "Daily scan scheduled. It will run every morning automatically."

---

## Phase 10 — AI coverage review

### Step A — Suggest additional job titles

Based on everything learned about the user (CV, questionnaire, background):
- Suggest 3–6 job titles they may not have thought of
- For each, explain in one plain sentence why it fits their background
- Ask: "Would you like to add any of these to your profile?"
- Add confirmed ones to `job_titles` in config.json

### Step B — Job board to-do page

Create a Notion page titled **"Job Alert Setup — [First Name]"** under Job Search with a checklist.

For each of these job boards, include a section with:
- A **clickable link** to the alert creation page for that board
- The **exact search string** to use for that board
  - **LinkedIn**: uses OR between titles, space-separated keywords, 50km radius option
  - **Indeed**: uses OR between titles, location field
  - **APEC** (France): uses OR, French titles only, location region dropdown
  - **Cadremploi**: comma-separated titles, location field
  - **HelloWork**: OR syntax, location
  - **Welcome to the Jungle**: keyword search, multi-select
  - **Michael Page / Page Personnel**: individual searches per keyword family, then save alert
  - **Robert Half**: search + save alert at results page
  - **Hays**: individual keyword searches, alert per search
- **Pre-filled title strings** from the user's `job_titles` config formatted for that board's specific syntax
- **Recommended settings** (location radius, frequency, CDI filter if available)
- **Board-specific notes** (e.g. APEC is French-only; LinkedIn catches most English-language roles; Indeed is best for volume)

### Step C — First Indeed search

Ask:
> "Would you like me to run a search on Indeed right now to immediately find job listings for you?
> This gives you your first results straight away rather than waiting until tomorrow morning.
> (yes / no)"

If yes: run `/job-search-indeed` with "both" scope.

### Step D — Profile completeness

Score the profile 0–100% based on:
- user.name + base_city in config.json: filled? (+10%)
- user salary floors in config.json: set? (+10%)
- background in config.json: at least 3 skills + systems? (+10%)
- location_zones in config.json: all four zones populated? (+10%)
- job_titles in config.json: at least 10 titles? (+10%)
- gmail.alert_sources in config.json: any sources listed? (+5%)
- notion IDs in config.json: all 4 page IDs present? (+10%)
- CV in Candidate Profile Notion page: present? (+15%)
- Phase 6b questionnaire answers in Candidate Profile: present? (+10%)
- Supabase target_companies: any listed? (+5%)
- Writing tone profile in Candidate Profile: present? (+5%)

Show the score and the top 2–3 things that would improve it most.

---

## Phase 11 — Finish

Run Phase 12 (Workspace Verification) first — it confirms everything was created correctly
and repairs any gaps before giving the final summary.

After Phase 12 completes, create a page titled **"Setup Checklist — [First Name]"** under Job Search with:
- Everything completed automatically (with Notion links + Supabase confirmation)
- Items still needing manual action (with direct links and plain-language instructions)
- Profile completeness score
- Suggested first skills to run: `/job-review` (to process any queued listings), `/job-apply` (when ready to apply)

Output a final plain-language summary:

> "You're all set, [Name]!
>
> Here's what's ready:
> - Your Notion workspace is live [link]
> - Your Supabase database is connected — [N] tables ready
> - config.json is written
> - Your daily scan runs every morning
> - Your profile is [N]% complete
>
> Here's what still needs your attention:
> [numbered list of any manual steps remaining]
>
> When you're ready to apply for your first job, type /job-apply.
> To see all your job listings, type /job-dashboard."

---

## Phase 12 — Workspace Verification & Repair

**This phase runs at the end of every setup AND as a standalone check (`/job-user-setup verify`).**

### Check 1 — config.json

```bash
cat config.json 2>/dev/null | node -e "
const c=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
const required=['supabase_connection_string','pg_module_path','user','location_zones','job_titles','notion'];
const missing=required.filter(k=>!c[k]);
console.log(missing.length===0?'OK':'MISSING: '+missing.join(', '));
"
```

If MISSING or file not found: "config.json is missing required fields — run Phase 7 again or run `/job-user-setup new`."

### Check 2 — Supabase connection

Run the same table check from Phase 7b. Report each table: ✓ or ✗.

### Check 3 — Notion document pages

Search Notion for each required resource by title. For anything missing, create it silently and note it in the output. Never overwrite existing items.

**Required Notion pages (search by exact title):**

| Title | Parent | Action if missing |
|---|---|---|
| Job Search | workspace root | Create page |
| 📬 Daily Scans | Job Search | Create blank page |
| Candidate Profile | Job Search | Create blank page |
| CV Templates | Job Search | Create blank page |
| Application Documents | Job Search | Create blank page |
| CL Examples | Application Documents | Create blank page with generic seed content |

After finding each page, confirm its ID matches the corresponding value in config.json `notion` section. If IDs differ, update config.json with the current Notion page IDs.

**Output the full report:**

```
Workspace check complete:

config.json:
✓ All required fields present

Supabase (N tables):
✓ job_applications
✓ review_queue
✓ target_companies
✓ networking_contacts
✓ france_travail_log
✓ open_todos
✓ scan_archive

Notion pages:
✓ Job Search [link]
✓ 📬 Daily Scans [link]
✓ Candidate Profile [link]
✓ CV Templates [link]
✓ Application Documents [link]
✓ CL Examples [link]
+ CL Examples — created [link]    ← only if created

Nothing was deleted or overwritten.
```

If everything is in order: "Workspace and config are fully set up."
If repairs were made: "Repaired [N] items. Everything is now ready."

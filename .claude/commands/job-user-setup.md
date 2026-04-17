---
description: Guided setup for a new user of the job search system. Creates their entire Notion workspace, fills in their profile through a conversational interview, configures credentials, and schedules the daily scan. Also handles adding a second user on the same computer (shared device setup for couples/families). Also runs as a workspace verifier/repair tool — pass "verify" to check all required pages and databases exist and create any that are missing. Trigger with /job-user-setup.
argument-hint: Leave blank to be asked upfront. Pass "new", "add-user", "verify", or "update" to skip the opening question.
allowed-tools: mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-create-database, mcp__claude_ai_Notion__notion-update-page, Bash, RemoteTrigger
---

# Job Search System — User Setup

## First step — ask the user what they need

If `$ARGUMENTS` is blank, ask this as the very first message:

> "Hi! Which of these describes your situation?
>
> 1. **I'm setting this up for the first time** — new Claude account, first user on this computer
> 2. **I'm a second user on this computer** — someone else already has this running (e.g. a partner or family member). I want my own separate job search.
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

This path sets up a completely separate job search workspace for a second person on the same
computer. They share the same Claude login and Notion connection but get their own databases,
pages, and profile — their data will never mix with the first user's.

### Step 0b-1 — Welcome

Say:
> "Great! I'll set up your own separate job search workspace alongside the existing one.
> Your listings, applications, and profile will be completely private from theirs.
>
> A few things to know:
> - You'll share the same Claude login and Notion connection on this computer
> - Your data will be completely separate — different databases, different pages
> - To switch between users, just type /job-user-select
>
> Let's get started. What's your first name?"

Wait for their name. Save it as `new_user_name` (lowercased, no spaces).

### Step 0b-2 — Find existing credentials

Run via Bash:
```bash
ls .env.* 2>/dev/null | grep -v template
```

This shows existing profiles. Find the active one:
```bash
cat .active-profile 2>/dev/null
```

Read the existing token for reuse:
```bash
ACTIVE=$(cat .active-profile 2>/dev/null); grep NOTION_API_TOKEN .env.$ACTIVE 2>/dev/null | cut -d= -f2
```

Store the token as `existing_token` — it will be written to the new user's `.env` file in Phase 7,
so they don't need to create their own Notion integration.

### Step 0b-3 — Continue with standard flow (modified)

- **Phase 0** (connect Notion): **SKIP** — Notion is already connected
- **Phase 1** (welcome): Show a shortened version — "I'll now set up your personal profile."
- **Phase 2** (create Notion workspace): **Run normally** — creates a brand new separate workspace
- **Phases 3–6c** (profile questions, CV, tone): **Run normally**
- **Phase 7** (credentials): **MODIFIED** — instead of asking for a new Notion token, say:

  > "Your workspace was created in the same Notion connection as [active user name].
  > I'll reuse the same token to connect you — no new integration needed.
  > Saving your credentials now..."

  Then:
  - Write `.env.<new_user_name>` with `existing_token` and the new profile page ID from Phase 2
  - Run `python setup.py --profile <new_user_name>` via Bash
  - Confirm: "Done — your credentials are saved and the system is pointing to your workspace."

- **Phase 8** (Gmail): Ask first:
  > "Do you share a Gmail account with the other user on this computer, or do you have your own?
  > (shared / own)"
  - If **shared**: "Got it — your daily scan will search the same inbox. Job alerts there will be added to your Notion, not theirs." Skip the Gmail connection steps.
  - If **own**: Run Phase 8 normally (connect Gmail to Claude, set up label).

- **Phases 9–11**: Run normally (schedule daily scan, AI coverage review, finish).

---

## Phase 0 — Check Notion is connected

Try a Notion search for any page. If it fails or returns an error, stop immediately and say:

> "Before we can start, you need to connect your Notion account to Claude. Here's how:
>
> 1. Open **[claude.ai/settings](https://claude.ai/settings)** in your browser
> 2. Click **Integrations** (or **Connections**)
> 3. Find **Notion** and click **Connect**
> 4. Follow the steps to log in to Notion and authorise Claude
>
> Once that's done, come back here and type `/job-user-setup` again."

---

## Phase 1 — Welcome

Say in plain language (no jargon, no bullet points of features):

> "Welcome! I'm going to set up your personal job search system. By the end of this, you'll have:
> - A private workspace in Notion to track every job you look at and apply for
> - A daily scan that automatically finds new job listings from your email alerts and adds them
> - A tool to draft tailored CVs and cover letters in minutes
>
> This will take about 15–20 minutes. I'll ask you questions one at a time — just answer in plain text.
> Let's start!"

---

## Phase 2 — Check for existing setup + create Notion workspace

First, search Notion for a page titled "⚙️ User Profile & Config". If found:
> "It looks like you already have a workspace set up. Would you like to start fresh (this won't delete
> anything — it creates a new workspace alongside the existing one) or update your existing profile?
> Type **new** or **update**."
- "update" → jump to Phase 3 but skip creating pages (load existing profile instead)
- "new" → continue below

Create all pages/databases in this order (all silently, no progress messages until complete):

1. Create a page titled **"Job Search"** — this is the root of the workspace
2. Create a sub-page titled **"⚙️ User Profile & Config"** under Job Search (blank — will be filled in later)
3. Create a sub-page titled **"📬 Daily Scans"** under Job Search
4. Create a sub-page titled **"Candidate Profile"** under Job Search
5. Create a sub-page titled **"CV Templates"** under Job Search
6. Create a sub-page titled **"Application Documents"** under Job Search
   After creating Application Documents, also create a sub-page titled **"CL Examples"** under it.
   Pre-seed the CL Examples page with a generic structural placeholder (call notion-update-page):
   > Generic CL Structure — Starting Template
   > [Opening] I am applying for the [role] at [Company]. With [X years] in [function], I offer [value].
   > [Body 1] At [Employer], I [achievement with metric] — directly relevant to [JD requirement].
   > [Body 2] Beyond [core skill], I bring [adjacent skill].
   > [Closing] I would welcome the chance to discuss this further.
   > NOTE: Replace this with your own cover letter after your first real application.
   This ensures /job-apply always has something to reference even before the user has any real CLs.
7. Create a database titled **"Job Applications"** under Job Search with these properties:
   - Job Title (title), Company (text), Source (select: Indeed/LinkedIn/Direct/Referral/Other),
     Location (text), Salary (text), Priority (select: A/B/C), CV Approach (select: Standard/FP&A Focus/Cost Control Focus/Transformation Focus),
     Status (select: To Assess/Needs Info/Potentially Apply/To Apply/Docs Ready/Applied/Interview/Offer/Rejected/Dismissed/On Hold),
     Date Added (date), Date Applied (date), Date Response (date), Job URL (url), Gmail Thread URL (url),
     Red Flags (multi-select: Low salary/French only/No hybrid/Far location/Fixed-term/Junior scope),
     Missing Info (multi-select: Salary/Hybrid policy/Scope/Full JD/Company name), Notes (rich text), English (checkbox)
8. Create a database titled **"Target Companies"** under Job Search:
   - Company (title), Tier (select: A/B/C/D), Sector (text), Location (text), Careers URL (url), Last Checked (date), Notes (text)
9. Create a database titled **"Open To-Dos"** under Job Search:
   - Task (title), Category (select), Priority (select), Due Date (date), Done (checkbox), Notes (text)

When all done:
> "Done! I've created your Notion workspace with [N] pages and databases. Here are the links:
> [list each with Notion URL]
>
> Now I need to ask you a few questions to personalise it for you."

---

## Phase 3 — Basic profile questions

Ask these one at a time. After each answer, update the "⚙️ User Profile & Config" page live.
Keep the questions short and in plain language.

**Q1:** "What's your first name?"
*(Save to Section 1 — Identity)*

**Q2:** "What city and country are you based in? For example: Grenoble, France or London, UK."
*(Save to Section 1)*

**Q3:** "What kind of roles are you looking for? Give me a few examples of job titles you'd be excited to apply for."
*(Save to Section 2 — Role & Compensation)*

**Q4:** "What's the minimum salary you'd accept? (Don't worry — this is just a filter to save you time on applications that aren't worth it.)"
*(Save to Section 2. Also derive a hard-reject threshold at roughly 80% of this value.)*

**Q5:** "Do you strongly prefer permanent contracts, or are you open to fixed-term or contract work too? (permanent / open / flexible)"
*(Save to Section 2)*

**Q6:** "Is it important that your role uses English, or are you equally comfortable in jobs that are entirely in the local language? (yes — English matters / no — local language is fine / nice to have)"
*(Save to Section 2)*

---

## Phase 4 — Location zones

Explain simply:
> "The system automatically filters out job listings that are too far from you. To set this up,
> I just need to know your base city — you already told me that. Here's how the zones work:
>
> - **Green** (easy commute): jobs you'd go in every day
> - **Yellow** (manageable): worth applying if they offer hybrid
> - **Orange** (long commute): only worth it if mostly remote
> - **Red** (too far): skip unless fully remote
>
> I'll set these up based on your location. You can always adjust them later."

Based on the city given in Phase 3, populate the four zone tables in Section 4 of the profile page.
Use geographic knowledge to suggest appropriate towns/departments for each zone.
Tell the user what you've set:
> "I've set up your commute zones based on [city]. Green zone includes [examples], Yellow includes [examples]...
> Does this look right? Type 'yes' or describe any changes."

Update if needed.

---

## Phase 5 — Job title alerts

Say:
> "I've pre-loaded a standard list of job titles for you to search for. These are the ones the
> system will monitor on job boards. You can customise this list at any time in your Notion profile.
>
> Here's a quick summary: [list the main categories — FP&A, Finance Director, P2P, Supply Chain etc.]
>
> Are there any job titles specific to your field or industry that I should add?"

Save user's additions to Section 5 of the profile.

---

## Phase 6 — CV upload and profile extraction

Ask:
> "Do you have your CV handy? Paste the text here and I'll use it to fill in more of your profile
> automatically. This saves you answering a lot more questions.
> (Or type 'skip' to do this later — you can always add it through /job-user-profile)"

If CV pasted:
- Save the full CV text to the Candidate Profile page in Notion
- Analyse it immediately to extract:
  - Job titles held, seniority, industries, tenure at each role
  - Key functional skills (e.g. FP&A, cost control, P2P, consolidation)
  - Systems and tools mentioned (SAP, Excel, Power BI, etc.)
  - Languages mentioned
  - Accounting standards (GAAP, IFRS, etc.)
  - Notable employers
- Update Section 3 (Background Keywords) of the profile with what you found
- Suggest additions to Section 5 (Job Title Alerts) based on the CV
- Show a summary: "Based on your CV, here's what I've added to your profile: [list]"
- Ask: "Does anything look wrong or missing?"

Also ask after CV is saved:
> "Do you have a cover letter from a previous application that you were happy with?
> Paste it here and I'll use it to match your writing style going forward. (Or type 'skip')"
If pasted: save as a new page titled "My CL Example — [date]" under the CL Examples page.
This replaces the generic placeholder as the style reference for all future cover letters.

---

## Phase 6b — Deep profile questionnaire

After the CV (or if skipped), ask these additional questions — one at a time.
These capture things a CV doesn't show. Skip any already answered by the CV.

**"What industries do you want to stay in? And are there any you'd consider moving into?"**

**"What's your biggest professional strength that doesn't always come across on a CV?"**

**"Are there specific companies you already know you'd love to work for? I can add them to your target list."**

**"What would make a job a bad fit for you? Think about culture, management style, travel requirements, anything like that."**

**"What languages do you speak and at what level?"**

**"Any upcoming time constraints I should know about — like a notice period, planned holidays, family commitments?"**

Save each answer to the Candidate Profile page as structured talking points under a "CL Context" section.

---

## Phase 6c — Writing Tone Profile

Tell the user:
> "Five quick exercises to capture your natural writing style — this helps me write cover letters
> that sound like you, not like a template. Takes about 3 minutes."

**Exercise 1:**
> "How would you describe your professional personality in 3 words?"
Save to Candidate Profile: `Tone: Self-description = [answer]`

**Exercise 2:**
> "Rewrite this sentence in your own natural style:
> 'I am applying for the Finance Manager position at Acme Corp and believe my experience
> makes me an excellent candidate.'"
Analyse: formal vs. conversational, confident vs. modest, sentence length.
Save: `Tone: Rewrite sample = [their version] | Analysis = [formal/conversational, direct/modest]`

**Exercise 3:**
> "Which of these two closing lines feels more like you?
> A) 'I look forward to the opportunity to discuss my application further.'
> B) 'I'd be glad to chat further about how I can contribute to your team.'
> Or describe your own preferred closing."
Save: `Tone: Style preference = [A/B/own version]`

**Exercise 4:**
> "Describe one professional achievement you're proud of — 2–3 sentences, the way you'd explain
> it to a smart friend (not the formal CV version)."
Analyse: active/passive voice, use of I vs. we, specific vs. vague, numerical vs. descriptive.
Save: `Tone: Natural achievement = [their text] | Voice = [analysis]`

**Exercise 5:**
> "Is there anything about some cover letters that you find cringeworthy or off-putting?
> (e.g. too formal, too salesy, buzzwords, sounds desperate)"
Save: `Tone: Avoid = [answer]`

After all 5, save a compiled **"Writing Tone Profile"** section to the Candidate Profile page:
- Formality: Formal / Semi-formal / Conversational (derived)
- Confidence: Direct / Measured / Modest (derived)
- Sentence preference: Short / Medium / Long (derived)
- Voice: First-person active / mixed (derived)
- Avoid: [stated red lines]
- Sample phrase: [Exercise 2 rewrite]

If the user skips this phase: note "Tone profile not set — neutral register will be used until
a real cover letter example is saved after the first application."

---

## Phase 7 — Set up local credentials

Say:
> "Almost there. To connect this system to your Notion workspace, I need a private token.
> Here's how to get it — it takes about 2 minutes:
>
> 1. Open **[notion.so/my-integrations](https://www.notion.so/my-integrations)** in your browser
> 2. Click **New integration**
> 3. Give it any name (e.g. 'Claude Job Search')
> 4. Click **Submit**
> 5. Copy the token shown — it starts with `secret_`
>
> Paste it here:"

Wait for the token. Then:
- Write it to `.env.<name>` (using first name from Phase 3, lowercased)
- Run `python setup.py --profile <name>` via Bash
- If Python is not found: "It looks like Python isn't installed on this computer. You can download it for free at **[python.org/downloads](https://www.python.org/downloads)**. Install it, then come back and type `/job-user-setup update` to continue."
- If setup.py succeeds: "Your credentials are saved. The system is now connected to your Notion workspace."

Also update Section 7 (Notion IDs) of the profile page with all the IDs of the pages and databases created in Phase 2.

---

## Phase 8 — Gmail connection and alert setup

Say:
> "The daily scan reads your job alert emails from Gmail. Two things to set up:
>
> **Step 1 — Connect Gmail to Claude:**
> Open **[claude.ai/settings](https://claude.ai/settings)** → Integrations → find Gmail → click Connect.
>
> **Step 2 — Create a Gmail label called 'jobs':**
> Open **[Gmail](https://mail.google.com)** → Settings (gear icon) → See all settings → Filters and Blocked Addresses → Create a new filter.
> In the 'From' field, paste this list of email addresses from your profile.
> Click 'Next', check 'Apply the label', select or create a label called **jobs**, then save.
>
> (You'll also need to set up job alert emails from LinkedIn, Indeed, and other job boards — I'll create
> a step-by-step guide for this in the next phase.)
>
> Let me know when you've done Step 1 and 2, or type 'skip' to do this later."

---

## Phase 9 — Schedule the daily scan

Say: "I'll set up your automatic daily scan now — this runs every morning and adds new job listings to your Notion."

Call `RemoteTrigger` with `action: create`:
- `name`: "[First Name]'s Daily Job Scan"
- `cron_expression`: "1 0 * * *"
- Message content:
  ```
  You are running the daily job alert Gmail scan for the user in the connected Notion workspace.

  Step 1: Run `date +%Y-%m-%d` via Bash to get today's date. This is your `currentDate`.
  Step 2: Load the user profile — search Notion for the page titled "⚙️ User Profile & Config" using mcp__claude_ai_Notion__notion-search, then fetch the first result.
  Step 3: Read the full skill instructions: .claude/commands/job-search-daily-scan.md
  Step 4: Execute the scan with no date arguments — use the date from Step 1 as `currentDate`.

  MCP tools available:
  - Gmail: mcp__claude_ai_Gmail__search_threads, mcp__claude_ai_Gmail__get_thread
  - Notion: mcp__claude_ai_Notion__* (read/write)

  All instructions are in .claude/commands/job-search-daily-scan.md — follow them exactly.
  ```
- MCP connections: Gmail + Notion
- `session_context.allowed_tools`: ["Bash", "Read", "Write", "Edit", "Glob", "Grep"]
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
- Add confirmed ones to Section 5

### Step B — Job board to-do page

Create a Notion page titled **"Job Alert Setup — [First Name]"** under Job Search with a checklist.

For each of these job boards, include a section with:
- A **clickable link** to the alert creation page for that board
- The **exact search string** to use for that board (each has different syntax):
  - **LinkedIn**: uses OR between titles, space-separated keywords, 50km radius option
  - **Indeed**: uses OR between titles, location field
  - **APEC** (France): uses OR, French titles only, location region dropdown
  - **Cadremploi**: comma-separated titles, location field
  - **HelloWork**: OR syntax, location
  - **Welcome to the Jungle**: keyword search, multi-select
  - **Michael Page / Page Personnel**: individual searches per keyword family, then save alert
  - **Robert Half**: search + save alert at results page
  - **Hays**: individual keyword searches, alert per search
- **Pre-filled title strings** from the user's profile formatted for that board's specific syntax
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
- Section 1 Identity: filled? (+10%)
- Section 2 Role & Compensation: all fields? (+15%)
- Section 3 Background: at least 3 skills + systems? (+10%)
- Section 4 Location Zones: all four zones? (+10%)
- Section 5 Job Titles: at least 10 titles? (+10%)
- Section 6 Gmail Sources: any sources listed? (+5%)
- Section 7 Notion IDs: all IDs present? (+10%)
- CV in Candidate Profile: present? (+15%)
- Phase 6b questionnaire answers: present? (+10%)
- Target companies in Section 10: any listed? (+5%)

Show the score and the top 2–3 things that would improve it most.

---

## Phase 11 — Finish

Run Phase 12 (Workspace Verification) first — it confirms everything was created correctly
and repairs any gaps before giving the final summary.

After Phase 12 completes:

Create a page titled **"Setup Checklist — [First Name]"** under Job Search with:
- Everything completed automatically (with Notion links)
- Items still needing manual action (with direct links and plain-language instructions)
- Profile completeness score
- Suggested first skills to run: `/job-review` (to process any queued listings), `/job-apply` (when ready to apply)

Output a final plain-language summary:

> "You're all set, [Name]!
>
> Here's what's ready:
> - Your Notion workspace is live [link]
> - Your daily scan runs every morning
> - Your profile is [N]% complete
>
> Here's what still needs your attention (links are in your Setup Checklist in Notion):
> [numbered list of any manual steps remaining]
>
> When you're ready to apply for your first job, type /job-apply.
> To see all your job listings, type /job-dashboard."

---

## Phase 12 — Workspace Verification & Repair

**This phase runs at the end of every setup AND as a standalone check (`/job-user-setup verify`).**

Search Notion for each required resource by title. For anything missing, create it silently
and note it in the output. Never overwrite existing items.

**Required pages (search by exact title):**

| Title | Parent | Action if missing |
|---|---|---|
| Job Search | workspace root | Create page |
| ⚙️ User Profile & Config | Job Search | Create blank page with section headings |
| 📬 Daily Scans | Job Search | Create blank page |
| Candidate Profile | Job Search | Create blank page |
| CV Templates | Job Search | Create blank page |
| Application Documents | Job Search | Create blank page |
| CL Examples | Application Documents | Create blank page with generic seed content |

**Required databases (search by exact title):**

| Title | Parent | Action if missing |
|---|---|---|
| Job Applications | Job Search | Create with full property schema from Phase 2 |
| Target Companies | Job Search | Create with schema from Phase 2 |
| Open To-Dos | Job Search | Create with schema from Phase 2 |
| Networking Contacts | Job Search | Create with schema from Phase 2 / P4 plan |

**After checking all Notion items, check local credentials:**

Run these Bash checks sequentially:

1. `cat .active-profile 2>/dev/null || echo "MISSING"`
   - If MISSING: credentials not configured — note this in the report.

2. If a profile name was found (e.g. "zack"):
   `test -f .env.zack && echo "EXISTS" || echo "MISSING"`
   - If MISSING: the `.env.<name>` file doesn't exist — note this in the report. Cannot auto-create (needs user's Notion token).

3. `python -c "import json; d=json.load(open('.mcp.json')); print('OK') if d.get('notion_config_page_id') and d['mcpServers']['notion']['env'].get('NOTION_API_TOKEN') else print('INCOMPLETE')" 2>/dev/null || echo "MISSING"`
   - If MISSING or INCOMPLETE: `.mcp.json` is absent or lacks required fields.
   - If the `.env.<name>` file exists but `.mcp.json` is wrong: run `python setup.py --profile <name>` to regenerate it automatically. Report the result.

**Output the full report:**

```
Workspace check complete:

Notion resources:
✓ Job Applications database [link]
✓ Target Companies database [link]
✓ ⚙️ User Profile & Config [link]
[etc.]
+ Networking Contacts database — created [link]    ← only if created

Local credentials:
✓ Active profile: zack
✓ .env.zack exists
✓ .mcp.json is valid

[OR if something was wrong:]
✗ .mcp.json was outdated — regenerated from .env.zack
✗ .env.zack not found — to fix, copy .env.template to .env.zack and fill in your Notion token and profile page ID, then run: python setup.py --profile zack

Nothing was deleted or overwritten.
```

If everything is in order: "Workspace and credentials are fully set up."
If repairs were made: "Repaired [N] items. Everything is now ready."
If the `.env` file is missing: explain exactly what the user needs to do — never fail silently.

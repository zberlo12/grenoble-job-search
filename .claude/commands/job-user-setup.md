---
description: Guided setup for a new user of the job search system. Creates their entire Notion workspace, fills in their profile through a conversational interview, configures credentials, and schedules the daily scan. Everything is done automatically — the user only answers questions. Can also run in update mode for existing users (type /job-user-setup update). Trigger with /job-user-setup.
argument-hint: Leave blank for full setup. Pass "update" to run the AI coverage review and questionnaire on an existing profile without recreating the workspace.
allowed-tools: mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-create-database, mcp__claude_ai_Notion__notion-update-page, Bash, RemoteTrigger
---

# Job Search System — User Setup

## Update mode

If `$ARGUMENTS` is "update", skip Phases 0–2 and jump directly to Phase 6b.
This runs the deep questionnaire and AI coverage review on an existing profile without recreating the workspace.

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

Run `/job-dashboard` to verify the Notion connection is working.

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
